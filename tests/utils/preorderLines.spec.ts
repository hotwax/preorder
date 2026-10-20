import { describe, expect, it } from 'vitest';
import { moveTargets, releasableLines, waitingFacilityIds, waitingLines } from '@/utils/preorderLines';
import type { PreorderLine } from '@/types';

const line = (seq: string, facilityId: string, extra: Partial<PreorderLine> = {}): PreorderLine => ({ orderItemSeqId: seq, productId: 'P', facilityId, ...extra });

const order = {
  lines: [
    line('01', 'PRE_ORDER_PARKING', { reservationOpen: true, atParking: true }),
    line('02', 'WH', { reservationOpen: true, atParking: false }),
    line('03', 'PRE_ORDER_PARKING', { reservationOpen: false, atParking: true }),
    line('04', 'STORE', { reservationOpen: false, committed: true }),
  ],
};

describe('pre-order lines', () => {
  it('waits on an open reservation, at any facility', () => {
    expect(waitingLines(order).map((row) => row.orderItemSeqId)).toEqual(['01', '02']);
  });

  it('releases only lines that both wait and sit at parking', () => {
    // 03 is at parking but its reservation is closed; 02 waits but at a warehouse
    expect(releasableLines(order).map((row) => row.orderItemSeqId)).toEqual(['01']);
  });

  it('leaves nothing to cancel or release on an order with no open reservation', () => {
    const settled = { lines: [line('01', 'WH', { reservationOpen: false, committed: true })] };
    expect(waitingLines(settled)).toEqual([]);
    expect(releasableLines(settled)).toEqual([]);
    expect(waitingLines({} as any)).toEqual([]);
  });

  it('names where the lines wait: the backend list, else the open lines facilities, each once', () => {
    expect(waitingFacilityIds({ ...order, waitingFacilityIds: ['WH', 'WH', 'PRE_ORDER_PARKING'] })).toEqual(['WH', 'PRE_ORDER_PARKING']);
    expect(waitingFacilityIds({ ...order, waitingFacilityIds: [] })).toEqual([]);
    expect(waitingFacilityIds({ lines: [...order.lines, line('05', 'WH', { reservationOpen: true })] })).toEqual(['PRE_ORDER_PARKING', 'WH']);
  });
});

describe('move targets', () => {
  const batches = [
    { futureInventoryItemId: 'AT_WH', facilityId: 'WH' },
    { futureInventoryItemId: 'AT_OTHER', facilityId: 'OTHER_WH' },
    { futureInventoryItemId: 'AT_PARKING', facilityId: 'PRE_ORDER_PARKING' },
    { futureInventoryItemId: 'AT_STORE_PARKING', facilityId: 'ZZ_PARK' },
    { futureInventoryItemId: 'NO_FACILITY' },
  ];
  const typeOf = (facilityId: string) => ({ WH: 'WAREHOUSE', OTHER_WH: 'WAREHOUSE', ZZ_PARK: 'PRE_ORDER' }[facilityId]);

  it('keeps every batch for a line at parking', () => {
    expect(moveTargets({ atParking: true, facilityId: 'PRE_ORDER_PARKING' }, batches, typeOf)).toHaveLength(batches.length);
  });

  it("offers a line at a facility only batches at that facility or at a parking facility", () => {
    const ids = moveTargets({ atParking: false, facilityId: 'WH' }, batches, typeOf).map((batch) => batch.futureInventoryItemId);
    expect(ids).toEqual(['AT_WH', 'AT_PARKING', 'AT_STORE_PARKING', 'NO_FACILITY']);
  });

  it('leaves out the batch the line holds and batches of another FI type', () => {
    const typed = [{ futureInventoryItemId: 'A', facilityId: 'WH', futureInventoryItemTypeId: 'FIT_PRE_ORDER' },
      { futureInventoryItemId: 'B', facilityId: 'WH', futureInventoryItemTypeId: 'FIT_PRE_ORDER' },
      { futureInventoryItemId: 'C', facilityId: 'WH', futureInventoryItemTypeId: 'FIT_BACK_ORDER' }];
    const line = { atParking: false, facilityId: 'WH', futureInventoryItemId: 'A', futureInventoryItemTypeId: 'FIT_PRE_ORDER' };
    expect(moveTargets(line, typed, typeOf).map((batch) => batch.futureInventoryItemId)).toEqual(['B']);
  });

  it('offers the batch a line was moved from again: A to B, then B back to A (preorder-maarg#93)', () => {
    const typed = [{ futureInventoryItemId: 'A', facilityId: 'WH' }, { futureInventoryItemId: 'B', facilityId: 'WH' }];
    const onB = { atParking: false, facilityId: 'WH', futureInventoryItemId: 'B',
      reservations: [{ futureInventoryItemId: 'A', reasonEnumId: 'FID_REALLOCATED' }, { futureInventoryItemId: 'B', reasonEnumId: 'FID_RESERVED' }] };
    expect(moveTargets(onB, typed, typeOf).map((batch) => batch.futureInventoryItemId)).toEqual(['A']);
  });
});
