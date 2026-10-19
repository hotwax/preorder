import { api } from '@common';
import { ensureOk } from '@/utils/response';
import type { InboundShipmentDetail } from '@/types';

/** Inbound shipment detail (poorti's purchase shipment): the shipment, its items with accepted and rejected quantities, and its receipts. */
export function useInboundShipments() {
  async function fetchShipment(shipmentId: string): Promise<InboundShipmentDetail> {
    const shipment = (await ensureOk(api({ url: `poorti/purchaseShipments/${encodeURIComponent(shipmentId)}`, method: 'get' }), 'Failed to load the shipment.')).shipment;
    return { ...shipment, items: shipment?.items || [], receipts: shipment?.receipts || [] };
  }
  return { fetchShipment };
}
