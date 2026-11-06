import { beforeEach, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn());
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';

beforeEach(() => { api.mockReset(); });

it.each([
  { quantity: 10, cancelQuantity: 3, received: 2, nativeOpen: 5, expected: 5 },
  { quantity: 10, cancelQuantity: 8, received: 2, nativeOpen: 0, expected: 0 },
  { quantity: 10, cancelQuantity: 3, received: 2, nativeOpen: undefined, expected: 5 },
  { quantity: 2, cancelQuantity: 2, received: 1, nativeOpen: undefined, expected: 0 },
  { quantity: 10, cancelQuantity: 0, received: 0, nativeOpen: 10, expected: 0, statusId: 'ITEM_CANCELLED' },
  { quantity: 10, cancelQuantity: 0, received: 0, nativeOpen: 10, expected: 0, statusId: 'ITEM_COMPLETED' },
])('does not count cancelled units as supply still to arrive: %j', async ({ quantity, cancelQuantity, received, nativeOpen, expected, statusId = 'ITEM_APPROVED' }) => {
  api.mockImplementation(async ({ url }) => {
    if (url === 'oms/purchaseOrders/PO1') return { data: { order: { orderId: 'PO1', items: [
      { orderItemSeqId: '01', statusId, quantity, cancelQuantity, openQuantity: nativeOpen },
    ] } } };
    if (url === 'oms/futureInventoryItems') return { data: [] };
    if (url.endsWith('/receipts')) return { data: [{ orderItemSeqId: '01', quantityAccepted: received }] };
    throw new Error(`Unexpected request: ${url}`);
  });
  const order = await usePurchaseOrderActions().fetchPurchaseOrder('PO1');
  expect(order.items[0].openQuantity).toBe(expected);
  expect(order.items[0].receivedQuantity).toBe(received);
});
