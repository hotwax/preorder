import { describe, expect, it } from 'vitest';
import { attachLines, isOpenLine, summarizePreorderLines } from '@/utils/preorders';
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
