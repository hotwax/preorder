import { onIonViewWillEnter } from '@ionic/vue';
import { watch } from 'vue';
import { useProductStore } from '@/store/productStore';

interface FindSearchStore {
  query: string;
  filters: Record<string, any>;
  sort: string;
  loaded: boolean;
  stale: boolean;
  runSearch: (options?: { force?: boolean }) => Promise<void>;
}

/**
 * Runs a find page's searches: at once when a filter, the sort or the menu's store changes, 300ms
 * after the search text stops changing, and on entering the page only the first time or after the
 * list was marked stale. Coming back from a detail page keeps the loaded pages and the scroll.
 * The store skips a search whose parameters match the last one, so a change to several of these at
 * once sends one request.
 */
export function useFindSearch(store: FindSearchStore, { scopeByStore = true } = {}) {
  const productStore = useProductStore();
  let debounce: ReturnType<typeof setTimeout> | undefined;

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
  if (scopeByStore) watch(() => productStore.getCurrentProductStoreId, searchNow);

  onIonViewWillEnter(() => {
    if (!store.loaded || store.stale) searchNow();
  });

  /** Searches again from the first page, for after a bulk action on the list's rows. */
  const refresh = () => store.runSearch({ force: true });

  return { refresh };
}
