import { api, logger, translate, useSolrSearch } from '@common';
import { ensureOk, errorMessage } from '@/utils/response';
import { readList } from '@/utils/query';
import { toDay } from '@/utils/format';
import { linesToMove, toSupplierOptions, type SupplierOption } from '@/utils/purchaseOrders';
import type { InboundShipmentSummary, PurchaseOrderDetail, PurchaseOrderLine, PurchaseOrderReceipt } from '@/types';

const orderUrl = (orderId: string) => `oms/purchaseOrders/${encodeURIComponent(orderId)}`;

export interface NewPurchaseOrder {
  externalId?: string;
  orderName?: string;
  supplierPartyId: string;
  facilityId: string;
  productStoreId: string;
  currencyUomId?: string;
  statusId?: string;
  items: { productId: string; quantity: number; unitPrice?: number; arrivalDate: string }[];
  /** Also sell the order as pre-order: a second request creates a batch for each line once the order exists. */
  createFutureInventory?: boolean;
  futureInventoryItemTypeId?: string;
}

export interface CreatedPurchaseOrder {
  orderId: string;
  orderItemSeqIds: string[];
  futureInventoryItemIds?: string[];
  /** Why the batches were not created: the order exists, without them. */
  futureInventoryError?: string;
}

/** Purchase order requests: detail, create, and the bulk actions on the find page. */
export function usePurchaseOrderActions() {
  async function fetchPurchaseOrder(orderId: string): Promise<PurchaseOrderDetail> {
    const order = (await ensureOk(api({ url: orderUrl(orderId), method: 'get' }), 'Failed to load the purchase order.')).order;
    return { ...order, items: order?.items || [] };
  }

  /** The order's inbound shipments, from poorti's purchase shipments. */
  async function fetchPurchaseOrderShipments(orderId: string): Promise<InboundShipmentSummary[]> {
    const data = await ensureOk(api({ url: 'poorti/purchaseShipments', method: 'get', params: { primaryOrderId: orderId, pageSize: 250 } }), 'Failed to load the inbound shipments.');
    return readList<InboundShipmentSummary>(data, 'shipments').rows;
  }

  /** What has been received against the order's lines. */
  async function fetchPurchaseOrderReceipts(orderId: string): Promise<PurchaseOrderReceipt[]> {
    const data = await ensureOk(api({ url: `${orderUrl(orderId)}/receipts`, method: 'get' }), 'Failed to load the receipts.');
    return Array.isArray(data) ? data : [];
  }

  async function fetchSuppliers(): Promise<SupplierOption[]> {
    const data = await ensureOk(api({ url: 'oms/parties/roles/SUPPLIER', method: 'get', params: { pageSize: 250 } }), 'Failed to load suppliers.');
    return toSupplierOptions(data?.parties);
  }

  /**
   * Creates the purchase order, then, when asked, its future inventory. A failure of that second request does not
   * undo the order: the result names the order and says why it has no batches, and Sell as pre-order on it adds them.
   */
  async function createPurchaseOrder(order: NewPurchaseOrder): Promise<CreatedPurchaseOrder> {
    const { createFutureInventory, futureInventoryItemTypeId, ...purchaseOrder } = order;
    const created = await ensureOk(api({ url: 'oms/purchaseOrders', method: 'post', data: purchaseOrder }), 'Failed to create the purchase order.');
    const result: CreatedPurchaseOrder = { orderId: created.orderId, orderItemSeqIds: created.orderItemSeqIds || [] };
    if (!createFutureInventory) return result;
    try {
      const batches = await sellAsPreorder(result.orderId, futureInventoryItemTypeId);
      return { ...result, futureInventoryItemIds: batches?.futureInventoryItemIds || [] };
    } catch (error) {
      logger.error(`Failed to create future inventory for purchase order ${result.orderId}`, error);
      return { ...result, futureInventoryError: errorMessage(error, translate('Failed to create future inventory.')) };
    }
  }

  /** Approve, cancel or complete, through OMS's purchase order status change. */
  async function changeStatus(orderId: string, statusId: string) {
    return ensureOk(api({ url: `oms/purchaseOrders/${encodeURIComponent(orderId)}/status`, method: 'post', data: { orderId, statusId, setItemStatus: true } }), 'Failed to change the status.');
  }

  /**
   * Moves the PO's open lines to an arrival date ('yyyy-MM-dd', the start of that day in the user's time zone), one
   * request per line whose date differs; their batches follow. The lines are the order's own unless given. Throws when
   * a line did not move, saying how many did.
   */
  async function changeArrivalDate(orderId: string, arrivalDate: string, items?: PurchaseOrderLine[]) {
    const estimatedDeliveryDate = toDay(arrivalDate)?.toMillis();
    if (estimatedDeliveryDate === undefined) throw new Error(translate('The arrival date is not a valid date.'));
    const lines = linesToMove(items ?? (await fetchPurchaseOrder(orderId)).items, estimatedDeliveryDate);
    let moved = 0; const errors: string[] = [];
    for (const line of lines) {
      try {
        await ensureOk(api({ url: `${orderUrl(orderId)}/items/${encodeURIComponent(line.orderItemSeqId)}`, method: 'put', data: { estimatedDeliveryDate } }), 'Failed to change the arrival date.');
        moved++;
      } catch (error) {
        errors.push(`${line.orderItemSeqId}: ${errorMessage(error, translate('Failed to change the arrival date.'))}`);
      }
    }
    if (errors.length) {
      throw new Error(translate('The arrival date moved on {moved} of {total} lines. {errors}', { moved, total: lines.length, errors: errors.slice(0, 2).join('; ') }));
    }
  }

  /** Creates an FI batch for each open line of the PO without one. */
  async function sellAsPreorder(orderId: string, futureInventoryItemTypeId = 'FIT_PRE_ORDER') {
    return ensureOk(api({ url: `${orderUrl(orderId)}/futureInventory`, method: 'post', data: { futureInventoryItemTypeId } }), 'Failed to create future inventory.');
  }

  /**
   * Products to add to a purchase order: sellable products (variants and simple products, never a
   * virtual parent) of the product store from Solr, and from OMS's product list when Solr has none, as on
   * an instance whose product index is empty. OMS's product list has no product store filter, so that
   * fallback is not limited to the store.
   */
  async function searchOrderableProducts(keyword: string, productStoreId?: string): Promise<any[]> {
    const filters: Record<string, { value: string }> = { isVariant: { value: '*' } };
    if (productStoreId) filters.productStoreIds_s = { value: `"${productStoreId.replace(/(["\\])/g, '\\$1')}"` };
    const { products, total } = await useSolrSearch().searchProducts({ keyword, viewSize: 10, filters });
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

  return { fetchPurchaseOrder, fetchPurchaseOrderShipments, fetchPurchaseOrderReceipts, fetchSuppliers, searchOrderableProducts, createPurchaseOrder, changeStatus, changeArrivalDate, sellAsPreorder, forEachOrder };
}
