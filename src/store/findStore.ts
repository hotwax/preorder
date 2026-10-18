import { defineStore } from 'pinia';
import { api, commonUtil, logger, translate } from '@common';
import { useProductStore } from '@/store/productStore';
import { readList, toListParams, type FilterValue } from '@/utils/query';

export interface FindStoreConfig<F extends Record<string, FilterValue>> {
  /** The list resource, relative to the Maarg REST root (`preorder/purchaseOrders`). */
  url: string;
  /** The response key holding the rows; `<listName>Count` holds the total. */
  listName: string;
  defaultFilters: () => F;
  defaultSort: string;
  /** The request param the search text goes in. */
  queryParam?: string;
  /**
   * Whether the menu's product store scopes the list. Supply (purchase orders, inbound shipments)
   * belongs to facilities, and a purchase order may name no store, so those lists are not scoped.
   */
  scopeByStore?: boolean;
}

/**
 * The state and paging every find page shares (Pre-orders, Future inventory, Purchase orders,
 * Inbound shipments): search text, filters and sort, the loaded rows and their total, and one page
 * request at a time. Each page's store is one of these, so the pages page, refresh and fail alike.
 * The current product store scopes every request.
 */
export function defineFindStore<F extends Record<string, FilterValue>, R = any>(id: string, config: FindStoreConfig<F>) {
  return defineStore(id, {
    state: () => ({
      query: '',
      filters: config.defaultFilters() as F,
      sort: config.defaultSort,
      results: [] as R[],
      total: 0,
      pageIndex: 0,
      pageSize: Number(import.meta.env.VITE_VIEW_SIZE) || 20,
      loading: false,
      loaded: false,
      error: '',
    }),
    getters: {
      hasMore: (state) => state.results.length < state.total,
    },
    actions: {
      params(pageIndex: number) {
        const productStoreId = config.scopeByStore === false ? undefined : useProductStore().getCurrentProductStore?.productStoreId;
        return {
          ...toListParams({ ...(this.filters as Record<string, FilterValue>), productStoreId, [config.queryParam || 'keyword']: this.query.trim() }),
          orderBy: this.sort,
          pageIndex,
          pageSize: this.pageSize,
        };
      },
      async fetchPage(pageIndex: number) {
        this.loading = true;
        this.error = '';
        try {
          const resp: any = await api({ url: config.url, method: 'get', params: this.params(pageIndex) });
          if (commonUtil.hasError(resp)) throw resp.data;
          return readList<R>(resp.data, config.listName);
        } catch (error: any) {
          logger.error(`Failed to load ${config.listName}`, error);
          this.error = error?.response?.data?.errors || error?.message || translate('Something went wrong. Please try again.');
          throw error;
        } finally {
          this.loading = false;
        }
      },
      async runSearch() {
        const { rows, total } = await this.fetchPage(0).catch(() => ({ rows: [] as R[], total: 0 }));
        this.pageIndex = 0;
        this.results = rows as any;
        this.total = total;
        this.loaded = true;
      },
      async appendNextPage() {
        if (this.loading || !this.hasMore) return;
        const next = this.pageIndex + 1;
        const { rows, total } = await this.fetchPage(next).catch(() => ({ rows: [] as R[], total: this.total }));
        this.pageIndex = next;
        this.results = [...this.results, ...rows] as any;
        this.total = total;
      },
      /** Every row matching the current search, for Export CSV; one request of up to `limit` rows. */
      async fetchAll(limit = 1000): Promise<R[]> {
        const resp: any = await api({ url: config.url, method: 'get', params: { ...this.params(0), pageSize: limit } });
        if (commonUtil.hasError(resp)) throw resp.data;
        return readList<R>(resp.data, config.listName).rows;
      },
      clearFilters() {
        this.query = '';
        this.filters = config.defaultFilters() as any;
        this.sort = config.defaultSort;
      },
    },
  });
}
