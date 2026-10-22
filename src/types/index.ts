/** Shapes the pre-order resources of oms and poorti return (see docs/SPEC.md §4.2). */

/** Where open pre-order reservations wait, by the reserving line's facility (oms/preorderDashboard, oms/futureInventoryItems/{id}). */
export interface DemandByFacility {
  facilityId: string;
  facilityName?: string;
  /** The facility is a pre-order or back-order parking facility. */
  parking: boolean;
  units: number;
  lines: number;
}

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
  waitingLineCount?: number;
  waitingQuantity?: number;
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
  changedByUserName?: string;
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
 * One batch from GET oms/futureInventoryItems/{id}: the FutureInventoryItem default master, so its product and its
 * purchase order header and line ride along. The facility name comes from seed data.
 */
export interface FutureInventoryBatchDetail extends Omit<FutureInventoryBatch, 'productName' | 'facilityName' | 'exceptionReason'> {
  demandByFacility?: DemandByFacility[];
  product?: { productId: string; productName?: string; internalName?: string };
  purchaseOrderHeader?: { orderId: string; orderName?: string; externalId?: string; statusId?: string; orderDate?: number | string };
  purchaseOrderItem?: { orderItemSeqId: string; quantity?: number; estimatedDeliveryDate?: number | string; statusId?: string };
}

export interface PreorderLine {
  orderItemSeqId: string;
  shipGroupSeqId?: string;
  productId: string;
  productName?: string;
  itemStatusId?: string;
  quantity?: number;
  facilityId?: string;
  facilityTypeId?: string;
  atParking?: boolean;
  promisedDatetime?: number | string;
  autoCancelDate?: number | string;
  futureInventoryItemId?: string;
  futureInventoryItemTypeId?: string;
  batchFacilityId?: string;
  batchPromiseDate?: number | string;
  batchStatusId?: string;
  reservedDatetime?: number | string;
  poId?: string;
  reservationOpen?: boolean;
  /** Units still reserved on the batch. */
  openQuantity?: number;
  /** The batch was received while the line still holds it: the stock has landed and the line waits to be released. */
  readyToRelease?: boolean;
  /** A receipt or variance committed the line to physical stock: it no longer waits on future inventory. */
  committed?: boolean;
  /** The line's reservation ledger, one row per reservation or release on a batch (detail only). */
  reservations?: PreorderReservation[];
}

export interface PreorderReservation {
  futureInventoryItemId: string;
  reasonEnumId: string;
  quantity: number;
  createdDate: number | string;
  open: boolean;
}

export interface PreorderOrder {
  orderId: string;
  orderName?: string;
  externalId?: string;
  orderDate?: number | string;
  statusId?: string;
  productStoreId?: string;
  salesChannelEnumId?: string;
  shipmentMethodTypeId?: string;
  customerPartyId?: string;
  customerName?: string;
  email?: string;
  /** Lines with a reservation history, open or not. */
  lineCount?: number;
  /** Lines still holding an open reservation: the items still waiting. */
  openLineCount?: number;
  parkedLineCount?: number;
  /** The facilities where its lines with an open reservation wait. */
  waitingFacilityIds?: string[];
  readyToReleaseLineCount?: number;
  openReservedQuantity?: number;
  earliestPromiseDate?: number | string;
  latestPromiseDate?: number | string;
  futureInventoryItemTypeIds?: string[];
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

/** A line of GET oms/purchaseOrders/{orderId}: the OrderItem, with what is left of it and its future inventory batch. */
export interface PurchaseOrderLine {
  orderItemSeqId: string;
  shipGroupSeqId?: string;
  productId: string;
  productName?: string;
  statusId?: string;
  itemStatusDesc?: string;
  facilityId?: string;
  quantity?: number;
  cancelQuantity?: number;
  unitPrice?: number;
  estimatedDeliveryDate?: number | string;
  receivedQuantity?: number;
  openQuantity?: number;
  unshippedQuantity?: number;
  futureInventoryItemId?: string;
  futureInventoryStatusId?: string;
  futureInventoryAvailableToPromise?: number;
  futureInventoryReserved?: number;
}

/** GET oms/purchaseOrders/{orderId}: the OrderHeader with its supplier and destination, and its lines. */
export interface PurchaseOrderDetail {
  orderId: string;
  orderName?: string;
  externalId?: string;
  statusId?: string;
  orderStatusDesc?: string;
  orderDate?: number | string;
  productStoreId?: string;
  grandTotal?: number;
  currencyUom?: string;
  supplierPartyId?: string;
  supplierName?: string;
  facilityId?: string;
  facilityName?: string;
  items: PurchaseOrderLine[];
}

/** A row of GET oms/purchaseOrders/{orderId}/receipts (PurchaseOrderItemShipmentReceipt). */
export interface PurchaseOrderReceipt {
  receiptId: string;
  orderId?: string;
  orderItemSeqId?: string;
  productId?: string;
  quantityAccepted?: number;
  quantityRejected?: number;
  datetimeReceived?: number | string;
  receivedByUserLoginId?: string;
}

/** One row of GET poorti/purchaseShipments: a PURCHASE_SHIPMENT with what was accepted and rejected on receipt. */
export interface InboundShipmentSummary {
  shipmentId: string;
  externalId?: string;
  shipmentTypeId?: string;
  statusId?: string;
  primaryOrderId?: string;
  orderName?: string;
  orderExternalId?: string;
  destinationFacilityId?: string;
  estimatedArrivalDate?: number | string;
  estimatedShipDate?: number | string;
  createdDate?: number | string;
  itemCount?: number;
  quantityTotal?: number;
  /** Accepted on receipt. */
  receivedQuantity?: number;
  rejectedQuantity?: number;
}

/** GET poorti/purchaseShipments/{shipmentId}: the list row, its items and its receipts. */
export interface InboundShipmentDetail extends InboundShipmentSummary {
  items: { shipmentItemSeqId: string; productId: string; productName?: string; quantity?: number; receivedQuantity?: number; rejectedQuantity?: number }[];
  receipts: {
    receiptId: string;
    shipmentItemSeqId?: string;
    productId: string;
    orderId?: string;
    orderItemSeqId?: string;
    quantityAccepted?: number;
    quantityRejected?: number;
    datetimeReceived?: number | string;
    receivedByUserLoginId?: string;
  }[];
}

/**
 * A store's setting for one pre-order email type, one per entry of the PreorderAppEmail catalog (admin/enums), joined
 * with the store's ProductStoreEmailSetting for that type (oms/productStoreEmailSettings).
 */
export interface PreorderEmailSetting {
  /** The catalog entry's relatedEnumId: a PRDS_EMAIL enumeration, the ProductStoreEmailSetting.emailType. */
  emailType: string;
  /** The email type's own description. */
  description?: string;
  /** Something sends this type (the catalog entry's optionIndicator Y). */
  wired: boolean;
  /** When it is sent: the catalog entry's description. */
  triggerDescription?: string;
  /** The store has a setting for this type. */
  exists: boolean;
  enabled: boolean;
  subject?: string;
  fromAddress?: string;
  ccAddress?: string;
  bccAddress?: string;
  systemMessageRemoteId?: string;
  gatewayAuthId?: string;
  /** Both the gateway remote and its auth ID are set. */
  gatewayConfigured: boolean;
}

/** The fields of a setting a save changes; an empty string clears one. */
export type EmailSettingChanges = Partial<Record<'subject' | 'fromAddress' | 'ccAddress' | 'bccAddress' | 'systemMessageRemoteId' | 'gatewayAuthId', string>>
  & { enabled?: boolean };

/** A Unigate remote (SystemMessageRemote) a store's email setting can be sent through. */
export interface EmailGateway {
  systemMessageRemoteId: string;
  description: string;
}

/** A row of a store's email log (GET oms/communicationEvents with productStoreId). */
export interface CommunicationEventRow {
  communicationEventId: string;
  emailType?: string;
  statusId?: string;
  datetimeStarted?: number | string;
  subject?: string;
  toString?: string;
  partyIdTo?: string;
  orderId?: string;
}
