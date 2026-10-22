import { toMillis } from '@/utils/format';
import type { PreorderLine, PreorderOrder } from '@/types';

export const CLOSED_ITEM_STATUSES = ['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'];

export interface PreorderSummary {
  lineCount: number;
  parkedLineCount: number;
  openReservedQuantity: number;
  earliestPromiseDate?: number | string;
  latestPromiseDate?: number | string;
  futureInventoryItemTypeIds: string[];
}

/** An order line is open until its item is cancelled, completed or rejected; a line without an item status (the list) is open. */
export const isOpenLine = (line: PreorderLine) => !CLOSED_ITEM_STATUSES.includes(line.itemStatusId || '');

/**
 * The figures an order row shows, from its lines: how many items, how many wait at parking, the units reserved, the promise
 * range and the future inventory types. `isParking` says whether a facility is a pre-order or back-order parking facility.
 * An order's lines are one row per batch and item, so a line split over two batches counts once.
 */
export function summarizePreorderLines(lines: PreorderLine[], isParking: (facilityId?: string) => boolean): PreorderSummary {
  const open = (lines || []).filter(isOpenLine);
  const items = new Set(open.map((line) => `${line.shipGroupSeqId || ''}/${line.orderItemSeqId}`));
  const parked = new Set(open.filter((line) => isParking(line.facilityId)).map((line) => `${line.shipGroupSeqId || ''}/${line.orderItemSeqId}`));
  const promises = open
    .map((line) => ({ value: line.promisedDatetime, millis: toMillis(line.promisedDatetime) }))
    .filter((promise): promise is { value: number | string; millis: number } => promise.millis !== undefined && promise.value !== undefined)
    .sort((a, b) => a.millis - b.millis);
  return {
    lineCount: items.size,
    parkedLineCount: parked.size,
    openReservedQuantity: open.reduce((sum, line) => sum + Number(line.openQuantity || 0), 0),
    earliestPromiseDate: promises[0]?.value,
    latestPromiseDate: promises[promises.length - 1]?.value,
    futureInventoryItemTypeIds: [...new Set(open.map((line) => line.futureInventoryItemTypeId).filter((type): type is string => !!type))],
  };
}

/** Groups waiting-line rows under their orders; an order with no row gets an empty list. */
export function attachLines(orders: Omit<PreorderOrder, 'lines'>[], lines: (PreorderLine & { orderId: string })[]): PreorderOrder[] {
  const byOrder = new Map<string, PreorderLine[]>();
  lines.forEach((line) => byOrder.set(line.orderId, [...(byOrder.get(line.orderId) || []), line]));
  return orders.map((order) => ({ ...order, lines: byOrder.get(order.orderId) || [] }));
}
