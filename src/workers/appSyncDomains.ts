import type { SyncDomain } from "@common/db/types";
import { commonDomains } from "@common/db/seed/seedDomains";

/** Every domain the app registers: the framework seed domains, one per common table. */
export const appSyncDomains: SyncDomain[] = Object.values(commonDomains);
