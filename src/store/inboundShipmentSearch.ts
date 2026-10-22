import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { InboundShipmentSummary } from '@/types';

export const DEFAULT_INBOUND_SHIPMENT_SORT = '-estimatedArrivalDate';

/**
 * Find inbound shipments created against purchase orders. poorti lists them for a product store (their destination facility is one of
 * the store's), a purchase order or one shipment, so the menu's store scopes this list.
 */
export const useInboundShipmentSearchStore = defineFindStore<{
  statusId: string[];
  destinationFacilityId: string;
  arrivalDateFrom: string;
  arrivalDateThru: string;
}, InboundShipmentSummary>('inboundShipmentSearch', {
  url: 'poorti/purchaseShipments',
  listName: 'shipments',
  defaultSort: DEFAULT_INBOUND_SHIPMENT_SORT,
  defaultFilters: () => ({
    statusId: [],
    destinationFacilityId: ALL,
    arrivalDateFrom: '',
    arrivalDateThru: '',
  }),
});
