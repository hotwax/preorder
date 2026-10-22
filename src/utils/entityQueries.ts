import { ALL, whereBetween, whereContains, whereEquals, whereIn, withPaging, type EntityParams } from '@/utils/query';

/**
 * What each find page asks its entity REST list for: the page's params (see findStore: filters as comma lists, flags as
 * 'Y', plus keyword, orderBy, pageIndex and pageSize) as field filters. Pure, so the mapping is tested without a server.
 */

/** ATP is a 6-decimal number: these are the smallest steps either side of zero, since a range end is inclusive. */
const ABOVE_ZERO = '0.000001';
const BELOW_ZERO = '-0.000001';

/** The most rows one entity list answers; the line reads page by it. */
export const LINES_PAGE_SIZE = 1000;

/**
 * The entity query for the batch list: the find page's params (see findStore) as `oms/futureInventoryItems` filters.
 * `facilityIds` are the store's facilities, used when no one facility is picked.
 */
export function toBatchQuery(params: Record<string, any>, facilityIds: string[] = []): EntityParams {
  const query: EntityParams = {};
  whereIn(query, 'statusId', params.statusId);
  whereEquals(query, 'futureInventoryItemTypeId', params.futureInventoryItemTypeId);
  if (params.facilityId && params.facilityId !== ALL) whereEquals(query, 'facilityId', params.facilityId);
  else whereIn(query, 'facilityId', facilityIds);
  whereEquals(query, 'poId', params.poId);
  whereBetween(query, 'promiseDate', params.promiseDateFrom, params.promiseDateThru);
  if (params.hasReservations) query.reservedQuantity_from = ABOVE_ZERO;
  if (params.overcommitted) query.availableToPromiseTotal_thru = BELOW_ZERO;
  whereContains(query, 'productName', params.keyword);
  withPaging(query, { orderBy: params.orderBy, tieBreaker: 'futureInventoryItemId', pageIndex: params.pageIndex, pageSize: params.pageSize });
  return query;
}

/**
 * The entity query for the pre-order list: the find page's params as `oms/orders/futureInventory` header filters. That view
 * carries header fields only, so a filter on the lines (future inventory type, shipping method) is read from the lines instead,
 * see `hasLineFilters` and `toFilteredLinesQuery`.
 */
export function toPreorderQuery(params: Record<string, any>): EntityParams {
  const query: EntityParams = {};
  whereEquals(query, 'productStoreId', params.productStoreId);
  whereIn(query, 'statusId', params.statusId);
  whereEquals(query, 'salesChannelEnumId', params.salesChannelEnumId);
  whereBetween(query, 'orderDate', params.orderDateFrom, params.orderDateThru);
  whereContains(query, 'orderName', params.keyword);
  withPaging(query, { orderBy: params.orderBy, tieBreaker: 'orderId', pageIndex: params.pageIndex, pageSize: params.pageSize });
  return query;
}

const isSet = (value: unknown) => value !== undefined && value !== null && value !== '' && value !== ALL;

/** Whether the pre-order list is filtered by something only the lines carry. */
export function hasLineFilters(params: Record<string, any>): boolean {
  return isSet(params.futureInventoryItemTypeId) || isSet(params.shipmentMethodTypeId);
}

/**
 * One page of the waiting lines that match every filter of the pre-order list, header and line alike (the lines carry the
 * order's header fields too), in the list's order. The list reads these to learn which orders match a line filter.
 */
export function toFilteredLinesQuery(params: Record<string, any>, pageIndex: number, pageSize = LINES_PAGE_SIZE): EntityParams {
  const query: EntityParams = {};
  whereEquals(query, 'productStoreId', params.productStoreId);
  whereIn(query, 'statusId', params.statusId);
  whereEquals(query, 'salesChannelEnumId', params.salesChannelEnumId);
  whereBetween(query, 'orderDate', params.orderDateFrom, params.orderDateThru);
  whereContains(query, 'orderName', params.keyword);
  whereEquals(query, 'futureInventoryItemTypeId', params.futureInventoryItemTypeId);
  whereEquals(query, 'shipmentMethodTypeId', params.shipmentMethodTypeId);
  withPaging(query, { orderBy: params.orderBy, tieBreaker: 'orderId,orderItemSeqId,futureInventoryItemId', pageIndex, pageSize });
  return query;
}

/** The headers of these orders (`oms/orders/futureInventory`) in one read. */
export function toOrderHeadersQuery(orderIds: string[]): EntityParams {
  const query: EntityParams = {};
  whereIn(query, 'orderId', orderIds);
  withPaging(query, { pageIndex: 0, pageSize: Math.max(orderIds.length, 1) });
  return query;
}

/** The waiting lines of these orders in one read (`oms/futureInventoryItems/lines`), by order and item. */
export function toOrderLinesQuery(orderIds: string[]): EntityParams {
  const query: EntityParams = {};
  whereIn(query, 'orderId', orderIds);
  withPaging(query, { orderBy: 'orderId,orderItemSeqId', tieBreaker: 'futureInventoryItemId', pageIndex: 0, pageSize: LINES_PAGE_SIZE });
  return query;
}

/** How many batches each of these purchase orders has: one row per order that has any (`oms/futureInventoryItems/purchaseOrderCounts`). */
export function toPurchaseOrderCountsQuery(orderIds: string[]): EntityParams {
  const query: EntityParams = {};
  whereIn(query, 'poId', orderIds);
  withPaging(query, { pageIndex: 0, pageSize: Math.max(orderIds.length, 1) });
  return query;
}
