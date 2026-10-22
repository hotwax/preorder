import { api } from '@common';
import { ensureOk, ensureResponse } from '@/utils/response';
import { readEntityList } from '@/utils/query';
import { toOrderLinesQuery } from '@/utils/entityQueries';
import { isOpenLine } from '@/utils/preorders';
import { useParkingFacilities } from '@/composables/useParkingFacilities';
import type { PreorderLine, PreorderOrder } from '@/types';

/** One entry per order item: an item split over two batches has two lines but is moved or cancelled once. */
const uniqueItems = (lines: PreorderLine[]) => [...new Map(lines.map((line) => [`${line.shipGroupSeqId || ''}/${line.orderItemSeqId}`, line])).values()];

/** Pre-order requests: one order, and the bulk and line actions the Pre-orders pages offer. */
export function usePreorderActions() {
  const { isParking } = useParkingFacilities();

  /**
   * One order: its details (`oms/orders/{id}`: customer, item statuses) and the lines holding future inventory
   * (`oms/futureInventoryItems/lines`), joined by item.
   */
  async function fetchPreorder(orderId: string): Promise<PreorderOrder> {
    const [orderData, linesResp] = await Promise.all([
      ensureOk(api({ url: `oms/orders/${encodeURIComponent(orderId)}`, method: 'get' }), 'Failed to load the pre-order.'),
      ensureResponse(api({ url: 'oms/futureInventoryItems/lines', method: 'get', params: toOrderLinesQuery([orderId]) }), 'Failed to load the pre-order lines.'),
    ]);
    const detail = orderData?.orderDetail || {};
    const items = new Map<string, any>();
    (detail.shipGroups || []).forEach((group: any) => (group.items || []).forEach((item: any) => items.set(String(item.orderItemSeqId), item)));
    const lines = readEntityList<PreorderLine>(linesResp).rows.map((line) => ({
      ...line,
      itemStatusId: items.get(String(line.orderItemSeqId))?.itemStatusId,
      quantity: items.get(String(line.orderItemSeqId))?.quantity,
    }));
    return {
      orderId,
      orderName: detail.orderName,
      externalId: detail.orderExternalId,
      orderDate: detail.orderDate,
      statusId: detail.orderStatusId,
      productStoreId: detail.productStoreId,
      salesChannelEnumId: lines[0] ? (lines[0] as any).salesChannelEnumId : undefined,
      customerPartyId: detail.partyId,
      customerName: [detail.customerFirstName, detail.customerLastName].filter(Boolean).join(' ') || undefined,
      email: detail.billingEmail,
      lines,
    };
  }

  /** The open items of an order still waiting at pre-order or back-order parking. */
  const parkedLines = (order: PreorderOrder) => uniqueItems((order.lines || []).filter((line) => isParking(line.facilityId) && isOpenLine(line)));

  /** The open items of an order, the ones a cancel can still take. */
  const openLines = (order: PreorderOrder) => uniqueItems((order.lines || []).filter(isOpenLine));

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

  /**
   * The batches an order item was reallocated or cancelled from, read off the order's ledger rows
   * (`oms/orders/{id}/futureInventoryDetails`): a new reservation on one of them would not read as open, so a move there is refused.
   */
  async function fetchClosedBatchIds(orderId: string, orderItemSeqId: string): Promise<Set<string>> {
    const params: Record<string, string | number> = { orderItemSeqId, pageSize: 500 };
    const resp = await ensureResponse(api({ url: `oms/orders/${encodeURIComponent(orderId)}/futureInventoryDetails`, method: 'get', params }), 'Failed to load the reservation history.');
    return new Set(readEntityList<{ futureInventoryItemId: string; reasonEnumId?: string }>(resp).rows
      .filter((row) => row.reasonEnumId === 'FID_REALLOCATED' || row.reasonEnumId === 'FID_CANCELLED')
      .map((row) => row.futureInventoryItemId));
  }

  async function reallocateLine(orderId: string, orderItemSeqId: string, fromFutureInventoryItemId: string, toFutureInventoryItemId: string) {
    return ensureOk(api({
      url: `oms/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(orderItemSeqId)}/reallocate`,
      method: 'post',
      data: { fromFutureInventoryItemId, toFutureInventoryItemId },
    }), 'Failed to move the reservation.');
  }

  return { fetchPreorder, parkedLines, openLines, releaseToBrokering, cancelPreorderItems, fetchClosedBatchIds, reallocateLine };
}
