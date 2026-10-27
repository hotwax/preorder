import { api, logger, translate, useSolrSearch } from '@common';
import { ensureOk, errorMessage } from '@/utils/response';
import { readList } from '@/utils/query';
import { countParams, toDay } from '@/utils/format';
import { isClosedLine, linesToMove, toSupplierOptions, type SupplierOption } from '@/utils/purchaseOrders';
import type { InboundShipmentSummary, PurchaseOrderDetail, PurchaseOrderLine, PurchaseOrderReceipt } from '@/types';

/** A stop for a backend that ignores the page index: 10,000 suppliers. */
const MAX_SUPPLIER_PAGES = 40;

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
    const [batches, receipts] = await Promise.all([
      ensureOk(api({ url: 'oms/futureInventoryItems', method: 'get', params: { poId: orderId, pageSize: 1000 } }), 'Failed to load future inventory.'),
      fetchPurchaseOrderReceipts(orderId),
    ]);
    return { ...order, facilityId: order.facilityId || order.originFacilityId, items: (order?.items || []).map((item: PurchaseOrderLine) => {
      const supply = (Array.isArray(batches) ? batches : []).filter((batch: any) => batch.poItemSeqId === item.orderItemSeqId);
      const receivedQuantity = receipts.filter((receipt) => receipt.orderItemSeqId === item.orderItemSeqId).reduce((sum, receipt) => sum + Number(receipt.quantityAccepted || 0), 0);
      return { ...item, receivedQuantity, openQuantity: isClosedLine(item) ? 0 : Math.max(0, Number(item.quantity || 0) - receivedQuantity),
        futureInventoryItemId: supply.length === 1 ? supply[0].futureInventoryItemId : undefined,
        futureInventoryStatusId: supply.length === 1 ? supply[0].statusId : undefined,
        futureInventoryAvailableToPromise: supply.reduce((sum: number, batch: any) => sum + Number(batch.availableToPromiseTotal || 0), 0),
        futureInventoryReserved: supply.reduce((sum: number, batch: any) => sum + Number(batch.reservedQuantity || 0), 0) };
    }) };

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

  /** Every SUPPLIER party, read a page at a time until the last short page (or the count OMS gave). */
  async function fetchSuppliers(): Promise<SupplierOption[]> {
    const pageSize = 250;
    const parties: any[] = [];
    for (let pageIndex = 0; pageIndex < MAX_SUPPLIER_PAGES; pageIndex++) {
      const data = await ensureOk(api({ url: 'oms/parties/roles/SUPPLIER', method: 'get', params: { pageSize, pageIndex } }), 'Failed to load suppliers.');
      const page = Array.isArray(data?.parties) ? data.parties : [];
      parties.push(...page);
      const count = Number(data?.count);
      if (page.length < pageSize || (Number.isFinite(count) && parties.length >= count)) break;
    }
    return toSupplierOptions(parties);
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
   * Moves the PO's open lines to an arrival date ('yyyy-MM-dd', the end of that day in the user's time zone), one
   * request per line whose date differs; their batches follow. The lines are the order's own unless given. Throws when
   * a line did not move, saying how many did.
   */
  async function changeArrivalDate(orderId: string, arrivalDate: string, items?: PurchaseOrderLine[]) {
    // The end of the day: a date of today must not expire the line's batch at once
    const estimatedDeliveryDate = toDay(arrivalDate)?.endOf('day').toMillis();
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
      throw new Error(translate('The arrival date moved on {moved} of {total} lines. {errors}', { ...countParams(lines.length, 'total'), moved, errors: errors.slice(0, 2).join('; ') }));
    }
  }

  /** Creates an FI batch for each open line of the PO without one. */
  async function sellAsPreorder(orderId: string, futureInventoryItemTypeId = 'FIT_PRE_ORDER') {
    return ensureOk(api({ url: `${orderUrl(orderId)}/futureInventory`, method: 'post', data: { futureInventoryItemTypeId } }), 'Failed to create future inventory.');
  }

  /**
   * Products to add to a purchase order: sellable products (variants and simple products, never a virtual parent) of
   * the product store, from Solr.
   */
  async function searchOrderableProducts(keyword: string, productStoreId?: string): Promise<any[]> {
    const filters: Record<string, { value: string }> = { isVariant: { value: '*' } };
    if (productStoreId) filters.productStoreIds_s = { value: `"${productStoreId.replace(/(["\\])/g, '\\$1')}"` };
    const search = async (term: string) => {
      const { products } = await useSolrSearch().searchProducts({ keyword: term, viewSize: 10, filters });
      return Array.isArray(products) ? products : [];
    };
    const term = keyword?.trim();
    if (!term || term.includes('"')) return search(term);
    // common's searchProducts orders every keyword search by name and ignores a sort, so an exact SKU like "100" fell past
    // the 10 rows shown, behind its prefix matches (preorder-maarg#87). The exact matches are fetched on their own and
    // listed first, a product whose id, internal name, SKU or any identification is the keyword ahead of the rest. The SKU
    // the app shows comes from goodIdentifications ("SKU/Kg-100"): on Shopify products the sku field holds a Shopify id.
    const [exact, broad] = await Promise.all([
      search(`"${useSolrSearch().escapeSolrSpecialChars(term)}"`).catch(() => []),
      search(term)
    ]);
    const identifications = (product: any) => (Array.isArray(product.goodIdentifications) ? product.goodIdentifications : [])
      .map((entry: any) => String(entry ?? '')).filter((entry: string) => entry.includes('/'))
      .map((entry: string) => entry.slice(entry.indexOf('/') + 1));
    const isIdentifier = (product: any) => [product.productId, product.internalName, product.sku, ...identifications(product)]
      .some((value) => String(value ?? '').toLowerCase() === term.toLowerCase());
    const seen = new Set<string>();
    return [...exact.filter(isIdentifier), ...exact, ...broad]
      .filter((product: any) => !seen.has(product.productId) && !!seen.add(product.productId))
      .slice(0, 10);
  }

  async function forEachOrder(orderIds: string[], action: (orderId: string) => Promise<any>) {
    let done = 0; let failed = 0; const errors: string[] = []; const succeeded: string[] = [];
    for (const orderId of orderIds) {
      try {
        await action(orderId); done++; succeeded.push(orderId);
      } catch (error: any) {
        // The server's reason, such as a line with no estimated delivery date, not the transport status (preorder-maarg#104)
        failed++; errors.push(`${orderId}: ${errorMessage(error, typeof error === 'string' && error ? error : translate('Something went wrong'))}`);
      }
    }
    return { done, failed, errors, succeeded };
  }

  return { fetchPurchaseOrder, fetchPurchaseOrderShipments, fetchPurchaseOrderReceipts, fetchSuppliers, searchOrderableProducts, createPurchaseOrder, changeStatus, changeArrivalDate, sellAsPreorder, forEachOrder };
}
