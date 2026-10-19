import { api } from '@common';
import { ensureOk } from '@/utils/response';

/** Inbound shipment detail: the shipment, its items with received quantities, and its receipts. */
export function useInboundShipments() {
  async function fetchShipment(shipmentId: string) {
    return (await ensureOk(api({ url: `preorder/inboundShipments/${encodeURIComponent(shipmentId)}`, method: 'get' }), 'Failed to load the shipment.')).shipment;
  }
  async function createShipment(data: { orderId: string; externalId: string; arrivalDate: string; items: { orderItemSeqId: string; quantity: number }[] }) {
    return ensureOk(api({ url: 'preorder/inboundShipments', method: 'post', data }), 'Failed to create the shipment.');
  }
  async function receiveShipment(shipmentId: string) {
    return ensureOk(api({ url: `preorder/inboundShipments/${encodeURIComponent(shipmentId)}/receive`, method: 'post' }), 'Failed to receive the shipment.');
  }
  return { fetchShipment, createShipment, receiveShipment };
}
