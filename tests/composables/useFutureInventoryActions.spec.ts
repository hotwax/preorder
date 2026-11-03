import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn(async (_request: any) => ({ data: {} })));
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));
vi.mock('@/store/storeFacilities', () => ({ useStoreFacilitiesStore: () => ({ scopeFor: async () => ({ facilityIds: [] }) }) }));
vi.mock('@/composables/useParkingFacilities', () => ({ useParkingFacilities: () => ({ isParking: () => false }) }));

import { useFutureInventoryActions } from '@/composables/useFutureInventoryActions';

/** A batch from a NetSuite purchase order line, as GET oms/futureInventoryItems/{id} returns it. */
const batch = (id: string, line: Record<string, any> = {}) => ({
  futureInventoryItemId: id, productId: 'M100004',
  purchaseOrderHeader: { orderId: 'M100409', externalId: '91002' },
  purchaseOrderItem: { orderItemSeqId: '01', productId: 'M100004', quantity: 4, externalId: '91002-1', ...line },
});

/** Answers batch reads from `batches`, the upload with log L1 and the log read with `log`. */
function answer(batches: Record<string, any>, log: Record<string, any> = { logId: 'L1', statusId: 'DmlsFinished', failedRecordCount: 0 }) {
  api.mockImplementation(async (request: any) => {
    if (request.url.startsWith('oms/futureInventoryItems/')) return { data: batches[request.url.split('/').pop()] };
    if (request.url === 'admin/uploadDataManagerFile') return { data: { logId: 'L1' } };
    if (request.url === 'admin/dataManager/details') return { data: { dataManagerLogs: [log] } };
    return { data: {} };
  });
}

/** The CSV text of the file the last upload sent. */
async function uploadedCsv() {
  const upload = api.mock.calls.map((call: any) => call[0]).find((request: any) => request.url === 'admin/uploadDataManagerFile');
  expect(upload.data.get('configId')).toBe('IMPORT_PO');
  return (upload.data.get('contentFile') as File).text();
}

describe('batch changes through the purchase order line', () => {
  beforeEach(() => { api.mockReset(); });

  it('sends a promise date change as the line\'s arrival date, with its current quantity', async () => {
    answer({ M100307: batch('M100307') });
    await useFutureInventoryActions().updateBatch('M100307', { promiseDate: '2027-01-25' });
    expect(await uploadedCsv()).toBe('externalId,productId,orderItemExternalId,quantity,arrivalDate,statusId\n'
      + '"91002","M100004","91002-1","4","2027-01-25",""');
  });

  it('sends a quantity adjustment as the line\'s new quantity', async () => {
    answer({ M100307: batch('M100307') });
    await useFutureInventoryActions().updateBatch('M100307', { quantityDiff: -1 });
    expect((await uploadedCsv()).split('\n')[1]).toBe('"91002","M100004","91002-1","3","",""');
  });

  it('cancels a batch by cancelling its line', async () => {
    answer({ M100307: batch('M100307') });
    await useFutureInventoryActions().cancelBatch('M100307');
    expect((await uploadedCsv()).split('\n')[1]).toBe('"91002","M100004","91002-1","4","","ITEM_CANCELLED"');
  });

  it('sends one file for several batches and counts a batch without a purchase order line as failed', async () => {
    answer({ A: batch('A'), B: { futureInventoryItemId: 'B', productId: 'M1' } });
    const result = await useFutureInventoryActions().updateBatches(['A', 'B'], { promiseDate: '2027-01-25' });
    expect(result).toEqual({ done: 1, failed: 1 });
    expect((await uploadedCsv()).split('\n')).toHaveLength(2);
  });

  it('fails when the import rejects the line', async () => {
    answer({ M100307: batch('M100307') }, { logId: 'L1', statusId: 'DmlsFinished', failedRecordCount: 1 });
    await expect(useFutureInventoryActions().updateBatch('M100307', { promiseDate: '2027-01-25' })).rejects.toThrow();
  });
});
