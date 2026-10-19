import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { releasableLines, waitingLines } from '@/utils/preorderLines';
import type { PreorderOrder } from '@/types';

/** Cancel reasons only an integration sets: a Shopify cancel, a BOPIS conversion. */
const SYSTEM_CANCEL_REASONS = ['SHOPIFY_CANCELLATION', 'CH_BOPIS_TO_STS'];

/** Pre-order requests: one order, and the bulk and line actions the Pre-orders pages offer. */
export function usePreorderActions() {
  async function fetchPreorder(orderId: string): Promise<PreorderOrder> {
    const data = await ensureOk(api({ url: `oms/preorders/${encodeURIComponent(orderId)}`, method: 'get' }), 'Failed to load the pre-order.');
    return data.order;
  }

  /**
   * Moves the lines waiting at parking (an open reservation, at a parking facility) of each order to `_NA_`, so routing
   * can broker them. One request per line; the result counts what moved and what failed, so a partial run says so.
   */
  async function releaseToBrokering(orders: PreorderOrder[]) {
    let moved = 0; let failed = 0;
    for (const order of orders) {
      for (const line of releasableLines(order)) {
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

  /**
   * The reasons a line can be cancelled for (ODR_ITM_CH_REASON), less the ones only integrations set. A cancel with no
   * reason cancels nothing: OMS answers 200 with a warning (preorder-maarg#89).
   */
  async function fetchCancelReasons(): Promise<{ value: string; label: string }[]> {
    const data = await ensureOk(api({ url: 'admin/enums', method: 'get', params: { enumTypeId: 'ODR_ITM_CH_REASON', pageSize: 100 } }), 'Failed to load the cancel reasons.');
    return (Array.isArray(data) ? data : [])
      .filter((reason: any) => !SYSTEM_CANCEL_REASONS.includes(reason.enumId))
      .map((reason: any) => ({ value: reason.enumId as string, label: (reason.description || reason.enumId) as string }));
  }

  /**
   * Cancels each order's waiting lines (an open reservation) for a reason; the cancel releases their reservations.
   * Committed or released lines stay. Counts what OMS reports cancelled, not what was sent: a line it skips (already
   * closed, an unknown reason) is counted as not cancelled.
   */
  async function cancelPreorderItems(orders: PreorderOrder[], reason: string) {
    let cancelled = 0; let failed = 0;
    for (const order of orders) {
      const items = waitingLines(order).map((line) => ({ orderItemSeqId: line.orderItemSeqId, reason }));
      if (!items.length) continue;
      try {
        const data = await ensureOk(api({ url: `oms/orders/${encodeURIComponent(order.orderId)}/items/cancel`, method: 'post', data: { orderId: order.orderId, items } }), 'Failed to cancel the items.');
        const done = new Set((data?.cancelledItems || []).map((item: any) => item.orderItemSeqId));
        const count = items.filter((item) => done.has(item.orderItemSeqId)).length;
        cancelled += count;
        failed += items.length - count;
      } catch {
        failed += items.length;
      }
    }
    return { cancelled, failed };
  }

  async function reallocateLine(orderId: string, orderItemSeqId: string, fromFutureInventoryItemId: string, toFutureInventoryItemId: string) {
    return ensureOk(api({
      url: `oms/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(orderItemSeqId)}/reallocate`,
      method: 'post',
      data: { fromFutureInventoryItemId, toFutureInventoryItemId },
    }), 'Failed to move the reservation.');
  }

  return { fetchPreorder, releaseToBrokering, fetchCancelReasons, cancelPreorderItems, reallocateLine };
}
