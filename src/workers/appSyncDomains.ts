import type { SyncDomain } from "@common/db/types";
import { commonDomains } from "@common/db/seed/seedDomains";
import { preorderDb } from "@/db/preorderDb";

/** Seed tables the app fills with a domain of its own instead of the framework's: none yet. */
const OVERRIDDEN_SEED_TABLES = new Set<string>([]);

/**
 * Every domain the app registers: the framework seed domains for the seed tables its database has.
 * Settings builds its data status card from this list too, so the card and the worker agree.
 */
export const appSyncDomains: SyncDomain[] = Object.values(commonDomains).filter((domain) =>
  domain.table && preorderDb.seedTables.has(domain.table) && !OVERRIDDEN_SEED_TABLES.has(domain.table));
