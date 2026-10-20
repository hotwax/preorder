import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchProducts = vi.hoisted(() => vi.fn(async (_params: any) => ({ products: [] })));
const escapeSolrSpecialChars = (input: string) => input.replace(/[-+:()"]/g, '\\$&');
vi.mock('@common', () => ({ api: vi.fn(), translate: (text: string) => text, commonUtil: { hasError: () => false }, useSolrSearch: () => ({ searchProducts, escapeSolrSpecialChars }) }));

import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';

describe('purchase order product search', () => {
  beforeEach(() => { searchProducts.mockReset(); });

  const product = (productId: string, internalName: string) => ({ productId, internalName });

  it('lists the exact matches of a keyword first, the product whose SKU is the keyword ahead of them (preorder-maarg#87)', async () => {
    // common orders the broad search by name: the prefix matches fill the 10 rows and the SKU "100" is not among them
    const broad = Array.from({ length: 10 }, (_v, i) => product(`M2${i}`, `100${i}-PREFIX`));
    searchProducts.mockImplementation(async (params: any) => ({
      products: params.keyword === '"100"' ? [product('M11', 'Bag 100'), product('M10', '100')] : broad
    }));
    const products = await usePurchaseOrderActions().searchOrderableProducts('100', 'STORE');

    expect(searchProducts.mock.calls.map((call: any) => call[0].keyword).sort()).toEqual(['"100"', '100']);
    expect(searchProducts.mock.calls[0][0].filters.productStoreIds_s).toEqual({ value: '"STORE"' });
    expect(products.map((p: any) => p.productId)).toEqual(['M10', 'M11', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27']);
  });

  it('escapes the exact search, and falls back to the broad results when it fails', async () => {
    searchProducts.mockImplementation(async (params: any) => {
      if (params.keyword.startsWith('"')) throw new Error('bad query');
      return { products: [product('M30', 'WP07-28')] };
    });
    const products = await usePurchaseOrderActions().searchOrderableProducts('WP07-28');

    expect(searchProducts.mock.calls.map((call: any) => call[0].keyword)).toContain('"WP07\\-28"');
    expect(products.map((p: any) => p.productId)).toEqual(['M30']);
  });

  it('makes one search with no keyword, or with a quoted one, and reads an empty result as none', async () => {
    searchProducts.mockImplementation(async () => ({ products: {} }));
    expect(await usePurchaseOrderActions().searchOrderableProducts('')).toEqual([]);
    expect(await usePurchaseOrderActions().searchOrderableProducts('"100"')).toEqual([]);
    expect(searchProducts.mock.calls.map((call: any) => call[0].keyword)).toEqual(['', '"100"']);
  });
});
