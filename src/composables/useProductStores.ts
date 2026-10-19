import { computed, watch } from "vue";
import { useLiveEntity } from "@common/db";
import { preorderDb } from "@/db/preorderDb";
import { useProductStore } from "@/store/productStore";

/** A product store row from the app db's `productStores` seed table. */
export interface ProductStoreRow {
  productStoreId: string;
  storeName?: string;
}

/**
 * The product stores, by name, from the app db (the framework's `productStore` seed domain), and the
 * selected one's id from the product store store. `synced` is true once this login's sync of the
 * table has landed, so an empty list then really is empty.
 */
export function useProductStores() {
  const productStore = useProductStore();
  const { records, synced } = useLiveEntity<ProductStoreRow>(preorderDb.tables.productStores, { syncDomain: "productStore" });
  const productStores = computed(() => [...records.value].sort((a, b) =>
    (a.storeName || a.productStoreId).localeCompare(b.storeName || b.productStoreId)));
  const currentProductStoreId = computed(() => productStore.getCurrentProductStoreId);
  return { productStores, synced, currentProductStoreId };
}

/**
 * The menu's product store picker: the list and selection of `useProductStores()`, keeping the
 * selection on a store that exists once the table has synced (the first by name when the user has no
 * saved store, or it is gone). Mounted once, in the menu, so every page sees a selected store.
 */
export function useProductStoreSelection() {
  const productStore = useProductStore();
  const stores = useProductStores();
  watch([stores.synced, stores.productStores], ([synced, rows]) => {
    if (synced) productStore.ensureCurrentProductStore(rows.map((row) => row.productStoreId));
  }, { immediate: true });
  return stores;
}
