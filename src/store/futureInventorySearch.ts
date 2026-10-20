import { defineFindStore } from '@/store/findStore';
import { ALL } from '@/utils/query';
import type { FutureInventoryBatch } from '@/types';

export const DEFAULT_FUTURE_INVENTORY_SORT = 'promiseDate';

/** Find future inventory batches. */
export const useFutureInventorySearchStore = defineFindStore<{
  statusId: string[];
  futureInventoryItemTypeId: string;
  facilityId: string;
  hasReservations: boolean;
  overcommitted: boolean;
  promiseDateFrom: string;
  promiseDateThru: string;
  poId: string;
}, FutureInventoryBatch>('futureInventorySearch', {
  url: 'oms/futureInventoryItems',
  listName: 'futureInventoryItems',
  defaultSort: DEFAULT_FUTURE_INVENTORY_SORT,
  defaultFilters: () => ({
    statusId: ['FUTURE_INV_ACTIVE'],
    futureInventoryItemTypeId: ALL,
    facilityId: ALL,
    hasReservations: false,
    overcommitted: false,
    promiseDateFrom: '',
    promiseDateThru: '',
    poId: '',
  }),
});
