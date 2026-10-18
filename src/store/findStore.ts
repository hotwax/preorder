import { defineStore } from 'pinia';
import { api, commonUtil, logger, translate } from '@common';
import { useProductStore } from '@/store/productStore';
import { showToast } from '@/utils';
import { readList, toListParams, type FilterValue } from '@/utils/query';
import { errorMessage } from '@/utils/response';

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
 * Inbound shipments): search text, filters and sort, the loaded rows and their total.
 *
 * Only the latest search may land: each search takes a new request number, and a response for an
 * older one, or a next page asked for under older filters, is dropped. A search for the same
 * parameters as the last one is skipped unless forced, so a page whose filters, sort and text all
 * change at once (Clear filters) sends one request. A page that changes data the list shows marks
 * the list stale, and the list searches again when it is next shown.
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
      loadingMore: false,
      loaded: false,
      stale: false,
      error: '',
      requestId: 0,
      lastSearchKey: '',
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
        const resp: any = await api({ url: config.url, method: 'get', params: this.params(pageIndex) });
        if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || translate('Something went wrong. Please try again.'));
        return readList<R>(resp.data, config.listName);
      },
      /** Searches from the first page. Skipped when nothing changed since the last search, unless forced. */
      async runSearch({ force = false } = {}) {
        const key = JSON.stringify(this.params(0));
        if (!force && this.loaded && !this.stale && key === this.lastSearchKey) return;
        this.lastSearchKey = key;
        this.stale = false;
        const requestId = ++this.requestId;
        this.loading = true;
        this.error = '';
        try {
          const { rows, total } = await this.fetchPage(0);
          if (requestId !== this.requestId) return;
          this.pageIndex = 0;
          this.results = rows as any;
          this.total = total;
          this.loaded = true;
        } catch (error: any) {
          if (requestId !== this.requestId) return;
          logger.error(`Failed to load ${config.listName}`, error);
          this.error = errorMessage(error, translate('Something went wrong. Please try again.'));
        } finally {
          if (requestId === this.requestId) this.loading = false;
        }
      },
      /** Appends the next page; a failure keeps the loaded rows and says so. */
      async appendNextPage() {
        if (this.loading || this.loadingMore || this.error || !this.hasMore) return;
        const requestId = this.requestId;
        const next = this.pageIndex + 1;
        this.loadingMore = true;
        try {
          const { rows, total } = await this.fetchPage(next);
          if (requestId !== this.requestId) return;
          this.pageIndex = next;
          this.results = [...this.results, ...rows] as any;
          this.total = total;
        } catch (error: any) {
          if (requestId !== this.requestId) return;
          logger.error(`Failed to load more ${config.listName}`, error);
          await showToast(errorMessage(error, translate('Could not load more rows. Scroll to try again.')));
        } finally {
          this.loadingMore = false;
        }
      },
      /** Marks the list out of date after a change made elsewhere; it searches again when next shown. */
      markStale() {
        this.stale = true;
      },
      clearFilters() {
        this.query = '';
        this.filters = config.defaultFilters() as any;
        this.sort = config.defaultSort;
      },
    },
  });
}
