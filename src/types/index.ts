/** Shapes the preorder REST resources return (see docs/SPEC.md §4.2). */

export interface FutureInventoryBatch {
  futureInventoryItemId: string;
  productId: string;
  productName?: string;
  facilityId?: string;
  facilityName?: string;
  futureInventoryItemTypeId?: string;
  promiseDate?: number | string;
  quantityOnHandTotal?: number;
  availableToPromiseTotal?: number;
  reservedQuantity?: number;
  statusId?: string;
  poId?: string;
  poItemSeqId?: string;
  externalId?: string;
  shipmentExternalId?: string;
  waitingLineCount?: number;
  waitingQuantity?: number;
  exceptionReason?: string;
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
  batchPromiseDate?: number | string;
  batchStatusId?: string;
  poId?: string;
  reservationOpen?: boolean;
  openQuantity?: number;
  reservations?: { futureInventoryItemId: string; reasonEnumId: string; quantity: number; createdDate: number | string; open: boolean }[];
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
  lineCount?: number;
  parkedLineCount?: number;
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
