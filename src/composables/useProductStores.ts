import { computed, watch } from "vue";
import { useLiveEntity } from "@common/db";
import { preorderDb } from "@/db/preorderDb";
import { useProductStore } from "@/store/productStore";
import { productStoreLabels } from "@/utils/labels";

/** A product store row from the app db's `productStores` seed table, and the name a picker shows for it. */
export interface ProductStoreRow {
  productStoreId: string;
  storeName?: string;
  /** Its name, or its name and id where another store has the same name. */
  label?: string;
}

/**
 * The product stores, by name, from the app db (the framework's `productStore` seed domain), and the
 * selected one's id from the product store store. `synced` is true once this login's sync of the
 * table has landed, so an empty list then really is empty.
 */
export function useProductStores() {
  const productStore = useProductStore();
  const { records, synced } = useLiveEntity<ProductStoreRow>(preorderDb.tables.productStores, { syncDomain: "productStore" });
  const productStores = computed(() => {
    const labels = productStoreLabels(records.value);
    return records.value.map((row) => ({ ...row, label: labels.get(row.productStoreId) as string }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });
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
