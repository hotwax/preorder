import { computed } from 'vue';
import { commonUtil } from '@common';
import { useProductMaster } from '@common/db';
import { useProductStore } from '@/store/productStore';

/**
 * Product identity — the display name and secondary line the operator chose in
 * Settings > Product identifier. Every surface that names a product for an order, return or
 * swap reads it through here instead of hardcoding a field, so a store that identifies goods
 * by internalName or parentProductName gets that everywhere, not only in the views that
 * happened to be written against it.
 *
 * `product` is whatever identity-bearing object the row has: a ProductRow, a denormalized
 * order/return/swap item, or nothing yet. commonUtil.getProductIdentificationValue throws on
 * undefined, so this normalizes first and callers never guard it themselves.
 *
 * `fallbacks` are the call site's own denormalized fields, used only when the preferred
 * identifier has no value here — before the cache warms, or for a custom line with no catalog
 * product at all. The list is per-call because what a row can fall back on genuinely differs:
 * a Shopify custom line has its own title, a return item its description.
 */
function resolveIdentity(idKey: string, product: any, fallbacks: Array<string | null | undefined>): string {
  const preferred = commonUtil.getProductIdentificationValue(idKey, product || {});
  return preferred || fallbacks.find((candidate) => !!candidate) || "";
}

function primaryId(product: any, fallbacks: Array<string | null | undefined> = []): string {
  return resolveIdentity(useProductStore().getProductIdentificationPref.primaryId, product, fallbacks);
}

function secondaryId(product: any, fallbacks: Array<string | null | undefined> = []): string {
  return resolveIdentity(useProductStore().getProductIdentificationPref.secondaryId, product, fallbacks);
}

/**
 * How a product reads on the order page: the operator's chosen primary/secondary identifiers
 * and the variant's feature line, resolved from the product master.
 */
export function useProductIdentity() {
  const { getProduct } = useProductMaster();
  const productStore = useProductStore();
  const identificationPref = computed(() => productStore.getProductIdentificationPref);

  /** The product's primary identifier, by id, from the product master; empty until it is cached. */
  const primaryIdentifier = (productId?: string) =>
    commonUtil.getProductIdentificationValue(identificationPref.value.primaryId, getProduct(productId) || {}) || '';

  return { getProduct, primaryId, secondaryId, primaryIdentifier };
}
