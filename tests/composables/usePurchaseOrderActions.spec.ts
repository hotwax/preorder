import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchProducts = vi.hoisted(() => vi.fn(async (_params: any) => ({ products: [] })));
vi.mock('@common', () => ({ api: vi.fn(), translate: (text: string) => text, commonUtil: { hasError: () => false }, useSolrSearch: () => ({ searchProducts }) }));

import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';

describe('purchase order product search', () => {
  beforeEach(() => searchProducts.mockClear());

  it('ranks a keyword search by relevance, then name, so an exact SKU comes first (preorder-maarg#87)', async () => {
    await usePurchaseOrderActions().searchOrderableProducts('100', 'STORE');
    expect(searchProducts.mock.calls[0][0]).toMatchObject({ keyword: '100', viewSize: 10, sort: 'score desc, sort_productName asc' });
    expect(searchProducts.mock.calls[0][0].filters.productStoreIds_s).toEqual({ value: '"STORE"' });
  });

  it('keeps the default name order with no keyword', async () => {
    await usePurchaseOrderActions().searchOrderableProducts('');
    expect(searchProducts.mock.calls[0][0].sort).toBeUndefined();
  });
});
