import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { isClosedLine, linesToMove, toSupplierOptions } from '@/utils/purchaseOrders';
import { validUnitCost } from '@/utils/purchaseOrders';

describe('supplier options', () => {
  it('names a group, else a person, else the party id, by name', () => {
    expect(toSupplierOptions([
      { partyId: 'P3', firstName: 'Zoe', lastName: 'Ng' },
      { partyId: 'P1', groupName: 'Acme Supply' },
      { partyId: 'P2' },
      { partyId: 'P4', lastName: 'Brown' },
    ])).toEqual([
      { partyId: 'P1', name: 'Acme Supply' },
      { partyId: 'P4', name: 'Brown' },
      { partyId: 'P2', name: 'P2' },
      { partyId: 'P3', name: 'Zoe Ng' },
    ]);
  });

  it('drops the _NA_ placeholder and a repeated party', () => {
    expect(toSupplierOptions([
      { partyId: '_NA_', groupName: 'Not applicable' },
      { partyId: 'P1', groupName: 'Acme' },
      { partyId: 'P1', groupName: 'Acme again' },
    ])).toEqual([{ partyId: 'P1', name: 'Acme' }]);
    expect(toSupplierOptions(undefined as any)).toEqual([]);
  });
});

describe('lines a purchase order date change moves', () => {
  const day = DateTime.fromISO('2026-11-30', { zone: 'America/New_York' }).toMillis();

  it('moves open lines whose date differs, skipping closed lines and lines already on the day', () => {
    const lines = linesToMove([
      { orderItemSeqId: '01', productId: 'A', statusId: 'ITEM_APPROVED', estimatedDeliveryDate: day - 86400000 },
      { orderItemSeqId: '02', productId: 'B', statusId: 'ITEM_CREATED', estimatedDeliveryDate: day },
      { orderItemSeqId: '03', productId: 'C', statusId: 'ITEM_CANCELLED', estimatedDeliveryDate: day - 86400000 },
      { orderItemSeqId: '04', productId: 'D', statusId: 'ITEM_COMPLETED' },
      { orderItemSeqId: '05', productId: 'E', statusId: 'ITEM_APPROVED' },
    ], day);
    expect(lines.map((line) => line.orderItemSeqId)).toEqual(['01', '05']);
  });
});

describe('validUnitCost (preorder-maarg#101)', () => {
  it('takes no cost, zero and a positive cost, and refuses a negative or unreadable one', () => {
    expect([undefined, null, '', 0, 5, '2.5'].every(validUnitCost)).toBe(true);
    expect([-5, '-0.01', 'abc'].some(validUnitCost)).toBe(false);
  });
});

describe('closed lines', () => {
  it('reads a cancelled or completed line as closed', () => {
    expect(isClosedLine({ statusId: 'ITEM_COMPLETED' })).toBe(true);
    expect(isClosedLine({ statusId: 'ITEM_CANCELLED' })).toBe(true);
    expect(isClosedLine({ statusId: 'ITEM_APPROVED' })).toBe(false);
    expect(isClosedLine({})).toBe(false);
  });
});
