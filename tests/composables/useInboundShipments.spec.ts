import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn(async (_request: any) => ({ data: {} })));
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));

import { useInboundShipments } from '@/composables/useInboundShipments';

describe('inbound shipment writes (preorder-maarg#84)', () => {
  beforeEach(() => api.mockClear());

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
});
