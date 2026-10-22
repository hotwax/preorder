import { api, commonUtil, translate } from '@common';
import { defineFindStore } from '@/store/findStore';
import { useStoreFacilitiesStore } from '@/store/storeFacilities';
import { toBatchQuery } from '@/utils/entityQueries';
import { ALL, readEntityList } from '@/utils/query';
import type { FutureInventoryBatch } from '@/types';

export const DEFAULT_FUTURE_INVENTORY_SORT = 'promiseDate';

async function fetchBatchPage(params: Record<string, any>) {
  const { facilityIds, storeScope } = await useStoreFacilitiesStore().scopeFor(params.productStoreId);
  const resp: any = await api({ url: 'oms/futureInventoryItems', method: 'get', params: toBatchQuery(params, facilityIds) });
  if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || translate('Something went wrong. Please try again.'));
  return { ...readEntityList<FutureInventoryBatch>(resp), extras: { storeScope } };
}

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
  listName: 'futureInventoryItems',
  fetchPage: fetchBatchPage,
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
