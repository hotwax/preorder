import { api } from '@common';
import { ensureOk } from '@/utils/response';
import type { InboundShipmentDetail } from '@/types';

/** Inbound shipment detail (poorti's purchase shipment): the shipment, its items with accepted and rejected quantities, and its receipts. */
export function useInboundShipments() {
  async function fetchShipment(shipmentId: string): Promise<InboundShipmentDetail> {
    const shipment = (await ensureOk(api({ url: `poorti/purchaseShipments/${encodeURIComponent(shipmentId)}`, method: 'get' }), 'Failed to load the shipment.')).shipment;
    return { ...shipment, items: shipment?.items || [], receipts: shipment?.receipts || [] };
  }
  async function createShipment(data: { orderId: string; externalId: string; arrivalDate: string; items: { orderItemSeqId: string; quantity: number }[] }) {
    return ensureOk(api({ url: 'preorder/inboundShipments', method: 'post', data }), 'Failed to create the shipment.');
  }
  async function receiveShipment(shipmentId: string) {
    return ensureOk(api({ url: `preorder/inboundShipments/${encodeURIComponent(shipmentId)}/receive`, method: 'post' }), 'Failed to receive the shipment.');
  }
  return { fetchShipment, createShipment, receiveShipment };
}
