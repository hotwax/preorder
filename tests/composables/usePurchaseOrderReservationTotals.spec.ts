import { beforeEach, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn());
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';

beforeEach(() => { api.mockReset(); });

it.each([
  { statusId: 'FUTURE_INV_EXPIRED', reserved: 0, onOrder: 1, atp: 0, inferred: 1 },
  { statusId: 'FUTURE_INV_CANCELLED', reserved: 2, onOrder: 0, atp: 0, inferred: 0 },
  { statusId: 'FUTURE_INV_ACTIVE', reserved: 2, onOrder: 5, atp: 3, inferred: 2 },
])('keeps the persisted reservation total for a $statusId batch', async ({ statusId, reserved, onOrder, atp, inferred }) => {
  api.mockImplementation(async ({ url }) => {
    if (url === 'oms/purchaseOrders/PO1') return { data: { order: { orderId: 'PO1', items: [
      { orderItemSeqId: '01', quantity: 5, futureInventoryReserved: reserved },
    ] } } };
    if (url === 'oms/futureInventoryItems') return { data: [{ futureInventoryItemId: 'FI1', poItemSeqId: '01', statusId,
      quantityOnOrderTotal: onOrder, availableToPromiseTotal: atp, reservedQuantity: inferred }] };
    if (url.endsWith('/receipts')) return { data: [] };
    throw new Error(`Unexpected request: ${url}`);
  });
  const order = await usePurchaseOrderActions().fetchPurchaseOrder('PO1');
  expect(order.items[0].futureInventoryReserved).toBe(reserved);
  expect(order.items[0].futureInventoryAvailableToPromise).toBe(atp);
});
