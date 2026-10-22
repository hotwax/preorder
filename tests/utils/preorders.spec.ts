import { describe, expect, it } from 'vitest';
import { attachLines, demandByFacility, distinctOrderIds, inIdOrder, isOpenLine, reservationHistory, shapeOrder, summarizePreorderLines, toPreorderLine } from '@/utils/preorders';
import type { PreorderLine } from '@/types';

const line = (extra: Partial<PreorderLine>): PreorderLine => ({ orderItemSeqId: '00001', productId: 'P1', ...extra });
const isParking = (facilityId?: string) => facilityId === 'PRE_ORDER_PARKING';

describe('summarizePreorderLines', () => {
  it('counts items once even when split over batches, and counts parked ones', () => {
    const summary = summarizePreorderLines([
      line({ orderItemSeqId: '00001', facilityId: 'PRE_ORDER_PARKING', futureInventoryItemTypeId: 'FIT_PRE_ORDER', openQuantity: 2, promisedDatetime: '2026-11-10 00:00:00' }),
      line({ orderItemSeqId: '00001', facilityId: 'PRE_ORDER_PARKING', futureInventoryItemTypeId: 'FIT_PRE_ORDER', openQuantity: 1, promisedDatetime: '2026-11-01 00:00:00' }),
      line({ orderItemSeqId: '00002', facilityId: 'STORE_1', futureInventoryItemTypeId: 'FIT_BACK_ORDER', openQuantity: 4 }),
    ], isParking);
    expect(summary).toMatchObject({ lineCount: 2, parkedLineCount: 1, openReservedQuantity: 7, earliestPromiseDate: '2026-11-01 00:00:00', latestPromiseDate: '2026-11-10 00:00:00' });
    expect(summary.futureInventoryItemTypeIds).toEqual(['FIT_PRE_ORDER', 'FIT_BACK_ORDER']);
  });

  it('leaves cancelled items out and reports no promise range when none is set', () => {
    const summary = summarizePreorderLines([line({ itemStatusId: 'ITEM_CANCELLED', facilityId: 'PRE_ORDER_PARKING' }), line({ orderItemSeqId: '00002' })], isParking);
    expect(summary).toMatchObject({ lineCount: 1, parkedLineCount: 0 });
    expect(summary.earliestPromiseDate).toBeUndefined();
  });

  it('treats a line without an item status as open', () => {
    expect(isOpenLine(line({}))).toBe(true);
    expect(isOpenLine(line({ itemStatusId: 'ITEM_COMPLETED' }))).toBe(false);
  });
});

describe('attachLines', () => {
  it('groups lines under their orders and gives an order with none an empty list', () => {
    const orders = attachLines([{ orderId: 'A' }, { orderId: 'B' }], [{ ...line({}), orderId: 'A' }, { ...line({ orderItemSeqId: '00002' }), orderId: 'A' }]);
    expect(orders[0].lines).toHaveLength(2);
    expect(orders[1].lines).toEqual([]);
  });
});

describe('distinctOrderIds and inIdOrder', () => {
  it('lists each order once in first-seen order', () => {
    expect(distinctOrderIds([{ orderId: 'B' }, { orderId: 'A' }, { orderId: 'B' }, { orderId: 'C' }])).toEqual(['B', 'A', 'C']);
    expect(distinctOrderIds([])).toEqual([]);
  });

  it('orders rows by the ids and drops an id with no row', () => {
    expect(inIdOrder([{ orderId: 'A' }, { orderId: 'C' }, { orderId: 'B' }], ['B', 'X', 'A'])).toEqual([{ orderId: 'B' }, { orderId: 'A' }]);
  });
});

describe('toPreorderLine and shapeOrder', () => {
  it('marks a waiting line open, and ready to release once its batch is received', () => {
    expect(toPreorderLine(line({ batchStatusId: 'FUTURE_INV_ACTIVE' }))).toMatchObject({ reservationOpen: true, readyToRelease: false, committed: false });
    expect(toPreorderLine(line({ batchStatusId: 'FUTURE_INV_RECEIVED' }))).toMatchObject({ readyToRelease: true });
  });

  it('marks lines at parking and adds the counts, facilities and ready-to-release items the rows show', () => {
    const shaped = shapeOrder({
      orderId: 'O1',
      lines: [
        toPreorderLine(line({ orderItemSeqId: '00001', facilityId: 'PRE_ORDER_PARKING', openQuantity: 2, batchStatusId: 'FUTURE_INV_RECEIVED' })),
        toPreorderLine(line({ orderItemSeqId: '00002', facilityId: 'STORE_1', openQuantity: 1 })),
      ],
    }, isParking);
    expect(shaped.lines.map((entry) => entry.atParking)).toEqual([true, false]);
    expect(shaped).toMatchObject({ openLineCount: 2, parkedLineCount: 1, readyToReleaseLineCount: 1, openReservedQuantity: 3, waitingFacilityIds: ['PRE_ORDER_PARKING', 'STORE_1'] });
  });
});

describe('reservationHistory', () => {
  const rows = [
    { orderItemSeqId: '00001', futureInventoryItemId: 'A', reasonEnumId: 'FID_RESERVED', availableToPromiseDiff: -2, createdDate: 1 },
    { orderItemSeqId: '00001', futureInventoryItemId: 'A', reasonEnumId: 'FID_REALLOCATED_FROM', availableToPromiseDiff: 2, createdDate: 2 },
    { orderItemSeqId: '00001', futureInventoryItemId: 'B', reasonEnumId: 'FID_REALLOCATED_TO', availableToPromiseDiff: -2, createdDate: 2 },
    { orderItemSeqId: '00001', futureInventoryItemId: 'A', reasonEnumId: 'FID_PO_QTY_CHG', availableToPromiseDiff: 5, createdDate: 3 },
    { futureInventoryItemId: 'A', reasonEnumId: 'FID_RESERVED', availableToPromiseDiff: -1, createdDate: 4 },
  ];

  it('keeps an item\'s reservation, release and move rows, with the quantity as a positive number', () => {
    const history = reservationHistory(rows, new Map([['00001', new Set(['B'])]]));
    expect(history.get('00001')?.map((entry) => [entry.futureInventoryItemId, entry.reasonEnumId, entry.quantity])).toEqual([
      ['A', 'FID_RESERVED', 2], ['A', 'FID_REALLOCATED_FROM', 2], ['B', 'FID_REALLOCATED_TO', 2],
    ]);
  });

  it('calls an entry open only when it reserved the batch the item still waits on', () => {
    const history = reservationHistory(rows, new Map([['00001', new Set(['B'])]]));
    expect(history.get('00001')?.map((entry) => entry.open)).toEqual([false, false, true]);
  });
});

describe('demandByFacility', () => {
  const facilityName = (id: string) => ({ W1: 'Warehouse', P1: 'Parking' } as Record<string, string>)[id];

  it('adds units and items per facility, most units first, and flags parking', () => {
    const rows = demandByFacility([
      { orderId: 'O1', orderItemSeqId: '1', facilityId: 'P1', openQuantity: 1 },
      { orderId: 'O2', orderItemSeqId: '1', facilityId: 'W1', openQuantity: 3 },
      { orderId: 'O3', orderItemSeqId: '1', facilityId: 'P1', openQuantity: 1 },
      { orderId: 'O4', orderItemSeqId: '1', openQuantity: 9 },
    ], (id) => id === 'P1', facilityName);
    expect(rows).toEqual([
      { facilityId: 'W1', facilityName: 'Warehouse', parking: false, units: 3, lines: 1 },
      { facilityId: 'P1', facilityName: 'Parking', parking: true, units: 2, lines: 2 },
    ]);
  });
});
