import { toMillis } from '@/utils/format';
import type { DemandByFacility, PreorderLine, PreorderOrder, PreorderReservation } from '@/types';

export const CLOSED_ITEM_STATUSES = ['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'];

export interface PreorderSummary {
  lineCount: number;
  openLineCount: number;
  parkedLineCount: number;
  readyToReleaseLineCount: number;
  waitingFacilityIds: string[];
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
  const ready = new Set(open.filter((line) => line.readyToRelease).map((line) => `${line.shipGroupSeqId || ''}/${line.orderItemSeqId}`));
  const promises = open
    .map((line) => ({ value: line.promisedDatetime, millis: toMillis(line.promisedDatetime) }))
    .filter((promise): promise is { value: number | string; millis: number } => promise.millis !== undefined && promise.value !== undefined)
    .sort((a, b) => a.millis - b.millis);
  return {
    lineCount: items.size,
    openLineCount: items.size,
    parkedLineCount: parked.size,
    readyToReleaseLineCount: ready.size,
    waitingFacilityIds: [...new Set(open.map((line) => line.facilityId).filter((id): id is string => !!id))],
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

/** The orders of these lines, each once, in the order they first appear. */
export function distinctOrderIds(lines: { orderId: string }[]): string[] {
  return [...new Set((lines || []).map((line) => line.orderId))];
}

/** Puts rows in the order of `ids`, dropping an id that has no row. */
export function inIdOrder<T extends { orderId: string }>(rows: T[], ids: string[]): T[] {
  const byId = new Map(rows.map((row) => [row.orderId, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is T => !!row);
}

/**
 * A waiting-line row (`oms/futureInventoryItems/lines`) in the shape the pages read: the view holds only open reservations, so
 * every row is one still waiting, and ready to release when its batch has been received while it holds it. Committed lines have
 * no open reservation, so the view never lists them. Whether a line is at parking is set when the page shapes the order.
 */
export function toPreorderLine(line: PreorderLine): PreorderLine {
  return { ...line, reservationOpen: true, readyToRelease: line.batchStatusId === 'FUTURE_INV_RECEIVED', committed: false };
}

/** An order whose lines are marked at parking or not, with the counts, promise range and types its lines add up to. */
export function shapeOrder(order: PreorderOrder, isParking: (facilityId?: string) => boolean): PreorderOrder {
  const lines = (order.lines || []).map((line) => ({ ...line, atParking: isParking(line.facilityId) }));
  return { ...order, lines, ...summarizePreorderLines(lines, isParking) };
}

/** The most facilities a batch's demand lists, most units first (the dashboard lists as many). */
export const MAX_DEMAND_FACILITIES = 10;

/**
 * Where a batch's open reservations wait, by the reserving line's facility: units and items per facility, most units first.
 * `lines` are the batch's waiting lines (`oms/futureInventoryItems/{id}/lines`), one row per order item.
 */
export function demandByFacility(
  lines: { orderId: string; orderItemSeqId: string; facilityId?: string; openQuantity?: number }[],
  isParking: (facilityId?: string) => boolean,
  facilityName: (facilityId: string) => string | undefined = () => undefined,
): DemandByFacility[] {
  const byFacility = new Map<string, { units: number; items: Set<string> }>();
  (lines || []).forEach((line) => {
    if (!line.facilityId) return;
    const entry = byFacility.get(line.facilityId) || { units: 0, items: new Set<string>() };
    entry.units += Number(line.openQuantity || 0);
    entry.items.add(`${line.orderId}/${line.orderItemSeqId}`);
    byFacility.set(line.facilityId, entry);
  });
  return [...byFacility.entries()]
    .map(([facilityId, entry]) => ({ facilityId, facilityName: facilityName(facilityId) || undefined, parking: isParking(facilityId), units: entry.units, lines: entry.items.size }))
    .sort((a, b) => b.units - a.units || a.facilityId.localeCompare(b.facilityId))
    .slice(0, MAX_DEMAND_FACILITIES);
}

/** The ledger reasons that are a reservation's history: taken, released, moved, issued. */
const RESERVATION_REASONS = ['FID_RESERVED', 'FID_RELEASED', 'FID_REALLOCATED_FROM', 'FID_REALLOCATED_TO', 'FID_ISSUED', 'FID_FULFILL_RELEASE'];

/**
 * An order's reservation history per item, from its ledger rows (`oms/orders/{id}/futureInventoryDetails`): one entry per
 * reservation or release on a batch. An entry is open while it is the batch the item still waits on (`openBatchIds`).
 */
export function reservationHistory(
  rows: { orderItemSeqId?: string; futureInventoryItemId: string; reasonEnumId?: string; availableToPromiseDiff?: number; createdDate?: number | string }[],
  openBatchIds: Map<string, Set<string>>,
): Map<string, PreorderReservation[]> {
  const bySeq = new Map<string, PreorderReservation[]>();
  (rows || []).filter((row) => row.orderItemSeqId && RESERVATION_REASONS.includes(row.reasonEnumId || '')).forEach((row) => {
    const reserving = row.reasonEnumId === 'FID_RESERVED' || row.reasonEnumId === 'FID_REALLOCATED_TO';
    bySeq.set(row.orderItemSeqId as string, [...(bySeq.get(row.orderItemSeqId as string) || []), {
      futureInventoryItemId: row.futureInventoryItemId,
      reasonEnumId: row.reasonEnumId as string,
      quantity: Math.abs(Number(row.availableToPromiseDiff || 0)),
      createdDate: row.createdDate as number | string,
      open: reserving && !!openBatchIds.get(row.orderItemSeqId as string)?.has(row.futureInventoryItemId),
    }]);
  });
  return bySeq;
}
