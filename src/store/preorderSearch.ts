import { api } from '@common';
import { defineFindStore } from '@/store/findStore';
import { toOrderLinesQuery, toPreorderQuery } from '@/utils/entityQueries';
import { ALL, readEntityList } from '@/utils/query';
import { ensureResponse } from '@/utils/response';
import { attachLines } from '@/utils/preorders';
import type { PreorderLine, PreorderOrder } from '@/types';

export const DEFAULT_PREORDER_SORT = '-orderDate';

/** One page of orders with open future inventory lines, each with its waiting lines (one more read for the whole page). */
async function fetchPreorderPage(params: Record<string, any>) {
  const { rows: headers, total } = readEntityList<Omit<PreorderOrder, 'lines'>>(
    await ensureResponse(api({ url: 'oms/orders/futureInventory', method: 'get', params: toPreorderQuery(params) }), 'Failed to load the pre-orders.'),
  );
  if (!headers.length) return { rows: [] as PreorderOrder[], total };
  const { rows: lines } = readEntityList<PreorderLine & { orderId: string }>(
    await ensureResponse(api({ url: 'oms/futureInventoryItems/lines', method: 'get', params: toOrderLinesQuery(headers.map((header) => header.orderId)) }), 'Failed to load the pre-order lines.'),
  );
  return { rows: attachLines(headers, lines), total };
}

/**
 * Find pre-orders: orders with an open future inventory reservation (`oms/orders/futureInventory`), each with its waiting
 * lines. Filters are the order header's: status, sales channel and order date; newest first.
 */
export const usePreorderSearchStore = defineFindStore<{
  statusId: string[];
  salesChannelEnumId: string;
  orderDateFrom: string;
  orderDateThru: string;
}, PreorderOrder>('preorderSearch', {
  listName: 'orders',
  fetchPage: fetchPreorderPage,
  defaultSort: DEFAULT_PREORDER_SORT,
  defaultFilters: () => ({
    statusId: [],
    salesChannelEnumId: ALL,
    orderDateFrom: '',
    orderDateThru: '',
  }),
});
