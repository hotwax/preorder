import { describe, expect, it } from 'vitest';
import { Settings } from 'luxon';
import {
  escapeSolr, purchaseOrderFilters, purchaseOrderKeywordQuery, purchaseOrderLinesQuery, purchaseOrderPageQuery, readOrderGroups,
  toPurchaseOrderSummary,
} from '@/utils/purchaseOrderSolr';

describe('purchase order Solr queries', () => {
  it('matches part of the order id, name or external id, with query syntax taken literally', () => {
    expect(purchaseOrderKeywordQuery('  ')).toBe('*:*');
    expect(purchaseOrderKeywordQuery('hcs-po')).toBe('orderId:*hcs\\-po* OR orderName:*hcs\\-po* OR externalOrderId:*hcs\\-po*');
    expect(escapeSolr('batch A (2)')).toBe('batch\\ A\\ \\(2\\)');
  });

  it('filters purchase order lines by status, supplier and facility, quoting each value', () => {
    expect(purchaseOrderFilters({ statusId: 'ORDER_CREATED,ORDER_APPROVED', supplierPartyId: 'COMPANY', facilityId: 'WH "1"' })).toEqual([
      'docType:ORDER',
      'orderTypeId:PURCHASE_ORDER',
      'orderStatusId:("ORDER_CREATED" OR "ORDER_APPROVED")',
      'customerPartyId:"COMPANY"',
      'facilityId:"WH \\"1\\""',
    ]);
  });

  it("bounds dates by whole days in the user's time zone, and the arrival date by lines that are not cancelled", () => {
    const zone = Settings.defaultZone;
    Settings.defaultZone = 'Asia/Kolkata';
    try {
      expect(purchaseOrderFilters({ arrivalDateFrom: '2026-11-30' }).slice(2)).toEqual([
        'estimatedDeliveryDate:[2026-11-29T18:30:00.000Z TO *]',
        '-orderItemStatusId:ITEM_CANCELLED',
      ]);
      expect(purchaseOrderFilters({ orderDateFrom: '2026-10-18', orderDateThru: '2026-10-18' }).slice(2)).toEqual([
        'orderDate:[2026-10-17T18:30:00.000Z TO 2026-10-18T18:29:59.999Z]',
      ]);
    } finally {
      Settings.defaultZone = zone;
    }
  });

  it('pages orders by group, with undated orders sorted last', () => {
    const page = purchaseOrderPageQuery({ orderBy: 'earliestArrivalDate' }, 2, 20).json.params;
    expect(page).toMatchObject({ rows: 20, start: 40, group: true, 'group.field': 'orderId', 'group.limit': 1, 'group.ngroups': true });
    expect(page.sort).toBe('def(ms(estimatedDeliveryDate),4102444800000) asc,orderId asc');
    expect(purchaseOrderPageQuery({ orderBy: '-orderDate' }, 0, 20).json.params.sort).toBe('orderDate desc,orderId desc');
  });

  it("reads all of the page's orders' lines, without the page's line filters", () => {
    const lines = purchaseOrderLinesQuery(['A', 'B']).json;
    expect(lines.filter).toEqual(['docType:ORDER', 'orderTypeId:PURCHASE_ORDER', 'orderId:("A" OR "B")']);
    expect(lines.params).toMatchObject({ rows: 2, 'group.field': 'orderId' });
  });
});

describe('purchase order rows', () => {
  const docs = [
    { orderId: 'PO1', orderItemSeqId: '01', orderName: 'Batch A', externalOrderId: 'HCS-PO-A', orderStatusId: 'ORDER_APPROVED', orderDate: '2026-10-18T23:00:00Z',
      facilityId: 'WH', facilityName: 'Warehouse', customerPartyId: 'COMPANY', customerPartyName: 'Company', orderItemStatusId: 'ITEM_APPROVED',
      quantity: 4, estimatedDeliveryDate: '2026-11-30T18:30:00Z' },
    { orderId: 'PO1', orderItemSeqId: '02', orderItemStatusId: 'ITEM_APPROVED', quantity: 3, estimatedDeliveryDate: '2026-12-10T18:30:00Z' },
    { orderId: 'PO1', orderItemSeqId: '03', orderItemStatusId: 'ITEM_CANCELLED', quantity: 9, estimatedDeliveryDate: '2026-11-01T18:30:00Z' },
  ];

  it('rolls up the lines that are not cancelled, and takes the header from the first line', () => {
    expect(toPurchaseOrderSummary('PO1', docs, 2)).toEqual({
      orderId: 'PO1', orderName: 'Batch A', externalId: 'HCS-PO-A', statusId: 'ORDER_APPROVED', orderDate: Date.parse('2026-10-18T23:00:00Z'),
      productStoreId: undefined, facilityId: 'WH', facilityName: 'Warehouse', supplierPartyId: 'COMPANY', supplierName: 'Company',
      itemCount: 2, quantityTotal: 7, earliestArrivalDate: Date.parse('2026-11-30T18:30:00Z'), latestArrivalDate: Date.parse('2026-12-10T18:30:00Z'),
      futureInventoryBatchCount: 2,
    });
  });

  it('has no arrival date when no open line has one', () => {
    const row = toPurchaseOrderSummary('PO2', [{ orderItemStatusId: 'ITEM_CREATED', quantity: 2 }]);
    expect(row.earliestArrivalDate).toBeUndefined();
    expect(row.futureInventoryBatchCount).toBe(0);
  });

  it('reads the grouped answer in order, with the matching order count', () => {
    expect(readOrderGroups({ grouped: { orderId: { ngroups: 7, groups: [{ groupValue: 'B', doclist: { docs: [{ orderId: 'B' }] } }, { groupValue: 'A', doclist: { docs: [] } }] } } }))
      .toEqual({ groups: [{ orderId: 'B', docs: [{ orderId: 'B' }] }, { orderId: 'A', docs: [] }], total: 7 });
    expect(readOrderGroups({})).toEqual({ groups: [], total: 0 });
  });
});
