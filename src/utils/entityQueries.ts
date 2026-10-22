import { ALL, whereBetween, whereContains, whereEquals, whereIn, withPaging, type EntityParams } from '@/utils/query';

/**
 * What each find page asks its entity REST list for: the page's params (see findStore: filters as comma lists, flags as
 * 'Y', plus keyword, orderBy, pageIndex and pageSize) as field filters. Pure, so the mapping is tested without a server.
 */

/** ATP is a 6-decimal number: these are the smallest steps either side of zero, since a range end is inclusive. */
const ABOVE_ZERO = '0.000001';
const BELOW_ZERO = '-0.000001';

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
 * carries header fields only, so the list cannot filter by future inventory type or shipping method, which belong to the lines.
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

/** The waiting lines of these orders in one read (`oms/futureInventoryItems/lines`), by order and item. */
export function toOrderLinesQuery(orderIds: string[]): EntityParams {
  const query: EntityParams = {};
  whereIn(query, 'orderId', orderIds);
  withPaging(query, { orderBy: 'orderId,orderItemSeqId', tieBreaker: 'futureInventoryItemId', pageIndex: 0, pageSize: 1000 });
  return query;
}
