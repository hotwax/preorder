import { api } from '@common';
import { defineFindStore } from '@/store/findStore';
import { hasLineFilters, LINES_PAGE_SIZE, toFilteredLinesQuery, toOrderHeadersQuery, toOrderLinesQuery, toPreorderQuery } from '@/utils/entityQueries';
import { ALL, readEntityList } from '@/utils/query';
import { ensureResponse } from '@/utils/response';
import { attachLines, distinctOrderIds, inIdOrder, toPreorderLine } from '@/utils/preorders';
import type { PreorderLine, PreorderOrder } from '@/types';

export const DEFAULT_PREORDER_SORT = '-orderDate';

/** The waiting lines of a page of orders, attached to their headers. */
async function withLines(headers: Omit<PreorderOrder, 'lines'>[]) {
  if (!headers.length) return [] as PreorderOrder[];
  const { rows: lines } = readEntityList<PreorderLine & { orderId: string }>(
    await ensureResponse(api({ url: 'oms/futureInventoryItems/lines', method: 'get', params: toOrderLinesQuery(headers.map((header) => header.orderId)) }), 'Failed to load the pre-order lines.'),
  );
  return attachLines(headers, lines.map((line) => ({ ...toPreorderLine(line), orderId: line.orderId })));
}

/** The most pages of matching lines read to learn which orders match a line filter (10,000 lines). */
const MAX_FILTER_PAGES = 10;
let matchedOrders: { key: string; ids: string[] } | undefined;

/**
 * The orders that have a waiting line matching a line filter, in the list's order. The header view carries no line fields,
 * so the matching lines are read (all their pages, up to MAX_FILTER_PAGES) and their orders collected. Kept for the next
 * pages of the same search, so scrolling does not read them again.
 */
async function orderIdsWithMatchingLines(params: Record<string, any>) {
  const { pageIndex: _page, pageSize: _size, ...search } = params;
  const key = JSON.stringify(search);
  if (params.pageIndex > 0 && matchedOrders?.key === key) return matchedOrders.ids;
  const lines: { orderId: string }[] = [];
  for (let page = 0; page < MAX_FILTER_PAGES; page++) {
    const { rows, total } = readEntityList<{ orderId: string }>(
      await ensureResponse(api({ url: 'oms/futureInventoryItems/lines', method: 'get', params: toFilteredLinesQuery(params, page) }), 'Failed to load the pre-orders.'),
    );
    lines.push(...rows);
    if (rows.length < LINES_PAGE_SIZE || lines.length >= total) break;
  }
  const ids = distinctOrderIds(lines);
  matchedOrders = { key, ids };
  return ids;
}

/** One page of orders with open future inventory lines, each with its waiting lines (one more read for the whole page). */
async function fetchPreorderPage(params: Record<string, any>) {
  if (hasLineFilters(params)) {
    const ids = await orderIdsWithMatchingLines(params);
    const pageIds = ids.slice(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize);
    if (!pageIds.length) return { rows: [] as PreorderOrder[], total: ids.length };
    const { rows: headers } = readEntityList<Omit<PreorderOrder, 'lines'>>(
      await ensureResponse(api({ url: 'oms/orders/futureInventory', method: 'get', params: toOrderHeadersQuery(pageIds) }), 'Failed to load the pre-orders.'),
    );
    return { rows: await withLines(inIdOrder(headers, pageIds)), total: ids.length };
  }
  const { rows: headers, total } = readEntityList<Omit<PreorderOrder, 'lines'>>(
    await ensureResponse(api({ url: 'oms/orders/futureInventory', method: 'get', params: toPreorderQuery(params) }), 'Failed to load the pre-orders.'),
  );
  return { rows: await withLines(headers), total };
}

/**
 * Find pre-orders: orders with an open future inventory reservation (`oms/orders/futureInventory`), each with its waiting
 * lines. Filters are the order header's (status, sales channel, order date) and the lines' (future inventory type, shipping
 * method); newest first.
 */
export const usePreorderSearchStore = defineFindStore<{
  statusId: string[];
  futureInventoryItemTypeId: string;
  salesChannelEnumId: string;
  shipmentMethodTypeId: string;
  orderDateFrom: string;
  orderDateThru: string;
}, PreorderOrder>('preorderSearch', {
  listName: 'orders',
  fetchPage: fetchPreorderPage,
  defaultSort: DEFAULT_PREORDER_SORT,
  defaultFilters: () => ({
    statusId: [],
    futureInventoryItemTypeId: ALL,
    salesChannelEnumId: ALL,
    shipmentMethodTypeId: ALL,
    orderDateFrom: '',
    orderDateThru: '',
  }),
});
