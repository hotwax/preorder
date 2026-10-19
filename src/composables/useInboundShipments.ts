import { api } from '@common';
import { ensureOk } from '@/utils/response';

/** Inbound shipment detail: the shipment, its items with received quantities, and its receipts. */
export function useInboundShipments() {
  async function fetchShipment(shipmentId: string) {
    return (await ensureOk(api({ url: `preorder/inboundShipments/${encodeURIComponent(shipmentId)}`, method: 'get' }), 'Failed to load the shipment.')).shipment;
  }
  return { fetchShipment };
}
