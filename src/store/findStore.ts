import { defineStore } from 'pinia';
import { api, commonUtil, logger, translate } from '@common';
import { useProductStore } from '@/store/productStore';
import { readList, toListParams, type FilterValue } from '@/utils/query';
import { errorMessage } from '@/utils/response';

export interface FindStoreConfig<F extends Record<string, FilterValue>> {
  /** The list resource, relative to the Maarg REST root (`preorder/futureInventoryItems`); not used with `fetchPage`. */
  url?: string;
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
  /**
   * Reads a page itself instead of a GET on `url`, for a list served from somewhere else (the purchase order
   * list reads Solr). It gets the same params the GET would send.
   */
  fetchPage?: (params: Record<string, any>) => Promise<{ rows: any[]; total: number; extras?: Record<string, any> }>;
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
      /** Until when (epoch ms) a change marked stale may still be missing from the list's source: Solr shows it after its next commit. */
      settlesAt: 0,
      error: '',
      /** What the last search answered beside its rows and total, such as the batch list's storeScope. */
      extras: {} as Record<string, any>,
      requestId: 0,
      lastSearchKey: '',
    }),
    getters: {
      hasMore: (state) => state.results.length < state.total,
    },
    actions: {
      params(pageIndex: number) {
        const productStoreId = config.scopeByStore === false ? undefined : useProductStore().getCurrentProductStoreId || undefined;
        return {
          ...toListParams({ ...(this.filters as Record<string, FilterValue>), productStoreId, [config.queryParam || 'keyword']: this.query.trim() }),
          orderBy: this.sort,
          pageIndex,
          pageSize: this.pageSize,
        };
      },
      async fetchPage(pageIndex: number) {
        if (config.fetchPage) {
          const { rows, total, extras } = await config.fetchPage(this.params(pageIndex));
          return { rows: rows as R[], total, extras: extras || {} };
        }
        const resp: any = await api({ url: config.url as string, method: 'get', params: this.params(pageIndex) });
        if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || translate('Something went wrong. Please try again.'));
        const { [config.listName]: _rows, [`${config.listName}Count`]: _count, ...extras } = resp.data || {};
        return { ...readList<R>(resp.data, config.listName), extras };
      },
      /** Searches from the first page. Skipped when the same search is loaded or in flight, unless forced. */
      async runSearch({ force = false } = {}) {
        const key = JSON.stringify(this.params(0));
        if (!force && !this.stale && key === this.lastSearchKey && (this.loaded || this.loading)) return;
        this.lastSearchKey = key;
        this.stale = false;
        const requestId = ++this.requestId;
        this.loading = true;
        this.error = '';
        try {
          const { rows, total, extras } = await this.fetchPage(0);
          if (requestId !== this.requestId) return;
          this.extras = extras;
          this.pageIndex = 0;
          this.results = rows as any;
          // A short page is the last one, whatever count came with it: the list stops asking for more
          this.total = rows.length < this.pageSize ? rows.length : total;
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
        // The search text or filters changed and their search hasn't started yet (it is debounced): a
        // next page now would be the new search's, appended to the old rows
        if (JSON.stringify(this.params(0)) !== this.lastSearchKey) return;
        const requestId = this.requestId;
        const next = this.pageIndex + 1;
        this.loadingMore = true;
        try {
          const { rows, total } = await this.fetchPage(next);
          if (requestId !== this.requestId) return;
          this.pageIndex = next;
          this.results = [...this.results, ...rows] as any;
          // An empty or short page is the last one: infinite scroll stops instead of asking again
          this.total = rows.length < this.pageSize ? this.results.length : total;
        } catch (error: any) {
          if (requestId !== this.requestId) return;
          logger.error(`Failed to load more ${config.listName}`, error);
          await commonUtil.showToast(errorMessage(error, translate('Could not load more rows. Scroll to try again.')));
        } finally {
          this.loadingMore = false;
        }
      },
      /**
       * Changes loaded rows in place, for a change the list's source shows only later (Solr makes a saved change
       * visible on its own commit). A row the update returns null for leaves the list.
       */
      updateRows(update: (row: R) => R | null) {
        const before = this.results.length;
        this.results = (this.results as R[]).map(update).filter((row): row is NonNullable<R> => row !== null) as any;
        this.total = Math.max(0, this.total - (before - this.results.length));
      },
      /**
       * Marks the list out of date after a change made elsewhere; it searches again when next shown. `settleMs` is how
       * long the list's source may take to show the change (Solr's commit): the list searches once more after it.
       */
      markStale(settleMs = 0) {
        this.stale = true;
        this.settlesAt = Math.max(this.settlesAt, settleMs ? Date.now() + settleMs : 0);
      },
      /** Drops the loaded rows, for a search whose rows must not show under the new one's (another product store's). */
      resetResults() {
        this.results = [] as any;
        this.total = 0;
        this.pageIndex = 0;
        this.loaded = false;
        this.error = '';
        this.extras = {};
      },
      clearFilters() {
        this.query = '';
        this.filters = config.defaultFilters() as any;
        this.sort = config.defaultSort;
      },
    },
  });
}
