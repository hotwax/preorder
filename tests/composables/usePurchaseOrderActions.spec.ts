import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchProducts = vi.hoisted(() => vi.fn(async (_params: any) => ({ products: [] })));
const escapeSolrSpecialChars = (input: string) => input.replace(/[-+:()"]/g, '\\$&');
vi.mock('@common', () => ({ api: vi.fn(), translate: (text: string) => text, commonUtil: { hasError: () => false }, useSolrSearch: () => ({ searchProducts, escapeSolrSpecialChars }) }));

import { api } from '@common';
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

  /** Answers the exact search with exactDocs and the broad one with broadDocs. */
  const answer = (exactDocs: any[], broadDocs: any[] = []) => searchProducts.mockImplementation(async (params: any) => ({
    products: params.keyword.startsWith('"') ? exactDocs : broadDocs
  }));
  // M174340 and M174341 as hc-sandbox's Solr has them: sku and internalName hold the Shopify id, the SKU the app shows
  // is only in goodIdentifications
  const kg100 = { productId: 'M174340', productName: '100 / Blue', internalName: '50721864384676', sku: '50721864384676',
    goodIdentifications: ['SKU/Kg-100', 'UPCA/870', 'ShopifyShopProduct/10000/50721864384676'] };
  const kg100Blue = { productId: 'M174341', productName: '100 / Blue', internalName: '50721926283428', sku: '50721926283428',
    goodIdentifications: ['SKU/KG-100-BLUE', 'ShopifyShopProduct/10000/50721926283428'] };

  it('puts a product whose SKU, found only in goodIdentifications, is the keyword first, in any case', async () => {
    answer([kg100Blue, kg100]);
    expect((await usePurchaseOrderActions().searchOrderableProducts('Kg-100')).map((p: any) => p.productId)).toEqual(['M174340', 'M174341']);
    expect((await usePurchaseOrderActions().searchOrderableProducts('kg-100')).map((p: any) => p.productId)).toEqual(['M174340', 'M174341']);
  });

  it('matches any identification type the product identifier setting can show, such as a UPC', async () => {
    answer([kg100Blue, kg100]);
    expect((await usePurchaseOrderActions().searchOrderableProducts('870'))[0].productId).toBe('M174340');
  });

  it('puts "100" first on hc-sandbox, where its internal name and sku are 100', async () => {
    answer([{ productId: 'M100075', internalName: 'WP07-28-Black', sku: 'WP07-28-Black', goodIdentifications: ['SKU/WP07-28-Black'] },
      { productId: 'M100001', internalName: '100', sku: '100', goodIdentifications: ['SKU/100'] }]);
    expect((await usePurchaseOrderActions().searchOrderableProducts('100')).map((p: any) => p.productId)).toEqual(['M100001', 'M100075']);
  });

  it('puts the product whose id is the keyword first', async () => {
    answer([kg100Blue, kg100]);
    expect((await usePurchaseOrderActions().searchOrderableProducts('m174340'))[0].productId).toBe('M174340');
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

/** An Axios rejection for an HTTP error with Moqui's error body. */
const httpError = (status: number, errors: any) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { errorCode: status, errors } } });

describe('bulk purchase order actions (preorder-maarg#104)', () => {
  const apiMock = api as unknown as ReturnType<typeof vi.fn>;
  beforeEach(() => { apiMock.mockReset(); });

  it("reports the server's line validation reason for a 400, with the order id, not the transport status", async () => {
    apiMock.mockImplementation(async ({ url }: any) => {
      // The body OMS returned for this on the local backend (PO M121886): errorCode 400 and the reason, newline-terminated
      if (url.includes('M100973')) throw httpError(400, 'Line 02 (product CODEXFL20_HC_P1) has no estimated delivery date\n');
      return { status: 200, data: { futureInventoryItemIds: ['M100309'] } };
    });
    const { forEachOrder, sellAsPreorder } = usePurchaseOrderActions();
    const result = await forEachOrder(['M100972', 'M100973'], (orderId) => sellAsPreorder(orderId));

    expect(apiMock.mock.calls.map((call: any) => call[0].url)).toEqual(['oms/purchaseOrders/M100972/futureInventory', 'oms/purchaseOrders/M100973/futureInventory']);
    expect(result).toEqual({ done: 1, failed: 1, succeeded: ['M100972'],
      errors: ['M100973: Line 02 (product CODEXFL20_HC_P1) has no estimated delivery date'] });
  });

  it("joins a list of server errors, and keeps the transport message when there is no response", async () => {
    const failures: Record<string, any> = {
      A: httpError(400, ['Line 01 has no estimated delivery date', 'Line 02 has no estimated delivery date']),
      B: new Error('Network Error'),
      C: httpError(500, ''),
      D: undefined,
      E: 'Timed out'
    };
    const result = await usePurchaseOrderActions().forEachOrder(Object.keys(failures), async (orderId) => { throw failures[orderId]; });

    expect(result.done).toBe(0);
    expect(result.failed).toBe(5);
    expect(result.errors).toEqual([
      'A: Line 01 has no estimated delivery date; Line 02 has no estimated delivery date',
      'B: Network Error',
      'C: Request failed with status code 500',
      'D: Something went wrong',
      'E: Timed out'
    ]);
  });

  it('counts mixed successes and failures in order, and runs every order after a failure', async () => {
    const seen: string[] = [];
    const result = await usePurchaseOrderActions().forEachOrder(['M1', 'M2', 'M3', 'M4'], async (orderId) => {
      seen.push(orderId);
      if (orderId === 'M2' || orderId === 'M4') throw httpError(400, `${orderId} is not approved`);
    });

    expect(seen).toEqual(['M1', 'M2', 'M3', 'M4']);
    expect(result).toEqual({ done: 2, failed: 2, succeeded: ['M1', 'M3'], errors: ['M2: M2 is not approved', 'M4: M4 is not approved'] });
  });

  it('a retry after the line is repaired succeeds, and reports the same reason while it is not', async () => {
    let repaired = false;
    apiMock.mockImplementation(async () => {
      if (!repaired) throw httpError(400, 'Line 02 (product P1) has no estimated delivery date');
      return { status: 200, data: { futureInventoryItemIds: ['M100310', 'M100311'] } };
    });
    const { forEachOrder, sellAsPreorder } = usePurchaseOrderActions();

    const first = await forEachOrder(['M100973'], (orderId) => sellAsPreorder(orderId));
    const retry = await forEachOrder(['M100973'], (orderId) => sellAsPreorder(orderId));
    repaired = true;
    const afterRepair = await forEachOrder(['M100973'], (orderId) => sellAsPreorder(orderId));

    expect(first.errors).toEqual(['M100973: Line 02 (product P1) has no estimated delivery date']);
    expect(retry).toEqual(first);
    expect(afterRepair).toEqual({ done: 1, failed: 0, succeeded: ['M100973'], errors: [] });
  });
});
