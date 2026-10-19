import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn(async (_request: any) => ({ data: {} })));
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));

import { usePreorderActions } from '@/composables/usePreorderActions';
import type { PreorderOrder } from '@/types';

const order = {
  orderId: 'ORD1',
  lines: [
    { orderItemSeqId: '01', shipGroupSeqId: '00001', productId: 'P', reservationOpen: true, atParking: true },
    { orderItemSeqId: '02', shipGroupSeqId: '00001', productId: 'P', reservationOpen: true, atParking: false },
    { orderItemSeqId: '03', shipGroupSeqId: '00001', productId: 'P', reservationOpen: false, atParking: true },
    { orderItemSeqId: '04', shipGroupSeqId: '00001', productId: 'P', reservationOpen: false, committed: true },
  ],
} as PreorderOrder;

describe('usePreorderActions bulk actions', () => {
  beforeEach(() => api.mockClear());

  it('cancels only the lines that hold an open reservation', async () => {
    const result = await usePreorderActions().cancelPreorderItems([order]);
    expect(result).toEqual({ cancelled: 2, failed: 0 });
    expect(api).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[0][0].data.items).toEqual([{ orderItemSeqId: '01' }, { orderItemSeqId: '02' }]);
  });

  it('releases only the open-reservation lines at parking', async () => {
    const result = await usePreorderActions().releaseToBrokering([order]);
    expect(result).toEqual({ moved: 1, failed: 0 });
    expect(api.mock.calls.map((call) => call[0].data.orderItemSeqId)).toEqual(['01']);
  });

  it('sends nothing for an order with no open reservation', async () => {
    const settled = { orderId: 'ORD2', lines: [order.lines[2], order.lines[3]] } as PreorderOrder;
    expect(await usePreorderActions().cancelPreorderItems([settled])).toEqual({ cancelled: 0, failed: 0 });
    expect(await usePreorderActions().releaseToBrokering([settled])).toEqual({ moved: 0, failed: 0 });
    expect(api).not.toHaveBeenCalled();
  });
});
