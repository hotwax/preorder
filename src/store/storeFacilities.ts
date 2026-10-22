import { defineStore } from 'pinia';
import { api, commonUtil, translate } from '@common';
import { readEntityList } from '@/utils/query';
import { toMillis } from '@/utils/format';

/** `STORE_FACILITIES` (the store's own facilities), `NO_STORE_FACILITIES` (it has none, so every facility's supply shows) or `ALL_STORES`. */
export type StoreScope = 'STORE_FACILITIES' | 'NO_STORE_FACILITIES' | 'ALL_STORES';

/**
 * The facilities each product store sells from. Batches carry no store, so a store's supply is the batches at its
 * current facilities (`oms/productStores/{id}/facilities`). Read once per store and kept for the session.
 */
export const useStoreFacilitiesStore = defineStore('storeFacilities', {
  state: () => ({ byStore: {} as Record<string, string[]> }),
  actions: {
    async activeFacilityIds(productStoreId: string): Promise<string[]> {
      if (this.byStore[productStoreId]) return this.byStore[productStoreId];
      const resp: any = await api({ url: `oms/productStores/${encodeURIComponent(productStoreId)}/facilities`, method: 'get', params: { pageSize: 1000 } });
      if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || translate('Something went wrong. Please try again.'));
      const now = Date.now();
      const ids = readEntityList<{ facilityId: string; thruDate?: any }>(resp).rows
        .filter((row) => { const thru = toMillis(row.thruDate); return !thru || thru > now; })
        .map((row) => row.facilityId);
      this.byStore[productStoreId] = [...new Set(ids)];
      return this.byStore[productStoreId];
    },
    /** The facilities to read supply at for a store, and which scope that is. A store with no facility reads every facility. */
    async scopeFor(productStoreId?: string): Promise<{ facilityIds: string[]; storeScope: StoreScope }> {
      if (!productStoreId) return { facilityIds: [], storeScope: 'ALL_STORES' };
      const facilityIds = await this.activeFacilityIds(productStoreId);
      return { facilityIds, storeScope: facilityIds.length ? 'STORE_FACILITIES' : 'NO_STORE_FACILITIES' };
    },
  },
});
