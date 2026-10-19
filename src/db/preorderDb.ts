/**
 * The Pre-order app database: one IndexedDB database per OMS instance, filled by the sync worker.
 *
 * Deep imports only, never the `@common/db` barrel: the sync worker imports this file, and the
 * barrel re-exports modules that import `vue`.
 */

import { defineAppDb } from "@common/db/schema/defineAppDb";
import { commonSchema } from "@common/db/seed/seedSchema";

/**
 * The seed tables the app reads: labels (statuses, enums, facilities and their types, shipment
 * methods), the product store picker and each store's facilities, and the `products` master. The app has no tables of its own:
 * purchase orders, shipments, future inventory and pre-orders are searched live, so they stay in the
 * stores that asked for them.
 */
const PREORDER_SEED_TABLES = [
  "productStores",
  "productStoreFacilities",
  "statuses",
  "enums",
  "facilities",
  "facilityTypes",
  "shipmentMethodTypes",
  "products",
] as const;

export const preorderDb = defineAppDb({
  suffix: "PreorderDB",
  // v2: only the seed tables the app reads, instead of the whole common schema
  // v3: productStoreFacilities, for the facility filters and destinations of the current store
  version: 3,
  schema: commonSchema.pick([...PREORDER_SEED_TABLES]),
});
preorderDb.setOmsInstanceResolver(() => "default");
