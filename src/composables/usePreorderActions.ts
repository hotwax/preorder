import { api } from '@common';
import { ensureOk } from '@/utils/response';
import type { PreorderOrder } from '@/types';

const CLOSED_ITEM_STATUSES = ['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'];

/** Pre-order requests: one order, and the bulk and line actions the Pre-orders pages offer. */
export function usePreorderActions() {
  async function fetchPreorder(orderId: string): Promise<PreorderOrder> {
    const data = await ensureOk(api({ url: `preorder/preorders/${encodeURIComponent(orderId)}`, method: 'get' }), 'Failed to load the pre-order.');
    return data.order;
  }

  /** The open FI lines of an order still waiting at pre-order or back-order parking. */
  const parkedLines = (order: PreorderOrder) => (order.lines || []).filter((line) => line.atParking && !CLOSED_ITEM_STATUSES.includes(line.itemStatusId || ''));

  /** The open FI lines of an order, the ones a cancel can still take. */
  const openLines = (order: PreorderOrder) => (order.lines || []).filter((line) => !CLOSED_ITEM_STATUSES.includes(line.itemStatusId || ''));

  /**
   * Moves the parked lines of each order to `_NA_`, so routing can broker them. One request per line;
   * the result counts what moved and what failed, so a partial run says so.
   */
  async function releaseToBrokering(orders: PreorderOrder[]) {
    let moved = 0; let failed = 0;
    for (const order of orders) {
      for (const line of parkedLines(order)) {
        try {
          await ensureOk(api({
            url: `oms/orders/${encodeURIComponent(order.orderId)}/moveItemToParking`,
            method: 'post',
            data: { orderId: order.orderId, orderItemSeqId: line.orderItemSeqId, shipGroupSeqId: line.shipGroupSeqId, toFacilityId: '_NA_', comments: 'Released from pre-order parking to brokering' },
          }), 'Failed to release the item.');
          moved++;
        } catch {
          failed++;
        }
      }
    }
    return { moved, failed };
  }

  /** Cancels each order's open FI lines; the cancel releases their reservations. */
  async function cancelPreorderItems(orders: PreorderOrder[]) {
    let cancelled = 0; let failed = 0;
    for (const order of orders) {
      const items = openLines(order).map((line) => ({ orderItemSeqId: line.orderItemSeqId }));
      if (!items.length) continue;
      try {
        await ensureOk(api({ url: `oms/orders/${encodeURIComponent(order.orderId)}/items/cancel`, method: 'post', data: { orderId: order.orderId, items } }), 'Failed to cancel the items.');
        cancelled += items.length;
      } catch {
        failed += items.length;
      }
    }
    return { cancelled, failed };
  }

  async function reallocateLine(orderId: string, orderItemSeqId: string, fromFutureInventoryItemId: string, toFutureInventoryItemId: string) {
    return ensureOk(api({
      url: `preorder/preorders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(orderItemSeqId)}/reallocate`,
      method: 'post',
      data: { fromFutureInventoryItemId, toFutureInventoryItemId },
    }), 'Failed to move the reservation.');
  }

  return { fetchPreorder, parkedLines, openLines, releaseToBrokering, cancelPreorderItems, reallocateLine };
}
