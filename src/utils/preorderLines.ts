import type { PreorderLine, PreorderOrder } from '@/types';

/** Lines with an open reservation: still waiting on future inventory, at any facility. */
export const waitingLines = (order: Pick<PreorderOrder, 'lines'>): PreorderLine[] => (order.lines || []).filter((line) => line.reservationOpen);

/** The waiting lines at pre-order or back-order parking: the ones releasing to brokering can take. */
export const releasableLines = (order: Pick<PreorderOrder, 'lines'>): PreorderLine[] => waitingLines(order).filter((line) => line.atParking);

/**
 * The facilities where the order's lines wait: the backend's `waitingFacilityIds`, else the facilities of the lines
 * the response carries with an open reservation. Each id once, in order.
 */
export function waitingFacilityIds(order: Pick<PreorderOrder, 'lines' | 'waitingFacilityIds'>): string[] {
  const ids = order.waitingFacilityIds ?? waitingLines(order).map((line) => line.facilityId);
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/** The facility types of pre-order and back-order parking (the types OMS reads a line's `atParking` from). */
const PARKING_FACILITY_TYPES = ['PRE_ORDER', 'BACKORDER'];
/** The pre-order parking of the default store, taken as parking when the facility is not in seed data. */
const PRE_ORDER_PARKING_ID = 'PRE_ORDER_PARKING';

/**
 * The batches a line's reservation can move to. A line waiting at parking can move to any of the batches; a line
 * waiting at a facility only to a batch at its own facility or a location-less one (at the store's parking), as OMS
 * refuses any other. `facilityTypeOf` reads a facility's type from seed data.
 */
export function moveTargets<T extends { futureInventoryItemId: string; facilityId?: string; futureInventoryItemTypeId?: string }>(
  line: Pick<PreorderLine, 'atParking' | 'facilityId' | 'futureInventoryItemId' | 'futureInventoryItemTypeId'>,
  batches: T[],
  facilityTypeOf: (facilityId: string) => string | undefined,
): T[] {
  // Any other ACTIVE batch (the caller lists only those) of the line's FI type: its reservation is a row of its own now, so
  // a batch the line was moved or released from before is as good a target as any (preorder-maarg#93)
  const sameType = batches.filter((batch) => batch.futureInventoryItemId !== line.futureInventoryItemId
    && (!line.futureInventoryItemTypeId || batch.futureInventoryItemTypeId === line.futureInventoryItemTypeId));
  if (line.atParking) return sameType;
  const isLocationless = (facilityId?: string) => !facilityId
    || PARKING_FACILITY_TYPES.includes(facilityTypeOf(facilityId) || '')
    || facilityId === PRE_ORDER_PARKING_ID;
  return sameType.filter((batch) => isLocationless(batch.facilityId) || batch.facilityId === line.facilityId);
}
