import { DateTime } from 'luxon';
import type { PurchaseOrderSummary } from '@/types';
import { dayBound } from '@/utils/format';
import { shownPartyId } from '@/utils/labels';

/**
 * The purchase order list's Solr queries. Purchase orders are indexed one doc per line (docType ORDER,
 * orderTypeId PURCHASE_ORDER); the list groups the line docs by orderId. A page is two queries: the
 * page's order ids, matched, sorted and counted with every filter, then all the lines of those orders,
 * so a line filter (facility, arrival) picks the orders without trimming their totals.
 */

/** The params the purchase order search store sends: its filters as `toListParams` makes them, plus the search text and sort. */
export interface PurchaseOrderListParams {
  keyword?: string;
  statusId?: string;
  supplierPartyId?: string;
  facilityId?: string;
  arrivalDateFrom?: string;
  arrivalDateThru?: string;
  orderDateFrom?: string;
  orderDateThru?: string;
  orderBy?: string;
  /** The current product store: a purchase order is listed under the store it was created for. */
  productStoreId?: string;
}

/** Lines read per order for its totals; an order with more is totalled from its first ones by line id. */
export const MAX_LINES_PER_ORDER = 500;

const BASE_FILTERS = ['docType:ORDER', 'orderTypeId:PURCHASE_ORDER'];
const LINE_FIELDS = [
  'orderId', 'orderItemSeqId', 'orderName', 'externalOrderId', 'orderStatusId', 'orderDate', 'productStoreId',
  'facilityId', 'facilityName', 'customerPartyId', 'customerPartyName', 'orderItemStatusId', 'quantity', 'estimatedDeliveryDate',
].join(',');

/** An order with no arrival date sorts after every dated one: its sort key is 2100-01-01. */
const SORTS: Record<string, string> = {
  earliestArrivalDate: 'def(ms(estimatedDeliveryDate),4102444800000) asc,orderId asc',
  '-orderDate': 'orderDate desc,orderId desc',
  orderDate: 'orderDate asc,orderId asc',
};

/** Escapes a value for a Solr term, so spaces and query syntax match literally. */
export const escapeSolr = (value: string) => value.replace(/([+\-&|!(){}[\]^"~*?:\\/\s])/g, '\\$1');

const quote = (value: string) => `"${value.replace(/(["\\])/g, '\\$1')}"`;

/** A range of whole days in the user's time zone, as Solr reads it; an open end is `*`. */
const range = (from?: string, thru?: string) => `[${dayBound(from, 'start', 'iso') || '*'} TO ${dayBound(thru, 'end', 'iso') || '*'}]`;

/** The filters that pick a page's orders. */
export function purchaseOrderFilters(params: PurchaseOrderListParams): string[] {
  const filters = [...BASE_FILTERS];
  const statusIds = (params.statusId || '').split(',').filter(Boolean);
  if (statusIds.length) filters.push(`orderStatusId:(${statusIds.map(quote).join(' OR ')})`);
  if (params.productStoreId) filters.push(`productStoreId:${quote(params.productStoreId)}`);
  if (params.supplierPartyId) filters.push(`customerPartyId:${quote(params.supplierPartyId)}`);
  if (params.facilityId) filters.push(`facilityId:${quote(params.facilityId)}`);
  if (params.orderDateFrom || params.orderDateThru) filters.push(`orderDate:${range(params.orderDateFrom, params.orderDateThru)}`);
  if (params.arrivalDateFrom || params.arrivalDateThru) {
    filters.push(`estimatedDeliveryDate:${range(params.arrivalDateFrom, params.arrivalDateThru)}`, '-orderItemStatusId:ITEM_CANCELLED');
  }
  return filters;
}

/** The search text matches part of the order id, name or external id, case-insensitively. */
export function purchaseOrderKeywordQuery(keyword?: string): string {
  const text = keyword?.trim();
  if (!text) return '*:*';
  const term = `*${escapeSolr(text)}*`;
  return `orderId:${term} OR orderName:${term} OR externalOrderId:${term}`;
}

/** The first query: one group per order, the page's order ids in the list's order, and the matching order count. */
export function purchaseOrderPageQuery(params: PurchaseOrderListParams, pageIndex: number, pageSize: number) {
  return {
    json: {
      query: purchaseOrderKeywordQuery(params.keyword),
      filter: purchaseOrderFilters(params),
      params: {
        rows: pageSize,
        start: pageIndex * pageSize,
        sort: SORTS[params.orderBy || ''] || SORTS.earliestArrivalDate,
        fl: 'orderId',
        group: true,
        'group.field': 'orderId',
        'group.limit': 1,
        'group.ngroups': true,
      },
    },
  };
}

/** The second query: every line of the page's orders, grouped by order. */
export function purchaseOrderLinesQuery(orderIds: string[]) {
  return {
    json: {
      query: '*:*',
      filter: [...BASE_FILTERS, `orderId:(${orderIds.map(quote).join(' OR ')})`],
      params: {
        rows: orderIds.length,
        fl: LINE_FIELDS,
        group: true,
        'group.field': 'orderId',
        'group.limit': MAX_LINES_PER_ORDER,
        'group.sort': 'orderItemSeqId asc',
      },
    },
  };
}

/** The grouped answer as { orderId: its docs } in the answer's order, and the number of matching orders. */
export function readOrderGroups(data: any): { groups: { orderId: string; docs: any[] }[]; total: number } {
  const grouped = data?.grouped?.orderId;
  const groups = (grouped?.groups || []).map((group: any) => ({ orderId: String(group.groupValue), docs: group.doclist?.docs || [] }));
  return { groups, total: Number(grouped?.ngroups) || 0 };
}

const millisOf = (value?: string) => (value ? DateTime.fromISO(value).toMillis() : undefined);

/**
 * One list row from an order's line docs: the header from its first line, and the count, units and earliest and
 * latest arrival date of its lines that are not cancelled.
 */
export function toPurchaseOrderSummary(orderId: string, docs: any[], futureInventoryBatchCount = 0): PurchaseOrderSummary {
  const header = docs[0] || {};
  const hasSupplier = Boolean(shownPartyId(header.customerPartyId));
  const open = docs.filter((doc) => doc.orderItemStatusId !== 'ITEM_CANCELLED');
  const arrivals = open.map((doc) => millisOf(doc.estimatedDeliveryDate)).filter((value): value is number => value !== undefined);
  return {
    orderId,
    orderName: header.orderName,
    externalId: header.externalOrderId,
    statusId: header.orderStatusId,
    orderDate: millisOf(header.orderDate),
    productStoreId: header.productStoreId,
    facilityId: header.facilityId,
    facilityName: header.facilityName,
    supplierPartyId: hasSupplier ? header.customerPartyId : undefined,
    supplierName: hasSupplier ? header.customerPartyName : undefined,
    itemCount: open.length,
    quantityTotal: open.reduce((sum, doc) => sum + (Number(doc.quantity) || 0), 0),
    earliestArrivalDate: arrivals.length ? Math.min(...arrivals) : undefined,
    latestArrivalDate: arrivals.length ? Math.max(...arrivals) : undefined,
    futureInventoryBatchCount,
  };
}
