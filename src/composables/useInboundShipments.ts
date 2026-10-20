import { api } from '@common';
import { ensureOk } from '@/utils/response';
import type { InboundShipmentDetail } from '@/types';

/** A line of a new inbound shipment: the purchase order line and how much of it ships. */
export interface NewShipmentLine { orderItemSeqId: string; quantity: number }
/** What to receive of a shipment item; an item left out receives nothing. */
export interface ShipmentReceiptLine { shipmentItemSeqId: string; quantityAccepted: number; quantityRejected: number }

/** Inbound shipments (poorti purchaseShipments): the detail, and creating and receiving them (preorder-maarg#84). */
export function useInboundShipments() {
  async function fetchShipment(shipmentId: string): Promise<InboundShipmentDetail> {
    const shipment = (await ensureOk(api({ url: `poorti/purchaseShipments/${encodeURIComponent(shipmentId)}`, method: 'get' }), 'Failed to load the shipment.')).shipment;
    return { ...shipment, items: shipment?.items || [], receipts: shipment?.receipts || [] };
  }

  /**
   * Creates a shipment for open lines of an approved purchase order. externalId is the retry key: sending the same
   * reference, lines and date again returns the shipment already created.
   */
  async function createShipment(data: { orderId: string; externalId: string; arrivalDate: string; items: NewShipmentLine[] }): Promise<{ shipmentId: string }> {
    return ensureOk(api({ url: 'poorti/purchaseShipments', method: 'post', data }), 'Failed to create the shipment.');
  }

  /** Receives a shipment, in part or in full; the shipment is received once every item is. */
  async function receiveShipment(shipmentId: string, items: ShipmentReceiptLine[]): Promise<{ receiptIds?: string[]; fullyReceived?: boolean }> {
    return ensureOk(api({ url: `poorti/purchaseShipments/${encodeURIComponent(shipmentId)}/receive`, method: 'post', data: { shipmentId, items } }), 'Failed to receive the shipment.');
  }

  return { fetchShipment, createShipment, receiveShipment };
}
