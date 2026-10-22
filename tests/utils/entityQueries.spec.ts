import { describe, expect, it } from 'vitest';
import { toBatchQuery, toOrderLinesQuery, toPreorderQuery } from '@/utils/entityQueries';

describe('toBatchQuery', () => {
  const page = { orderBy: 'promiseDate', pageIndex: 0, pageSize: 20 };

  it('maps the find page filters to oms/futureInventoryItems field filters', () => {
    expect(toBatchQuery({
      ...page, statusId: 'FUTURE_INV_ACTIVE,FUTURE_INV_EXPIRED', futureInventoryItemTypeId: 'FIT_PRE_ORDER', facilityId: 'WH1', poId: 'PO1',
      promiseDateFrom: '2026-10-01', promiseDateThru: '2026-10-31', keyword: 'shirt',
    })).toEqual({
      statusId: 'FUTURE_INV_ACTIVE,FUTURE_INV_EXPIRED', statusId_op: 'in', futureInventoryItemTypeId: 'FIT_PRE_ORDER', facilityId: 'WH1', poId: 'PO1',
      promiseDate_from: '2026-10-01', promiseDate_thru: '2026-10-31', productName: 'shirt', productName_op: 'contains', productName_ic: 'Y',
      orderByField: 'promiseDate,futureInventoryItemId', pageIndex: 0, pageSize: 20,
    });
  });

  it('scopes to the store facilities only when no single facility is picked', () => {
    expect(toBatchQuery(page, ['A', 'B'])).toMatchObject({ facilityId: 'A,B', facilityId_op: 'in' });
    expect(toBatchQuery({ ...page, facilityId: 'WH1' }, ['A', 'B'])).toMatchObject({ facilityId: 'WH1' });
    expect(toBatchQuery({ ...page, facilityId: 'WH1' }, ['A', 'B'])).not.toHaveProperty('facilityId_op');
    expect(toBatchQuery(page, [])).not.toHaveProperty('facilityId');
  });

  it('turns the reservation flags into ranges on the computed and ATP fields', () => {
    expect(toBatchQuery({ ...page, hasReservations: 'Y' })).toMatchObject({ reservedQuantity_from: '0.000001' });
    expect(toBatchQuery({ ...page, overcommitted: 'Y' })).toMatchObject({ availableToPromiseTotal_thru: '-0.000001' });
  });
});

describe('toPreorderQuery', () => {
  it('maps the header filters and the order name search', () => {
    expect(toPreorderQuery({
      productStoreId: 'STORE', statusId: 'ORDER_APPROVED,ORDER_CREATED', salesChannelEnumId: 'WEB_SALES_CHANNEL',
      orderDateFrom: '2026-10-01', orderDateThru: '2026-10-31', keyword: '#1001', orderBy: '-orderDate', pageIndex: 1, pageSize: 20,
    })).toEqual({
      productStoreId: 'STORE', statusId: 'ORDER_APPROVED,ORDER_CREATED', statusId_op: 'in', salesChannelEnumId: 'WEB_SALES_CHANNEL',
      orderDate_from: '2026-10-01', orderDate_thru: '2026-10-31', orderName: '#1001', orderName_op: 'contains', orderName_ic: 'Y',
      orderByField: '-orderDate,orderId', pageIndex: 1, pageSize: 20,
    });
  });

  it('reads the lines of several orders in one request', () => {
    expect(toOrderLinesQuery(['A', 'B'])).toMatchObject({ orderId: 'A,B', orderId_op: 'in', pageSize: 1000, orderByField: 'orderId,orderItemSeqId,futureInventoryItemId' });
    expect(toOrderLinesQuery(['A'])).toMatchObject({ orderId: 'A' });
  });
});
