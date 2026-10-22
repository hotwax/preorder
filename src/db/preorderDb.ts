/**
 * The Pre-order app database: one IndexedDB database per OMS instance, filled by the sync worker.
 *
 * Deep imports only, never the `@common/db` barrel: the sync worker imports this file, and the
 * barrel re-exports modules that import `vue`.
 */

import { defineAppDb } from "@common/db/model/defineAppDb";
import { mergeSchemas } from '@common/db/model/defineSchema';
import { operationsSchema } from './operationsSchema';
import { commonSchema } from "@common/db/schema/commonSchema";

/**
 * The seed tables the app reads: labels (statuses, enums, facilities and their types, shipment
 * methods), the product store picker, and the `products` master. Setup and monitoring snapshots
 * are fetched on demand by worker domains; existing transactional searches remain live.
 */
const PREORDER_SEED_TABLES = [
  "productStores",
  "statuses",
  "enums",
  "facilities",
  "facilityTypes",
  "shipmentMethodTypes",
  "products",
  "shopifyShops",
  "shopifyShopLocations",
  "facilityGroups",
  "groupFacilities",
] as const;

export const preorderDb = defineAppDb({
  suffix: "PreorderDB",
  // v3: setup/monitoring snapshots and their Shopify/facility reference tables
  version: 3,
  schema: mergeSchemas(commonSchema.pick([...PREORDER_SEED_TABLES]), operationsSchema),
});
preorderDb.setOmsInstanceResolver(() => "default");
