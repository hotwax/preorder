import { api, commonUtil, translate, useSolrSearch } from '@common';
import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import {
  purchaseOrderLinesQuery, purchaseOrderPageQuery, readOrderGroups, toPurchaseOrderSummary, type PurchaseOrderListParams,
} from '@/utils/purchaseOrderSolr';
import type { PurchaseOrderSummary } from '@/types';

export const DEFAULT_PURCHASE_ORDER_SORT = 'earliestArrivalDate';

/** Solr shows a saved change after its next commit, about a second: a list showing it searches again after this long. */
export const SOLR_SETTLE_MS = 1500;

/** The statuses a purchase order is open in: the list starts on these, and completed or cancelled ones are a filter away. */
export const OPEN_PURCHASE_ORDER_STATUSES = ['ORDER_CREATED', 'ORDER_APPROVED'];

async function solrQuery(payload: any) {
  const resp: any = await useSolrSearch().runSolrQuery(payload);
  if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || translate('Something went wrong. Please try again.'));
  return resp.data;
}

/**
 * A page of the purchase order list from Solr: the page's orders, then all their lines for the row totals, and their
 * future inventory batch counts, which Solr doesn't carry.
 */
async function fetchPurchaseOrderPage(params: Record<string, any>) {
  const listParams = params as PurchaseOrderListParams & { pageIndex: number; pageSize: number };
  const page = readOrderGroups(await solrQuery(purchaseOrderPageQuery(listParams, listParams.pageIndex, listParams.pageSize)));
  const orderIds = page.groups.map((group) => group.orderId);
  if (!orderIds.length) return { rows: [] as PurchaseOrderSummary[], total: page.total };

  const [lines, counts]: any[] = await Promise.all([
    solrQuery(purchaseOrderLinesQuery(orderIds)),
    api({ url: 'preorder/purchaseOrderBatchCounts', method: 'get', params: { orderIds: orderIds.join(',') } }),
  ]);
  if (commonUtil.hasError(counts)) throw new Error(counts?.data?.errors || translate('Something went wrong. Please try again.'));
  const docsByOrder = new Map(readOrderGroups(lines).groups.map((group) => [group.orderId, group.docs]));
  const batchCountByOrder = new Map<string, number>((counts.data?.batchCounts || []).map((row: any) => [row.orderId, Number(row.batchCount) || 0]));
  const rows = orderIds.map((orderId) => toPurchaseOrderSummary(orderId, docsByOrder.get(orderId) || [], batchCountByOrder.get(orderId) || 0));
  return { rows, total: page.total };
}

/** Find purchase orders, from Solr. */
export const usePurchaseOrderSearchStore = defineFindStore<{
  statusId: string[];
  supplierPartyId: string;
  facilityId: string;
  arrivalDateFrom: string;
  arrivalDateThru: string;
  orderDateFrom: string;
  orderDateThru: string;
}, PurchaseOrderSummary>('purchaseOrderSearch', {
  scopeByStore: false,
  listName: 'orders',
  defaultSort: DEFAULT_PURCHASE_ORDER_SORT,
  fetchPage: fetchPurchaseOrderPage,
  defaultFilters: () => ({
    statusId: [...OPEN_PURCHASE_ORDER_STATUSES],
    supplierPartyId: ALL,
    facilityId: ALL,
    arrivalDateFrom: '',
    arrivalDateThru: '',
    orderDateFrom: '',
    orderDateThru: '',
  }),
});
