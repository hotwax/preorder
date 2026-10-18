import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { PreorderOrder } from '@/types';

export const DEFAULT_PREORDER_SORT = '-orderDate';

/**
 * Find pre-orders: orders with an open pre-order line (open, an open future inventory reservation, no physical
 * reservation). Order Manager's Find orders filters, plus parking and the FI type; newest first.
 */
export const usePreorderSearchStore = defineFindStore<{
  statusId: string[];
  parking: string;
  allocationState: string;
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
    parking: 'any',
    allocationState: ALL,
    futureInventoryItemTypeId: ALL,
    salesChannelEnumId: ALL,
    shipmentMethodTypeId: ALL,
    orderDateFrom: '',
    orderDateThru: '',
  }),
});
