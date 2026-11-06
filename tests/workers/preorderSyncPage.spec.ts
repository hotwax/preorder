import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), upsert: vi.fn(async () => 1) }));
vi.mock('@common/core/workerRemoteApi', () => ({ workerGet: mocks.get }));
vi.mock('@/db/preorderDb', () => ({ preorderDb: {
  tables: { preorderSyncPages: 'preorderSyncPages' },
  entity: () => ({ upsertMany: mocks.upsert }),
} }));
import { preorderSyncPageDomain } from '@/workers/domains/operationsDomains';

const ctx = {} as any;
beforeEach(() => { vi.clearAllMocks(); mocks.get.mockReset(); });

describe('future inventory monitoring reads', () => {
  it('includes the released FI supply, reserve and release events, excluding physical events', async () => {
    const events = ['SIE_FI_SUPPLY_UPDATE', 'SIE_FI_RESERVE', 'SIE_FI_RELEASE', 'SIE_PHYSICAL_INVENTORY'];
    mocks.get.mockImplementation(async (_ctx, _url, params) => events
      .filter(eventTypeId => eventTypeId.startsWith(params.eventTypeId.replace('%', '')))
      .map(eventTypeId => ({ eventTypeId })));
    await preorderSyncPageDomain.refetchOne!(ctx, { shopId: 'DOLLSKILL', kind: 'quantity', pageIndex: 0 });
    expect(mocks.upsert.mock.calls[0][0][0].rows.map((row: any) => row.eventTypeId))
      .toEqual(events.slice(0, 3));
    expect(mocks.get).toHaveBeenCalledWith(ctx, 'sob/shopify/inventoryAdjustmentDetails', expect.objectContaining({ shopId: 'DOLLSKILL', eventTypeId_op: 'like' }));
  });

  it('pages metafield revisions in stable newest-first order and keeps delivery evidence', async () => {
    const rows = [{ metafieldId: 'M1', metafieldDetailSeqId: 4, confirmedDigest: null, failed: 'N' }];
    mocks.get.mockResolvedValue(rows);
    await preorderSyncPageDomain.refetchOne!(ctx, { shopId: 'DOLLSKILL', kind: 'metafield', pageIndex: 1 });
    expect(mocks.get).toHaveBeenCalledWith(ctx, 'sob/shopify/preorderMetafieldDetails', {
      shopId: 'DOLLSKILL', pageIndex: 1, pageSize: 50,
      eventTypeId: 'SIE_FI_%', eventTypeId_op: 'like', orderByField: '-createdDate,metafieldId,-metafieldDetailSeqId',
    });
    expect(mocks.upsert.mock.calls[0][0][0]).toMatchObject({ pageKey: 'DOLLSKILL:metafield:1', rows, hasMore: false });
  });

  it('reads shop-scoped metafield identities without inventing successful publication', async () => {
    mocks.get.mockResolvedValue([{ metafieldId: 'M1', shopifyMetafieldId: null }]);
    await preorderSyncPageDomain.refetchOne!(ctx, { shopId: 'DOLLSKILL', kind: 'published' });
    expect(mocks.get).toHaveBeenCalledWith(ctx, 'sob/shopify/preorderMetafields', {
      shopId: 'DOLLSKILL', pageIndex: 0, pageSize: 50, orderByField: 'metafieldId',
    });
    expect(mocks.upsert.mock.calls[0][0][0].rows[0].shopifyMetafieldId).toBeNull();
  });

  it('propagates failed reads without overwriting the last successful page', async () => {
    mocks.get.mockRejectedValue(new Error('HTTP 404'));
    await expect(preorderSyncPageDomain.refetchOne!(ctx, { shopId: 'DOLLSKILL', kind: 'metafield' })).rejects.toThrow('HTTP 404');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it.each([{ shopId: '' }, { shopId: 'DOLLSKILL', kind: 'unknown' }, { shopId: 'DOLLSKILL', pageIndex: -1 }])('rejects invalid scopes before requesting a page: %j', async pk => {
    expect(await preorderSyncPageDomain.refetchOne!(ctx, pk)).toBe(0);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
