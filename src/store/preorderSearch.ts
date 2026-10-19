import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { PreorderOrder } from '@/types';

export const DEFAULT_PREORDER_SORT = '-orderDate';

/**
 * Find pre-orders: orders with a pending pre-order line (open, with an open future inventory reservation, in its
 * store's pre-order or back-order parking). Order Manager's Find orders filters, plus the FI type; newest first.
 */
export const usePreorderSearchStore = defineFindStore<{
  statusId: string[];
  futureInventoryItemTypeId: string;
  salesChannelEnumId: string;
  shipmentMethodTypeId: string;
  orderDateFrom: string;
  orderDateThru: string;
}, PreorderOrder>('preorderSearch', {
  url: 'preorder/preorders',
  listName: 'orders',
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
