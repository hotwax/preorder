import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { InboundShipmentSummary } from '@/types';

export const DEFAULT_INBOUND_SHIPMENT_SORT = '-estimatedArrivalDate';

/** Find inbound shipments (poorti's purchase shipments), bound for the store's facilities. */
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
