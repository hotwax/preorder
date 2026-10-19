import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDomainWiring, checkSyncLifecycle } from "@common/db/testing/appDbWiring";
import { preorderDb } from "@/db/preorderDb";
import { appSyncDomains } from "@/workers/appSyncDomains";

const source = (path: string) => readFileSync(resolve(process.cwd(), "src", path), "utf8");

describe("Pre-order app database wiring", () => {
  it("fills every table from a registered domain, and every domain's table exists", () => {
    expect(checkDomainWiring({
      tables: Object.keys(preorderDb.tables),
      domains: appSyncDomains,
    })).toEqual([]);
  });

  it("starts the sync on authentication, restarts it on login and stops it on logout", () => {
    expect(checkSyncLifecycle({ appVue: source("App.vue"), userStore: source("store/user.ts") })).toEqual([]);
  });
});
