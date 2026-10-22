import { api, useSolrSearch } from '@common';
import { ensureOk, ensureResponse } from '@/utils/response';
import { readEntityList } from '@/utils/query';

const orderUrl = (orderId: string) => `oms/purchaseOrders/${encodeURIComponent(orderId)}`;
const CLOSED_LINE_STATUSES = ['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'];

export interface NewPurchaseOrder {
  externalId?: string;
  orderName?: string;
  supplierPartyId: string;
  facilityId: string;
  productStoreId?: string;
  currencyUomId?: string;
  statusId?: string;
  items: { productId: string; quantity: number; unitPrice?: number; arrivalDate: string }[];
  createFutureInventory?: boolean;
  futureInventoryItemTypeId?: string;
}

/** Purchase order requests: detail, create, and the bulk actions on the find page. */
export function usePurchaseOrderActions() {
  /**
   * One purchase order: the order with its lines and their batches (`oms/purchaseOrders/{id}`), plus the inbound shipments
   * against it (poorti `purchaseShipments`) and its receipts, which the order read leaves to their own resources.
   */
  async function fetchPurchaseOrder(orderId: string) {
    const [orderData, shipmentsResp, receiptsResp] = await Promise.all([
      ensureOk(api({ url: orderUrl(orderId), method: 'get' }), 'Failed to load the purchase order.'),
      ensureOk(api({ url: 'poorti/purchaseShipments', method: 'get', params: { primaryOrderId: orderId, pageSize: 100, orderBy: '-estimatedArrivalDate' } }), 'Failed to load the inbound shipments.'),
      ensureResponse(api({ url: `${orderUrl(orderId)}/receipts`, method: 'get', params: { pageSize: 500 } }), 'Failed to load the receipts.'),
    ]);
    return { ...orderData.order, shipments: shipmentsResp.shipments || [], receipts: readEntityList(receiptsResp).rows };
  }

  /** The parties with the SUPPLIER role, named as a company or a person. */
  async function fetchSuppliers(): Promise<{ partyId: string; name: string }[]> {
    const data = await ensureOk(api({ url: 'oms/parties/roles/SUPPLIER', method: 'get', params: { pageSize: 500 } }), 'Failed to load suppliers.');
    return (data.parties || [])
      .map((party: any) => ({ partyId: party.partyId, name: party.groupName || [party.firstName, party.lastName].filter(Boolean).join(' ') || party.partyId }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
  }

  /**
   * Creates the purchase order, then its future inventory when asked: the order service creates the order only, and
   * `futureInventory` makes a batch for each open line without one.
   */
  async function createPurchaseOrder(order: NewPurchaseOrder): Promise<{ orderId: string; futureInventoryItemIds: string[] }> {
    const { createFutureInventory, futureInventoryItemTypeId, ...fields } = order;
    const created = await ensureOk(api({ url: 'oms/purchaseOrders', method: 'post', data: fields }), 'Failed to create the purchase order.');
    if (!createFutureInventory) return { orderId: created.orderId, futureInventoryItemIds: [] };
    const batches = await sellAsPreorder(created.orderId, futureInventoryItemTypeId);
    return { orderId: created.orderId, futureInventoryItemIds: batches.futureInventoryItemIds || [] };
  }

  /** Approve, cancel or complete, through OMS's purchase order status change. */
  async function changeStatus(orderId: string, statusId: string) {
    return ensureOk(api({ url: `oms/purchaseOrders/${encodeURIComponent(orderId)}/status`, method: 'post', data: { orderId, statusId, setItemStatus: true } }), 'Failed to change the status.');
  }

  /**
   * Sets the arrival date ('yyyy-MM-dd', end of that day) on the order's open lines, or on the given ones; each change
   * is recorded on the line and its batch follows. One request per line.
   */
  async function changeArrivalDate(orderId: string, arrivalDate: string, orderItemSeqIds?: string[]) {
    const seqIds = orderItemSeqIds?.length
      ? orderItemSeqIds
      : ((await fetchPurchaseOrder(orderId)).items || []).filter((item: any) => !CLOSED_LINE_STATUSES.includes(item.statusId)).map((item: any) => item.orderItemSeqId);
    for (const orderItemSeqId of seqIds) {
      await ensureOk(api({ url: `${orderUrl(orderId)}/items/${encodeURIComponent(orderItemSeqId)}`, method: 'put', data: { estimatedDeliveryDate: `${arrivalDate} 23:59:59.999` } }), 'Failed to change the arrival date.');
    }
    return { orderId, orderItemSeqIds: seqIds };
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
