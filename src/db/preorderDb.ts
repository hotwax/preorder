/**
 * The Pre-order app database: one IndexedDB database per OMS instance, filled by the sync worker.
 *
 * Deep imports only, never the `@common/db` barrel: the sync worker imports this file, and the
 * barrel re-exports modules that import `vue`.
 */

import { defineAppDb } from "@common/db/schema/defineAppDb";
import { commonSchema } from "@common/db/seed/seedSchema";

/**
 * The app takes the whole common schema (seed reference data and the `products` master) and has
 * no tables of its own: purchase orders, shipments, future inventory and pre-orders are searched
 * live, so they stay in the stores that asked for them.
 */
export const preorderDb = defineAppDb({
  suffix: "PreorderDB",
  version: 1,
  schema: commonSchema,
});
preorderDb.setOmsInstanceResolver(() => "default");
