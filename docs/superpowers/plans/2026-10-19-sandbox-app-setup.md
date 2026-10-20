# Sandbox setup through the pre-order app

## Execution contract

Every business/configuration mutation is performed through the localhost pre-order UI. REST reads may independently verify results. Missing UI is implemented before using its action. Collect API gaps before implementing the backend batch; verify locally before pushing the relevant backend feature branches and then verify against hc-sandbox-maarg.

## Observed baseline

- App: localhost:8110. Initial sandbox discovery used normal login; local verification now uses the in-app Browser and the isolated OMS on localhost:8081.
- Sandbox: oms preorder-as-inventory ddb29179cb; preorder-maarg 5a1ebbaa9b; shopify-connector a3337fd10f.
- Target shop 10000 belongs to Demo Store (STORE). It already has IC_PREORDER_10000, Shopify location 93591666837, supply group HC_PREORDER_SUPPLY. Preserve physical channel IC_ONLINE_10000.
- Initial discovery found no active future inventory or open preorders in STORE. A subsequent refresh found another setup batch; Aditya explicitly authorized continuing. Metafield publishing is enabled and scoped to shop 10000. Namespace/key settings were absent, so the effective default is hotwax.preorder_batches (JSON). Re-read before remote writes.
- Local OMS runs from maarg-oms/moqui-framework on :8080. Existing framework edits and local OMS merge must be preserved.

## Gap inventory and implementation boundary

| Workflow | Existing capability | Missing work |
|---|---|---|
| Purchase order, approval, future inventory, arrival changes | App and APIs exist | Exercise existing UI and fix observed failures |
| Inbound shipment creation from PO | Read-only app; native incoming-shipment service lacks a PO UI contract | App form and validated create endpoint, PO line links and optional FI transfer |
| Receive inbound supply | Native receipt service exists | App action and validated receipt endpoint; preserve ledger-based issuance |
| Shopify pre-order channel and supply facilities | Existing inventoryChannels, groupFacilities and product-store facility APIs; purpose mapping lacked a REST read | Purpose read endpoint; setup view with editable channel, active group members and parking-purpose reads |
| Metafield namespace/key | Existing sob/shopify/shopSetting read/write API; native defaults | Setup form displaying effective values |
| Future inventory quantity sync events | Existing locationInventoryAdjustmentDetails API | Store/shop-scoped event view with delivery status and reasons |
| Metafield sync events and published mappings | Native ledger and state entities, no REST resources | Read endpoints and joined delivery view, app monitoring |
| Publishing jobs and feeds | Existing admin/serviceJobs, runs and dataFeeds APIs | App status and latest-run display for required pre-order jobs and feeds |
| Existing product/location activation | Existing readiness API and native activation job | Show readiness for selected existing products; execute only required setup through app |

## Verification

1. Record exact changed repos, branches and baseline before writes.
2. Implement missing endpoint batch with validation, authorization, bounded reads and real local service tests.
3. Add UI using AccxUI layering, permissions, local database sync for new reference/monitoring data; run build and existing unit suite.
4. Use localhost app against local OMS: PO -> FI -> inbound split -> receipt; inspect persisted totals, links and sync rows through UI and independent reads.
5. Push only verified changes to the relevant feature branches. Confirm deployed component SHAs before remote verification.
6. Use localhost app against sandbox for limited existing-catalog setup and publish verification. Record PO, shipment, FI, event/message and Shopify identifiers. No customer email sends.

## Remaining discovery

Confirm supply group membership, store parking purposes, product/location activation, exact job/feed health and current storefront metafield contract. A successful send is distinct from storefront rendering or order-routing acceptance.

## Local UI evidence (19 October 2026)

- Browser: Codex in-app Browser, localhost:8110 -> localhost:8081, HC Sandbox Store.
- Created approved PO M119232, external ID LOCAL-SETUP-20261019, using existing product M172288: four units at Central Warehouse, arrival 30 October.
- Created shipment M119691, reference LOCAL-SHIP-20261019-A, for two units. Received through the app; receipt M119181 records two accepted and zero rejected.
- Reopened PO: four ordered, two received, two still to arrive, two ATP on the parent batch. Shipment retry with the same reference/quantities/date returned M119691, still one receipt. Form rejects three units when only two remain.
- Parent future inventory M167371; shipment batch M167422. Quantity event view shows supply +4 (M223981), paired transfer -2/+2 (M224033/M224032), and receipt -2 (M224034). Native delivery statuses visible in app.
- Metafield event and published-state views work against the local database. New events are pending because the existing local metafield publisher is paused; that policy is preserved.
- Saved the existing hotwax.preorder_batches mapping through the setup UI and read it back. Setup shows active facility members, both parking purposes, job status/latest run and all three feeds.
- Fixed two errors found by the real create flow: unsupported iteration-index attribute and missing OrderShipment.shipGroupSeqId. Both failed attempts rolled back.
- Screenshot: output/preorder-setup/local-receipt.png (local evidence, not committed).
- Final app build and staged Ionic checks passed; app unit suite: 32 passed. Backend contract suite: five passed, including independent database readback of the UI-created fixture.
- Existing full typecheck limitation: two App.vue event-emitter type errors outside these changes; TS6 also requires ignoreDeprecations=6.0 for the current config.

## Sandbox deployment provenance

Latest observed HC build: Jenkins new-hwc-k8s-update-onpremise-maarg-uat/458, successful, recipe a4019682fd43da9ccc67f02489a15c28559474e0. Its HC-only entrypoint and unchanged RC2 component pins must remain. Update only preorder-maarg and shopify-connector pins after local verification; preserve OMS ddb29179cbe39a1f8683346bde9b0a975c0c32bc.

## Sandbox acceptance, 2026-10-19

- HC deployment 460 succeeded with preorder-maarg b394fc0273 and shopify-connector b819bf6bd6. Live manifest confirmed only those two components changed; OMS remains ddb29179cb. Inventory channels and metafield settings were preserved.
- Localhost app created approved PO M100816 / HC-APP-SETUP-20261019 for existing product M100001 (SKU 100), four units at Central_Warehouse. It created and received shipment M100561 / HC-APP-SHIP-20261019-A, with receipt M100102 for two units. Independent REST readback confirms two remaining units, one receipt, parent FI M100051 at two units, and received child FI M100052 at zero.
- Added facility IDs to destination labels because the sandbox has duplicate facility names. Added scoped publishing-job discovery and administrator pause/enable controls that preserve schedule and parameters. Restored the five previously enabled pre-order jobs that were observed paused after deployment. The authorization loader log confirms it loaded only 35 authorization records; the source of the separate job-state changes is not established.
- Found future-dated store parking mappings. Added administrator-only parking activation, validating purpose/facility type, locking the store, retaining historical rows, superseding future rows, and making repeated activation idempotent. Seven real local database contract tests pass, including invalid facility rejection and a rolled-back activation fixture. Endpoint commit 0286f0b and test commit 1cdb130 are pushed; final HC deployment uses recipe 36cffbf.
- Final deployment 461 succeeded with recipe 36cffbf. Live readback confirms preorder-maarg 0286f0b97f and shopify-connector b819bf6bd6; OMS and every other component remain unchanged. Both parking mappings were activated through the localhost app; exactly one active mapping exists for each purpose, and the superseded future rows retain history. The app explicitly saved hotwax.preorder_batches.
- The job reset was reproduced by the second rollout and traced to the deployed maarg-util after-startup hook: feature branches reload UpcomingRelease data every startup, including paused defaults. Added native schedule-copy UI and used it to create five dedicated HC schedules. Independent reads verify each copy is enabled and retains its parent's service, cron, and parameters; the five defaults stay paused. Existing HC location publisher and scoped sender/consumer are unchanged. The new minute-based metafield publisher has completed successfully. No further restart or long-duration soak of the new schedules is claimed.
- All business setup writes were performed in the localhost app. Final Shopify read confirms available=3, with original FI M100000 at one unit and new parent FI M100051 at two, while received child M100052 is excluded from the actual hotwax.preorder_batches JSON. Quantity and metafield events are Sent in the app. Retrying the same shipment reference returns M100561 with exactly one receipt.
- Build, Ionic UI check, 32 unit tests and seven real-database contract tests pass. Full vue-tsc still has only the two pre-existing App.vue event-emitter errors at lines 55/71. Customer checkout, outbound customer email, and soak validation remain outside this acceptance. App changes are submitted for review in hotwax/preorder PR #393; they are not merged into main.
