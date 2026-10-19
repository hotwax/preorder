/**
 * Pre-order Web Worker entry. Deep imports only: the barrel pulls in `vue`.
 */
import { exposeWorkerHarness } from "@common/db/sync/pollingWorkerHarness";
import { registerDomains } from "@common/db/sync/syncRegistry";
import { preorderDb } from "@/db/preorderDb";
import { appSyncDomains } from "./appSyncDomains";

registerDomains(appSyncDomains);

exposeWorkerHarness((omsInstance) => {
  preorderDb.setOmsInstanceResolver(() => omsInstance);
  return preorderDb.get(omsInstance);
});
