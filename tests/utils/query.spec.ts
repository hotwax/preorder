import { describe, expect, it } from 'vitest';
import { readEntityList, readList, toCsv, toListParams, whereBetween, whereContains, whereEquals, whereIn, withPaging, type EntityParams } from '@/utils/query';

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

describe('entity REST filters', () => {
  it('whereEquals skips empty and All', () => {
    const params: EntityParams = {};
    whereEquals(params, 'a', ''); whereEquals(params, 'b', 'All'); whereEquals(params, 'c', undefined); whereEquals(params, 'd', 'x'); whereEquals(params, 'e', 0);
    expect(params).toEqual({ d: 'x', e: 0 });
  });

  it('whereIn is equals for one value and in for several, from a list or a comma string', () => {
    const params: EntityParams = {};
    whereIn(params, 'one', ['A']); whereIn(params, 'many', 'A, B,All'); whereIn(params, 'none', []); whereIn(params, 'all', ['All']);
    expect(params).toEqual({ one: 'A', many: 'A,B', many_op: 'in' });
  });

  it('whereContains ignores case and trims', () => {
    const params: EntityParams = {};
    whereContains(params, 'productName', '  shirt ');
    whereContains(params, 'other', '   ');
    expect(params).toEqual({ productName: 'shirt', productName_op: 'contains', productName_ic: 'Y' });
  });

  it('whereBetween sends either end alone', () => {
    const params: EntityParams = {};
    whereBetween(params, 'promiseDate', '2026-10-01', ''); whereBetween(params, 'orderDate', undefined, '2026-10-31');
    expect(params).toEqual({ promiseDate_from: '2026-10-01', orderDate_thru: '2026-10-31' });
  });

  it('withPaging puts the unique tie-breaker last and only sets what it is given', () => {
    const params: EntityParams = {};
    withPaging(params, { orderBy: '-promiseDate', tieBreaker: 'futureInventoryItemId', pageIndex: 2, pageSize: 20 });
    expect(params).toEqual({ orderByField: '-promiseDate,futureInventoryItemId', pageIndex: 2, pageSize: 20 });
    const bare: EntityParams = {};
    withPaging(bare, {});
    expect(bare).toEqual({});
  });
});

describe('readEntityList', () => {
  it('reads a bare array and the X-Total-Count header', () => {
    expect(readEntityList({ data: [{ a: 1 }], headers: { 'x-total-count': '42' } })).toEqual({ rows: [{ a: 1 }], total: 42 });
  });

  it('falls back to the row count without the header, and to no rows for anything else', () => {
    expect(readEntityList({ data: [{}, {}], headers: {} }).total).toBe(2);
    expect(readEntityList({ data: { errors: 'x' } })).toEqual({ rows: [], total: 0 });
    expect(readEntityList(undefined)).toEqual({ rows: [], total: 0 });
  });
});
