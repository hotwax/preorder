import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => vi.fn(async (_request: any) => ({ data: {} })));
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));
vi.mock('@/store/productStore', () => ({ useProductStore: () => ({ getCurrentProductStoreId: 'STORE' }) }));

import { useInboundShipments } from '@/composables/useInboundShipments';
import { useInboundShipmentSearchStore } from '@/store/inboundShipmentSearch';
import { SOLR_SETTLE_MS, usePurchaseOrderSearchStore } from '@/store/purchaseOrderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { usePreorderSearchStore } from '@/store/preorderSearch';

describe('inbound shipment writes (preorder-maarg#84)', () => {
  beforeEach(() => { api.mockReset(); setActivePinia(createPinia()); });

  it('creates a shipment through poorti purchaseShipments with per-line quantities', async () => {
    api.mockResolvedValueOnce({ data: { shipmentId: 'S1' } });
    const data = { orderId: 'PO1', externalId: 'ASN-1', arrivalDate: '2027-03-01', items: [{ orderItemSeqId: '01', quantity: 3 }] };
    expect(await useInboundShipments().createShipment(data)).toEqual({ shipmentId: 'S1' });
    expect(api.mock.calls[0][0]).toMatchObject({ url: 'poorti/purchaseShipments', method: 'post', data });
  });

  it('receives a shipment with the quantities accepted and rejected of each item', async () => {
    api.mockResolvedValueOnce({ data: { receiptIds: ['R1'], fullyReceived: false } });
    const items = [{ shipmentItemSeqId: '00001', quantityAccepted: 2, quantityRejected: 1 }];
    expect(await useInboundShipments().receiveShipment('S/1', items)).toEqual({ receiptIds: ['R1'], fullyReceived: false });
    expect(api.mock.calls[0][0]).toMatchObject({ url: 'poorti/purchaseShipments/S%2F1/receive', method: 'post', data: { shipmentId: 'S/1', items } });
  });

  it('refreshes a previously visited shipment list after creating a shipment', async () => {
    const store = useInboundShipmentSearchStore();
    api.mockResolvedValueOnce({ data: { shipments: [], shipmentsCount: 0 } });
    await store.runSearch();
    api.mockResolvedValueOnce({ data: { shipmentId: 'S1' } });
    await useInboundShipments().createShipment({ orderId: 'PO1', externalId: 'ASN-1', arrivalDate: '2027-03-01', items: [] });
    expect([store, usePurchaseOrderSearchStore(), useFutureInventorySearchStore(), usePreorderSearchStore()].every((search) => search.stale)).toBe(true);
    api.mockResolvedValueOnce({ data: { shipments: [{ shipmentId: 'S1' }], shipmentsCount: 1 } });
    await store.runSearch();
    expect(store.results.map((shipment) => shipment.shipmentId)).toEqual(['S1']);
  });

  it('refreshes shipment, PO, future inventory and preorder lists after a receipt commits', async () => {
    const stores = [useInboundShipmentSearchStore(), usePurchaseOrderSearchStore(), useFutureInventorySearchStore(), usePreorderSearchStore()];
    stores.forEach((store) => { store.loaded = true; });
    api.mockResolvedValueOnce({ data: { receiptIds: ['R1'] } });
    const started = Date.now();
    await useInboundShipments().receiveShipment('S1', [{ shipmentItemSeqId: '01', quantityAccepted: 1, quantityRejected: 0 }]);
    expect(stores.every((store) => store.stale)).toBe(true);
    expect(usePurchaseOrderSearchStore().settlesAt).toBeGreaterThanOrEqual(started + SOLR_SETTLE_MS);
  });

  it('does not invalidate loaded lists when a shipment write is rejected', async () => {
    const store = useInboundShipmentSearchStore();
    store.loaded = true;
    api.mockRejectedValueOnce(new Error('Shipment is cancelled'));
    await expect(useInboundShipments().receiveShipment('S1', [])).rejects.toThrow('Shipment is cancelled');
    expect(store.stale).toBe(false);
  });
});
