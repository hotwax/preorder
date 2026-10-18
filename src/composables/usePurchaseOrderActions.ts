import { api } from '@common';
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

  async function forEachOrder(orderIds: string[], action: (orderId: string) => Promise<any>) {
    let done = 0; let failed = 0; const errors: string[] = [];
    for (const orderId of orderIds) {
      try { await action(orderId); done++; } catch (error: any) { failed++; errors.push(`${orderId}: ${error?.message || error}`); }
    }
    return { done, failed, errors };
  }

  return { fetchPurchaseOrder, fetchSuppliers, createPurchaseOrder, changeStatus, changeArrivalDate, sellAsPreorder, forEachOrder };
}
