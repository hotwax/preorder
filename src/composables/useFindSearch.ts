import { onIonViewDidLeave, onIonViewWillEnter } from '@ionic/vue';
import { watch } from 'vue';
import { useProductStore } from '@/store/productStore';

interface FindSearchStore {
  query: string;
  filters: Record<string, any>;
  sort: string;
  loaded: boolean;
  stale: boolean;
  settlesAt: number;
  runSearch: (options?: { force?: boolean }) => Promise<void>;
  resetResults: () => void;
  markStale: (settleMs?: number) => void;
}

/**
 * Runs a find page's searches: at once when a filter, the sort or the menu's store changes, 300ms
 * after the search text stops changing, and on entering the page only the first time or after the
 * list was marked stale. Coming back from a detail page keeps the loaded pages and the scroll.
 * The store skips a search whose parameters match the last one, so a change to several of these at
 * once sends one request.
 *
 * On a product store switch `onStoreChange` runs first (the page drops its selection and any filter that names the
 * old store's data), and a store-scoped list drops the old store's rows at once, so nothing of the old store shows
 * or can be acted on while the new store's search runs.
 */
export function useFindSearch(store: FindSearchStore, { scopeByStore = true, onStoreChange }: { scopeByStore?: boolean; onStoreChange?: () => void } = {}) {
  const productStore = useProductStore();
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  const searchNow = () => {
    if (debounce) clearTimeout(debounce);
    void store.runSearch();
  };

  watch(() => store.query, () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void store.runSearch(), 300);
  });
  watch(() => store.filters, searchNow, { deep: true });
  watch(() => store.sort, searchNow);
  watch(() => productStore.getCurrentProductStoreId, () => {
    onStoreChange?.();
    if (!scopeByStore) return;
    store.resetResults();
    searchNow();
  });

  /** Searches again from the first page, for after a bulk action on the list's rows. */
  const refresh = () => store.runSearch({ force: true });

  /**
   * Searches again after `delayMs`, for a change the list's source shows only later (Solr, after its next commit).
   * Leaving the page first drops the timer and marks the list stale, so it searches when next shown instead.
   */
  function refreshLater(delayMs: number) {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { settleTimer = undefined; void refresh(); }, delayMs);
  }

  onIonViewWillEnter(() => {
    if (store.loaded && !store.stale) return;
    // A change made on another page may reach the source after this search: search once more when it has
    const settleMs = store.settlesAt - Date.now();
    searchNow();
    if (settleMs > 0) refreshLater(settleMs);
  });

  onIonViewDidLeave(() => {
    if (!settleTimer) return;
    clearTimeout(settleTimer);
    settleTimer = undefined;
    store.markStale();
  });

  return { refresh, refreshLater };
}
