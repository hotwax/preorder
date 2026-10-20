import { toMillis } from '@/utils/format';
import type { PurchaseOrderLine } from '@/types';

/** The line statuses a purchase order line is closed in: nothing more arrives on it. */
export const CLOSED_PO_LINE_STATUSES = ['ITEM_CANCELLED', 'ITEM_COMPLETED'];

export interface SupplierOption {
  partyId: string;
  name: string;
}

/**
 * Supplier options from the SUPPLIER parties (GET oms/parties/roles/SUPPLIER): a group's name, else a person's first and
 * last name, else the party id; without the _NA_ placeholder or a repeated party, by name.
 */
export function toSupplierOptions(parties: any[]): SupplierOption[] {
  const byId = new Map<string, SupplierOption>();
  (Array.isArray(parties) ? parties : []).forEach((party) => {
    if (!party?.partyId || party.partyId === '_NA_' || byId.has(party.partyId)) return;
    const personName = [party.firstName, party.lastName].filter(Boolean).join(' ');
    byId.set(party.partyId, { partyId: party.partyId, name: party.groupName || personName || party.partyId });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name) || a.partyId.localeCompare(b.partyId));
}

/** The open lines (not cancelled or completed) whose arrival date is not already `arrivalMillis`: the ones a date change moves. */
export const linesToMove = (items: PurchaseOrderLine[], arrivalMillis: number) => items
  .filter((item) => !CLOSED_PO_LINE_STATUSES.includes(item.statusId || '') && toMillis(item.estimatedDeliveryDate) !== arrivalMillis);

/** A unit cost a purchase order line may have: none, or a number not below 0 (preorder-maarg#101). */
export const validUnitCost = (value: unknown) => value === undefined || value === null || value === ''
  || (Number.isFinite(Number(value)) && Number(value) >= 0);

/** A cancelled or completed purchase order line: nothing more arrives on it. */
export const isClosedLine = (item: { statusId?: string }) => CLOSED_PO_LINE_STATUSES.includes(item.statusId || '');
