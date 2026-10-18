import { describe, expect, it } from 'vitest';
import { readList, toCsv, toListParams } from '@/utils/query';

describe('toListParams', () => {
  it('drops empty, false and All values, joins lists and sends true as Y', () => {
    expect(toListParams({
      statusId: ['ORDER_APPROVED', 'ORDER_CREATED'],
      parking: 'parked',
      salesChannelEnumId: 'All',
      orderDateFrom: '',
      hasReservations: true,
      overcommitted: false,
      empty: [],
      pageSize: 20,
      missing: undefined,
    })).toEqual({ statusId: 'ORDER_APPROVED,ORDER_CREATED', parking: 'parked', hasReservations: 'Y', pageSize: 20 });
  });

  it('drops an All entry inside a list', () => {
    expect(toListParams({ statusId: ['All'] })).toEqual({});
  });
});

describe('readList', () => {
  it('reads the rows and the <name>Count total', () => {
    expect(readList({ orders: [{ orderId: 'A' }], ordersCount: 12 }, 'orders')).toEqual({ rows: [{ orderId: 'A' }], total: 12 });
  });

  it('falls back to the row count, and to no rows', () => {
    expect(readList({ orders: [{}, {}] }, 'orders').total).toBe(2);
    expect(readList(undefined, 'orders')).toEqual({ rows: [], total: 0 });
  });
});

describe('toCsv', () => {
  it('quotes every value and doubles quotes', () => {
    expect(toCsv([{ a: 'x "y"', b: 3 }], [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }])).toBe('"A","B"\n"x ""y""","3"');
  });
});
