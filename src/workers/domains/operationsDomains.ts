import { defineSyncDomain } from '@common/db/sync/defineSyncDomain';
import { workerGet } from '@common/core/workerRemoteApi';
import { preorderDb } from '@/db/preorderDb';

const JOBS = ['publish_PendingShopifyLocationInventoryAdjustments', 'publish_PendingShopifyPreorderMetafields', 'recover_StaleShopifyPreorderMetafieldMessages', 'expire_FutureInventoryItems', 'send_AllProducedSystemMessages_frequent', 'consume_AllReceivedSystemMessages_frequent'];
const FEEDS = ['ShopifyShopLocationInventoryEventFeed', 'ShopifyPreorderMetafieldFeed', 'FutureInventoryPromiseDateFeed'];
export const preorderSetupDomain = defineSyncDomain({
  name: 'preorderSetup', table: 'preorderSetup', label: 'Pre-order setup', syncClass: 'C',
  async sync() { return 0; },
  async refetchOne(ctx, pk) {
    const shopId = String(pk?.shopId || ''); const productStoreId = String(pk?.productStoreId || '');
    if (!shopId || !productStoreId) return 0;
    const errors: string[] = [];
    const read = async (url: string, params = {}): Promise<any> => {
      try { return await workerGet(ctx, url, params); }
      catch { errors.push(url); return null; }
    };
    const [channels, settings, purposes, jobs, feeds] = await Promise.all([
      read('sob/shopify/inventoryChannels', { shopId, pageSize: 250 }),
      read('sob/shopify/shopSetting', { shopId, settingTypeEnumId: ['SHPFY_PRORD_MF_NS', 'SHPFY_PRORD_MF_KEY'], settingTypeEnumId_op: 'in', pageSize: 20 }),
      read('preorder/storeFacilityPurposes', { productStoreId, pageSize: 100 }),
      Promise.all(JOBS.map(async jobName => {
        const detail = await read(`admin/serviceJobs/${jobName}`);
        const runs = await read(`admin/serviceJobs/${jobName}/runs`, { pageSize: 1, orderByField: '-startTime' });
        const job = detail?.jobDetail;
        return { jobName, description: job?.description, paused: job?.paused, cronDescription: job?.cronDescription, latestRun: runs?.[0] ? { startTime: runs[0].startTime, endTime: runs[0].endTime, hasError: runs[0].hasError } : null, available: !!job };
      })),
      Promise.all(FEEDS.map(async dataFeedId => { const feed = await read(`admin/dataFeeds/${dataFeedId}`); return { dataFeedId, dataFeedTypeEnumId: feed?.dataFeedTypeEnumId, available: !!feed }; })),
    ]);
    return preorderDb.entity(preorderDb.tables.preorderSetup).upsertMany([{ shopId, productStoreId, channels: channels || [], settings: settings || [], purposes: purposes || [], jobs, feeds, errors, fetchedAt: Date.now() }]);
  },
});
const paths: Record<string, string> = { quantity: 'locationInventoryAdjustmentDetails', metafield: 'preorderMetafieldDetails', published: 'preorderMetafields', activation: 'productFacilityActivations' };
export const preorderSyncPageDomain = defineSyncDomain({
  name: 'preorderSyncPage', table: 'preorderSyncPages', label: 'Pre-order sync events', syncClass: 'C',
  async sync() { return 0; },
  async refetchOne(ctx, pk) {
    const shopId = String(pk?.shopId || ''); const kind = String(pk?.kind || 'quantity'); const pageIndex = Number(pk?.pageIndex || 0);
    if (!shopId || !paths[kind] || !Number.isInteger(pageIndex) || pageIndex < 0) return 0;
    const params: Record<string, any> = { shopId, pageIndex, pageSize: 50 };
    if (kind === 'quantity') { params.eventTypeId = 'SIE_FUTURE_%'; params.eventTypeId_op = 'like'; params.orderByField = '-createdDate,eventTypeId,eventReferenceId'; }
    if (kind === 'metafield') { params.metafieldPurposeEnumId = 'SMFP_PREORDER_BATCHES'; params.orderByField = '-createdDate,eventTypeId,eventReferenceId,shopifyOwnerId'; }
    if (kind === 'published') { params.metafieldPurposeEnumId = 'SMFP_PREORDER_BATCHES'; params.orderByField = 'shopifyOwnerId'; }
    if (kind === 'activation') params.orderByField = 'productId,facilityId';
    const rows = await workerGet(ctx, `sob/shopify/${paths[kind]}`, params);
    return preorderDb.entity(preorderDb.tables.preorderSyncPages).upsertMany([{ pageKey: `${shopId}:${kind}:${pageIndex}`, shopId, kind, rows: Array.isArray(rows) ? rows : [], pageIndex, hasMore: Array.isArray(rows) && rows.length === 50, fetchedAt: Date.now() }]);
  },
});
