# Pre-order main merge plan

## Current scope: frontend only

Aditya will handle the backend separately. This section supersedes the backend execution and acceptance requirements in the original plan below. Backend readiness is not a gate for completing this frontend work.

### Confirmed frontend work

- [ ] Review and merge existing [AccxUI #232](https://github.com/hotwax/accxui/pull/232), which adds only the 85-line `apps/preorder` lockfile importer. Its Verify build run is green. Preserve the unrelated large local lockfile modification; do not use it as this fix.
- [ ] Restore the app's deleted `.firebaserc` with verified pre-order Firebase project aliases and dev/UAT hosting targets. The shared merge workflow calls `firebase use dev`; the old file had only default/production aliases, so blindly restoring it is insufficient. Do not copy another app's hosting sites.
- [ ] Correct the release workflow's `accxuiVersion: v1.10.0`: that tag lacks `useProductMaster` and `common/db/testing/appDbWiring`, both imported by the app. For a reproducible release, publish a compatible AccxUI version containing current framework changes and #232, then pin that existing tag. Tag publication is a separately authorized action. Dev/PR workflows already use AccxUI main.
- [ ] Make full app unit tests and typechecking required in the app's PR validation. The current shared workflow calls only the app build; that build runs eslint, one wiring spec and Vite, but omits the remaining tests and vue-tsc. Prefer app-scoped changes; avoid changing every app's pipeline just for pre-order.
- [ ] Re-run pre-order CI after #232 lands; review and validate the exact frontend head against AccxUI main, using example environment configuration, without depending on the local dev-discovery feature branch.
- [ ] Obtain required reviews, confirm automatic dev hosting destination, and merge [preorder #392](https://github.com/hotwax/preorder/pull/392). Verify resulting build/deployment outcomes; backend behavior is outside this scope.
- [ ] After the rewrite is on main, add pre-order to AccxUI's framework build matrix so later shared changes also build this app. Do not add it prematurely while app main still contains the legacy Vue CLI app.

Current investigation did not publish, merge or deploy anything. Firebase destinations still need verification. No shared runtime source change has been established as necessary for this frontend merge.

---

## Original broader plan, retained for reference

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. This document is a plan; execution, shared-instance upgrades, merges and their deployment effects are separate actions.

**Goal:** Merge the AccxUI pre-order app and its backend dependencies into main after proving the integrated flow against a real non-production backend, then verify the merged result.

**Architecture:** The AccxUI app depends on preorder-maarg REST resources, the OMS future inventory ledger, Shopify publishing and legacy-feed retirement. Integrate and validate a fixed set of component commits before coordinating their merges; the frontend lands last.

**Tech stack:** Ionic Vue, AccxUI, pnpm/Vite/Vitest, Moqui, MySQL, Solr, Spock, Shopify.

**Spec:** [App specification](../../SPEC.md), plus the implementation and test plans under `docs/pre-order/` on preorder-maarg `preorder-as-inventory`. Reconcile these against the actual consolidated code before execution: the app spec still describes some superseded endpoints and branches.

## Global constraints

- Use real backend services and persisted readback for acceptance. Mocked Shopify spec results are regression evidence only.
- Use a non-production instance and an existing sandbox catalog; do not create Shopify products or change live customer data.
- Preserve existing edits, branches, worktrees, processes and configuration. The AccxUI wrapper already has a modified `pnpm-lock.yaml`; inspect and attribute it before any update.
- Record commit IDs, framework versions, database/migration state, store, facilities, Shopify shop and fixture IDs for every acceptance run.
- Never expose gateway credentials. Email delivery tests require a controlled internal recipient/sink and explicit sending authorization; otherwise record delivery as unverified.
- Before a shared-instance upgrade, use the canonical hotwax-instance-upgrade skill. Before merging the frontend, inspect the Firebase deployment destination and account for the automatic deployment.

## Verified starting point: 19 October 2026

- Local active app: `accxui/apps/preorder`, clean branch `feat/accxui-rewrite`, commit `ac84912f72a9dcd237d741fb5f9835e9aacfc00e`, matching [preorder #392](https://github.com/hotwax/preorder/pull/392).
- Vite process maps to that checkout on localhost port 8110. Backend identity and authenticated UI behavior were not checked during planning.
- PR #392 is open, non-draft and reported mergeable. Deepak is requested as reviewer; no submitted reviews or inline threads were returned.
- [Verify build run](https://github.com/hotwax/preorder/actions/runs/39195858840) failed on Node 20 and 22 during dependency installation. The Node 20 log reports `ERR_PNPM_OUTDATED_LOCKFILE` for the workspace lockfile versus `apps/preorder/package.json`. Build steps were skipped.
- Main pushes trigger `.github/workflows/firebase-hosting-merge.yml`, calling the shared AccxUI Firebase workflow.
- Consolidated backend PR descriptions report 160/161 specs passing, with a paused-job assertion affected by the live test configuration. This has not been reproduced in this investigation.
- [USL #53](https://github.com/hotwax/hotwax-ofbiz-oms-usl/pull/53) remains draft and says not to merge; its description still uses the superseded stacked plan.

## Review focus

1. Server permissions: the spec reports login adding users to ADMIN and browser-only action restrictions; demonstrate server rejection for a restricted user.
2. Store isolation: email logs, dashboard, FI facilities and switching stores must not leak another store's data.
3. Mutation persistence: reallocation, quantity/date changes and cancellation must survive reload and worker resync without duplicate ledger entries.
4. Async completion: a queued import, message or email is not downstream delivery. Verify processing, failures, retries and destination state separately.
5. Upgrade compatibility: the ledger move, data backfill, retired feeds, search indexes and job defaults must work together on an existing database.

## Task 1: Fix the release baseline

- [ ] Inventory exact heads, diffs, CI and review status for every PR listed in Task 5; inspect local work before syncing branches.
- [ ] Inspect the existing wrapper lockfile change, compare the clean AccxUI main dependency graph and reproduce CI's frozen install. Put the scoped lockfile fix in its owning AccxUI repo, preserving unrelated changes; retain frozen-lockfile validation.
- [ ] Run app `pnpm test:unit`, `pnpm build`, `pnpm lint`, and the supported workspace type/UI checks. Run shared framework tests only if common code changes.
- [ ] Inspect `.env.example`, Vite config and deployment env generation: preflight found local legacy `VUE_APP_*` names while the new example uses `VITE_*`. Establish the actual runtime configuration without printing values.
- [ ] Reconcile `docs/SPEC.md` with current Solr PO listing and email-settings API behavior. Identify the exact supporting AccxUI commit; local success on an unmerged framework branch is insufficient.

**Gate:** Reproducible clean install and passing required CI against the intended framework and app revisions.

## Task 2: Establish the real integration environment

- [ ] First inspect the existing localhost app/backend setup referenced by the PR, including the real database, Solr and hc-sandbox Shopify binding. Prefer reuse if its provenance and state are suitable.
- [ ] Record the selected non-production target and all component commits. If using demo-oms/demo-maarg instead, verify its current components and data rather than assuming the older FII setup supports this rewrite.
- [ ] Prepare a clean integration build combining OMS email queue and inventory changes with the paired component branches, without modifying protected branches.
- [ ] Review and apply the documented upgrade to the selected authorized environment: schema/indexes, ledger backfill, authz, email catalog, feeds, retired jobs and PO reindex.
- [ ] Verify job defaults separately: FI drain/recovery ships paused; the order-email sender ships unpaused. Enable integration jobs only deliberately on the test target.
- [ ] Check backend readiness: product search documents, communication statuses, supplier lookup, pay-to company, facilities/channels and permission grants. Verify real API reads with the intended app user.

**Gate:** A reproducible component manifest, working authenticated reads and known test data on the real target.

## Task 3: Clear backend and upgrade blockers

- [ ] Re-run all eight `spock/preorderinventory` specs using the repository's documented runner on the integrated candidate.
- [ ] Re-run the paused-job assertion on clean shipped configuration; correct fixture/configuration isolation if needed. Require the full expected suite to pass, not an unexplained 160/161 waiver.
- [ ] Verify restricted users cannot call write APIs. Reproduce and fix confirmed authorization defects before broad access.
- [ ] Add focused regressions for confirmed gaps: email-log store isolation, successful reallocate through the REST wrapper, PO supplier/facility/arrival filtering, and upgrade job defaults.
- [ ] Validate jm-agency PO/inbound feed changes in an appropriate runtime: its PR explicitly says it was not part of the reported local spec execution.
- [ ] Review the two OMS upgrade diffs together; preserve both email and inventory changes in `UpgradeSteps.md`, `UpgradeSql.sql` and `UpgradeData.xml`.

**Gate:** Green backend suite, verified upgrade postconditions and no unresolved authorization/data-integrity blocker.

## Task 4: Run browser and downstream acceptance

- [ ] Use the existing authenticated Chrome session and verify listener-to-checkout identity. Test login/logout, refresh/deep links, local database hydration and store switching.
- [ ] Walk every app area: dashboard, pre-orders, FI, POs, inbound shipments, imports, communications, bulk updates and settings. Check list filters, pagination, detail totals, permissions and error states.
- [ ] With existing sandbox products, create/reuse an identified test PO, approve it, create FI and confirm quantities, dates and ledger rows through independent backend reads.
- [ ] Exercise sales-line reservation, reallocation and release; verify original/new batch balances and physical versus future reservations.
- [ ] Change a PO/batch date and follow the full chain: ledger/feed, SystemMessage, Data Manager import, order-line promise date and UI after reload.
- [ ] Test controlled line/batch cancellation, partial receipt, expiry/reactivation and retries. Re-read persisted balances and assert replay does not double reserve, release or publish.
- [ ] Verify real sandbox Shopify location inventory and variant metafield state after publishing and replay, including the ordering-shop exclusion where configured. Do not infer Shopify success from a loopback mock or a drained queue.
- [ ] Verify email settings save and field clear, disable behavior, queuing and retry/log behavior. If authorized for a controlled recipient, verify gateway acceptance and receipt; otherwise explicitly leave delivery open.
- [ ] Capture screenshots, fixture IDs, requests/results and final persisted state. Distinguish defects from accepted product limitations and environmental blockers; fix blockers and rerun affected scenarios.

**Gate:** Completed acceptance matrix with evidence for UI, persisted backend and downstream outcomes on the same candidate commits.

## Task 5: Review and merge in dependency order

- [ ] Obtain required reviews, clear CI and resolve actual review findings on the final tested commits.
- [ ] Reconcile USL #53's draft/do-not-merge status and stale stack references before treating the coordinated group as ready.
- [ ] Merge [OMS #1195: email queue](https://github.com/hotwax/oms/pull/1195) first.
- [ ] Bring the inventory PR onto the resulting main without rewriting published history; preserve both OMS upgrade sections and rerun affected checks.
- [ ] Land the coordinated ledger move and integrations: [OMS #1196](https://github.com/hotwax/oms/pull/1196), [Shopify connector #980](https://github.com/hotwax/mantle-shopify-connector/pull/980), [USL #53](https://github.com/hotwax/hotwax-ofbiz-oms-usl/pull/53), [JM #116](https://github.com/hotwax/jm-agency/pull/116), [preorder-maarg #75](https://github.com/hotwax/preorder-maarg/pull/75). Cross-repo merges are not atomic; publish/use only a compatible complete component set.
- [ ] Merge [oms-test #396](https://github.com/hotwax/oms-test/pull/396).
- [ ] Verify any required AccxUI support/lockfile change is on main, inspect the frontend deployment destination, then merge [preorder #392](https://github.com/hotwax/preorder/pull/392) last.

**Gate:** Required approvals and checks pass, tested heads match merge candidates, compatible backend set is available, and deployment effects are understood before merging.

## Task 6: Verify the merged result

- [ ] Record merge SHAs and resulting CI/deployment runs. A merge or hosting success alone does not establish runtime acceptance.
- [ ] Build/use the merged backend component set on the authorized non-production target; verify migration postconditions and app/backend version compatibility.
- [ ] Repeat the critical browser path: login, PO list/detail, FI list/detail, reservation change and promise-date cascade, with persisted readback and a sandbox Shopify check.
- [ ] Report merged PRs, tested app URL, backend/component manifest, passing checks, scenario evidence and any explicit limitations. Document test artifacts and any agreed cleanup without deleting unrelated work.

**Done:** The intended PR set is merged, required checks are green, and the app built from main passes the agreed real-backend acceptance path. Production rollout is a separate request.
