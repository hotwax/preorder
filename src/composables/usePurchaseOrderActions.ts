import { api, useSolrSearch } from '@common';
import { ensureOk } from '@/utils/response';

const orderUrl = (orderId: string) => `preorder/purchaseOrders/${encodeURIComponent(orderId)}`;

export interface NewPurchaseOrder {
  externalId?: string;
  orderName?: string;
  supplierPartyId: string;
  facilityId: string;
  productStoreId: string;
  currencyUomId?: string;
  statusId?: string;
  items: { productId: string; quantity: number; unitPrice?: number; arrivalDate: string }[];
  createFutureInventory?: boolean;
  futureInventoryItemTypeId?: string;
}

/** Purchase order requests: detail, create, and the bulk actions on the find page. */
export function usePurchaseOrderActions() {
  async function fetchPurchaseOrder(orderId: string) {
    return (await ensureOk(api({ url: orderUrl(orderId), method: 'get' }), 'Failed to load the purchase order.')).order;
  }

  async function fetchSuppliers(): Promise<{ partyId: string; name: string }[]> {
    const data = await ensureOk(api({ url: 'preorder/suppliers', method: 'get' }), 'Failed to load suppliers.');
    return data.suppliers || [];
  }

  async function createPurchaseOrder(order: NewPurchaseOrder): Promise<{ orderId: string; futureInventoryItemIds: string[] }> {
    return ensureOk(api({ url: 'preorder/purchaseOrders', method: 'post', data: order }), 'Failed to create the purchase order.');
  }

  /** Approve, cancel or complete, through OMS's purchase order status change. */
  async function changeStatus(orderId: string, statusId: string) {
    return ensureOk(api({ url: `oms/purchaseOrders/${encodeURIComponent(orderId)}/status`, method: 'post', data: { orderId, statusId, setItemStatus: true } }), 'Failed to change the status.');
  }

  /** Sets the arrival date ('yyyy-MM-dd') on the PO's open lines; their FI batches follow. */
  async function changeArrivalDate(orderId: string, arrivalDate: string, orderItemSeqIds?: string[]) {
    return ensureOk(api({ url: `${orderUrl(orderId)}/arrivalDate`, method: 'post', data: { arrivalDate, orderItemSeqIds } }), 'Failed to change the arrival date.');
  }

  /** Creates an FI batch for each open line of the PO without one. */
  async function sellAsPreorder(orderId: string, futureInventoryItemTypeId = 'FIT_PRE_ORDER') {
    return ensureOk(api({ url: `${orderUrl(orderId)}/futureInventory`, method: 'post', data: { futureInventoryItemTypeId } }), 'Failed to create future inventory.');
  }

  /**
   * Products to add to a purchase order: sellable products (variants and simple products, never a
   * virtual parent) from Solr, and from OMS's product list when Solr has none, as on an instance
   * whose product index is empty.
   */
  async function searchOrderableProducts(keyword: string): Promise<any[]> {
    const { products, total } = await useSolrSearch().searchProducts({ keyword, viewSize: 10, filters: { isVariant: { value: '*' } } });
    if (total) return products as any[];
    const found = new Map<string, any>();
    for (const field of ['productId', 'productName', 'internalName']) {
      const resp: any = await api({ url: 'oms/products', method: 'get', params: { [field]: keyword, [`${field}_op`]: 'contains', [`${field}_ic`]: 'Y', pageSize: 20 } }).catch(() => undefined);
      (Array.isArray(resp?.data) ? resp.data : []).filter((product: any) => product.isVirtual !== 'Y').forEach((product: any) => found.set(product.productId, product));
      if (found.size >= 10) break;
    }
    return [...found.values()].slice(0, 10);
  }

  async function forEachOrder(orderIds: string[], action: (orderId: string) => Promise<any>) {
    let done = 0; let failed = 0; const errors: string[] = []; const succeeded: string[] = [];
    for (const orderId of orderIds) {
      try { await action(orderId); done++; succeeded.push(orderId); } catch (error: any) { failed++; errors.push(`${orderId}: ${error?.message || error}`); }
    }
    return { done, failed, errors, succeeded };
  }

  return { fetchPurchaseOrder, fetchSuppliers, searchOrderableProducts, createPurchaseOrder, changeStatus, changeArrivalDate, sellAsPreorder, forEachOrder };
}
