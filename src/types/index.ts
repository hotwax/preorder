/** Shapes the OMS REST resources return: entity lists and masters, and the few services behind `oms/…` routes (see docs/SPEC.md §4.2). */

export interface FutureInventoryBatch {
  futureInventoryItemId: string;
  productId: string;
  productName?: string;
  facilityId?: string;
  facilityName?: string;
  futureInventoryItemTypeId?: string;
  promiseDate?: number | string;
  /** Supply still expected to arrive. */
  quantityOnOrderTotal?: number;
  availableToPromiseTotal?: number;
  /** Units reserved by orders: on order minus ATP. The list view computes it; a single batch read gets it from the app. */
  reservedQuantity?: number;
  statusId?: string;
  poId?: string;
  poItemSeqId?: string;
  externalId?: string;
  shipmentId?: string;
  shipmentExternalId?: string;
  /** Dashboard rows only: why an expired or cancelled batch still holds reservations. */
  exceptionReason?: string;
}

/** One ledger row of a batch (`oms/futureInventoryItems/{id}/details`). Facts only: a row records what changed. */
export interface FutureInventoryLedgerRow {
  futureInventoryItemId: string;
  futureInventoryItemDetailSeqId: string;
  reasonEnumId?: string;
  quantityOnOrderDiff?: number;
  availableToPromiseDiff?: number;
  lastQuantityOnOrder?: number;
  lastAvailableToPromise?: number;
  orderId?: string;
  orderItemSeqId?: string;
  promiseDate?: number | string;
  receiptId?: string;
  description?: string;
  changedByUserId?: string;
  createdDate?: number | string;
}

/** One order line waiting on a batch (`oms/futureInventoryItems/{id}/lines`). */
export interface FutureInventoryWaitingLine {
  futureInventoryItemId: string;
  orderId: string;
  orderItemSeqId: string;
  shipGroupSeqId?: string;
  orderName?: string;
  externalId?: string;
  orderDate?: number | string;
  statusId?: string;
  productId?: string;
  productStoreId?: string;
  facilityId?: string;
  salesChannelEnumId?: string;
  shipmentMethodTypeId?: string;
  openQuantity?: number;
  reservedDatetime?: number | string;
  promisedDatetime?: number | string;
}

/**
 * One batch from GET preorder/futureInventory/{id}: the FutureInventoryItem default master, so its product and its
 * purchase order header and line ride along. The facility name comes from seed data.
 */
export interface FutureInventoryBatchDetail extends Omit<FutureInventoryBatch, 'productName' | 'facilityName' | 'exceptionReason'> {
  product?: { productId: string; productName?: string; internalName?: string };
  purchaseOrderHeader?: { orderId: string; orderName?: string; externalId?: string; statusId?: string; orderDate?: number | string };
  purchaseOrderItem?: { orderItemSeqId: string; quantity?: number; estimatedDeliveryDate?: number | string; statusId?: string };
}

/**
 * One order line holding a future inventory reservation: a row of `oms/futureInventoryItems/lines` (the open reservations),
 * with the item's status and quantity added from the order when the detail page reads it.
 */
export interface PreorderLine {
  orderItemSeqId: string;
  shipGroupSeqId?: string;
  productId: string;
  productName?: string;
  itemStatusId?: string;
  quantity?: number;
  /** Where the line sits now: its parking facility while it waits, the fulfillment facility once released. */
  facilityId?: string;
  promisedDatetime?: number | string;
  reservedDatetime?: number | string;
  futureInventoryItemId?: string;
  futureInventoryItemTypeId?: string;
  batchFacilityId?: string;
  batchPromiseDate?: number | string;
  batchStatusId?: string;
  /** Units still reserved on the batch. */
  openQuantity?: number;
}

/**
 * An order with open future inventory lines: the header from `oms/orders/futureInventory` (or `oms/orders/{id}` on the
 * detail page) and its reserved lines. Counts, promise range and parking are derived from the lines (`summarizePreorderLines`).
 */
export interface PreorderOrder {
  orderId: string;
  orderName?: string;
  externalId?: string;
  orderDate?: number | string;
  statusId?: string;
  productStoreId?: string;
  salesChannelEnumId?: string;
  customerPartyId?: string;
  customerName?: string;
  email?: string;
  lines: PreorderLine[];
}

export interface PurchaseOrderSummary {
  orderId: string;
  orderName?: string;
  externalId?: string;
  statusId?: string;
  orderDate?: number | string;
  productStoreId?: string;
  facilityId?: string;
  facilityName?: string;
  supplierPartyId?: string;
  supplierName?: string;
  itemCount?: number;
  quantityTotal?: number;
  earliestArrivalDate?: number | string;
  latestArrivalDate?: number | string;
  grandTotal?: number;
  currencyUom?: string;
  futureInventoryBatchCount?: number;
}

export interface InboundShipmentSummary {
  shipmentId: string;
  externalId?: string;
  shipmentTypeId?: string;
  statusId?: string;
  primaryOrderId?: string;
  orderName?: string;
  orderExternalId?: string;
  destinationFacilityId?: string;
  facilityName?: string;
  estimatedArrivalDate?: number | string;
  estimatedShipDate?: number | string;
  createdDate?: number | string;
  itemCount?: number;
  quantityTotal?: number;
  receivedQuantity?: number;
}
