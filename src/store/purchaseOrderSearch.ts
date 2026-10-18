import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { PurchaseOrderSummary } from '@/types';

export const DEFAULT_PURCHASE_ORDER_SORT = 'earliestArrivalDate';

/** Find purchase orders. */
export const usePurchaseOrderSearchStore = defineFindStore<{
  statusId: string[];
  supplierPartyId: string;
  facilityId: string;
  arrivalDateFrom: string;
  arrivalDateThru: string;
  orderDateFrom: string;
  orderDateThru: string;
}, PurchaseOrderSummary>('purchaseOrderSearch', {
  url: 'preorder/purchaseOrders',
  listName: 'orders',
  defaultSort: DEFAULT_PURCHASE_ORDER_SORT,
  defaultFilters: () => ({
    statusId: [],
    supplierPartyId: ALL,
    facilityId: ALL,
    arrivalDateFrom: '',
    arrivalDateThru: '',
    orderDateFrom: '',
    orderDateThru: '',
  }),
});
