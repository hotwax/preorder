import { defineEntity } from '@common/db/model/defineEntity';
import { defineSchema } from '@common/db/model/defineSchema';
/** Bounded, on-demand operational snapshots; the worker is their sole writer. */
export const operationsSchema = defineSchema({
  preorderSetup: defineEntity({ primaryKey: 'shopId', fields: { shopId: 'text', productStoreId: 'text', channels: 'structured', settings: 'structured', purposes: 'structured', jobs: 'structured', feeds: 'structured', fetchedAt: 'date', errors: 'structured' } }),
  preorderSyncPages: defineEntity({ primaryKey: 'pageKey', fields: { pageKey: 'text', shopId: 'text', kind: 'text', rows: 'structured', pageIndex: 'count', hasMore: 'structured', fetchedAt: 'date' } }),
});
