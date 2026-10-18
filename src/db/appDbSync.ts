/**
 * Main-thread entry point for the Pre-order background database sync.
 */

import { setupAppDbSync } from "@common/db/sync/setupAppDbSync";
import { createSyncService } from "@common/db/sync/syncService";
import { preorderDb } from "@/db/preorderDb";
import appSyncWorkerUrl from "../workers/appSync.worker.ts?worker&url";

export const {
  syncService,
  startAppDbSync,
  stopAppDbSync,
  refreshAfterMutation,
  resyncDomain,
  resyncReferenceData,
  bootstrapState,
} = setupAppDbSync({
  db: preorderDb,
  getWorkerUrl: () => new URL(appSyncWorkerUrl, import.meta.url),
  createSyncService,
});
