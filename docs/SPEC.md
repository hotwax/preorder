# Pre-order app: ground-up AccxUI rewrite

Status: build spec, 2026-10-18. Branch `feat/accxui-rewrite` (hotwax/preorder).

## 1. What this is

A new Ionic Vue app in the AccxUI workspace that manages pre-orders on the **pre-order as inventory**
model: purchase orders and inbound shipments create **future inventory (FI)** batches, sales lines
moved into pre-order or back-order parking reserve FI, and customers hear about promise date changes
through OMS emails sent to Klaviyo.

Nothing from the old Vue CLI app is reused except its browser icons (`public/img/icons`) and its
name: "Preorder Management", "HotWax Commerce Pre-order App", app id `co.hotwax.preorder`,
permission `PREORDER_APP_VIEW`.

The app is built the way Order Manager is built and follows its design language:

| Concern | How |
|---|---|
| Shell | `ion-split-pane` + menu, `DxpOmsInstanceFooter` (product store switcher), `FastTravel` (`current-app="preorder"`) |
| Auth | `@common` `Login`, `useAuth`, `initialiseConfig`, user store `postLogin` / `postLogout` |
| Local data | one app db (`PreorderDB`, the whole `commonSchema`): statuses, enums, facilities, product stores, products. Labels through `useSeedData()`, product names through `useProductMaster()` |
| Server data | Pinia stores (shared state) and composables (screen-owned requests). No `src/services` |
| Find pages | Order Manager's Find orders anatomy: `SearchFilterCard` + `UniformFilterLayout` of outlined selects and date filters, a results `ion-list-header` with "{shown} of {count}", a sort popover and a Select toggle, `list-item` rows, infinite scroll, `EmptyState` / `ErrorState`, and a bulk-action `ion-footer` toolbar in select mode |
| Dashboard | Order Manager's Funnel anatomy: store header, a global stat card (big number + progress metrics), a grid of `StatCard`s with drilldown lists and `Sparkline`s, then a ranked list with progress bars |

## 2. Routes

| Route | Page | Permission |
|---|---|---|
| `/` | redirect to `/dashboard` | |
| `/login` | `@common` Login | |
| `/dashboard` | Dashboard (default) | `APP_PREORDER_VIEW` |
| `/preorders` | Find pre-orders | `APP_PREORDER_VIEW` |
| `/preorders/:orderId` | Pre-order detail | `APP_PREORDER_VIEW` |
| `/future-inventory` | Find future inventory | `APP_PREORDER_VIEW` |
| `/future-inventory/:futureInventoryItemId` | FI batch detail (ledger, waiting lines) | `APP_PREORDER_VIEW` |
| `/purchase-orders` | Find purchase orders (scoped to the menu's store; "Include unassigned" also lists the POs that name no store) | `APP_PO_VIEW` |
| `/purchase-orders/create` | Create purchase order | `APP_PO_UPDATE` |
| `/purchase-orders/:orderId` | PO detail | `APP_PO_VIEW` |
| `/inbound-shipments` | Find inbound shipments | `APP_PO_VIEW` |
| `/inbound-shipments/:shipmentId` | Inbound shipment detail | `APP_PO_VIEW` |
| `/po-imports` | PO and FI import tracking, CSV upload | `APP_PO_VIEW` |
| `/communications` | Post-purchase communications | `APP_COMMS_VIEW` |
| `/bulk-updates` | Bulk updates: the promise date cascade's Data Manager imports | `APP_PREORDER_VIEW` |
| `/settings` | Settings | any |

Only `PREORDER_APP_VIEW` exists in seed data today. Update actions fall back to existing admin
permissions (`ORDERMGR_ADMIN`, `ORD_PURCH_ORDER_ADMIN`, `COMMON_ADMIN`) until `PREORDER_APP_UPDATE`
and `PREORDER_ADMIN` are seeded (`src/authorization/actions.ts`).

Menu: Dashboard, Pre-orders, Future inventory; **Supply**: Purchase orders, Inbound shipments,
PO imports; **Customers**: Communications, Bulk updates; Settings.

## 3. Pages

### 3.1 Dashboard (`/dashboard`)

Inspired by eBike's Tathya "E-Bike - Dashboard" (id 34: backorder units, YoY revenue, inventory
arriving soon, PO arriving soon, backdated POs, backorders with no promise date, on/off backorder)
and rebuilt on the FI model, in Funnel's layout. One request: `GET oms/preorderDashboard`.

1. **Global stat card**: open pre-order units (big number) with orders and lines, and progress
   metrics: share on pre-order vs back-order FI, lines waiting at parking, FI sell-through
   (reserved / supply on active batches).
2. **Stat cards** (each drills into a filtered find page):
   - *Arriving soon*: active batches with a promise date in the next 7 days, quantity and reserved.
   - *Past due*: active batches whose promise date has passed (backdated POs), plus expired or
     cancelled batches still holding reservations.
   - *Overcommitted*: active batches with ATP below 0.
   - *No promise date*: FI-backed lines with no `promisedDatetime`.
   - *Demand*: units reserved per day over the last 30 days, as a sparkline.
   - *Delay emails*: pre-order date change emails sent over the last 30 days, with a sparkline,
     and the promise date changes made in that period.
3. **Top products**: open reserved units by product, as a ranked list with progress bars.

### 3.2 Pre-orders (`/preorders`)

A pre-order is a sales order with at least one open pre-order line: a line that is not cancelled,
completed or rejected, holds an open future inventory reservation (the latest ledger row for the line
and batch is `FID_RESERVED`) and has no physical inventory reservation (`OrderItemShipGrpInvRes`).
A shipped line, a cancelled one and one with stock reserved are not pre-orders. Rows are orders.

The list reads current state only, never ledger history: it pages the order ids over
`PreorderOpenLine`, starting from the store's open orders (index `OH_STORE_STATUS_TYPE`), then builds
only that page.

Filters: every Find orders filter from Order Manager, plus parking.

| Filter | Values | Backed by |
|---|---|---|
| Search | order id, order name, external id, customer name, email | `OrderHeader`, `OrderRole BILL_TO_CUSTOMER` + `Person`, `OrderContactMech ORDER_EMAIL` |
| Status | multi: open order statuses (closed orders have no open line) | `OrderHeader.statusId` |
| At parking now | Any / At parking / Released | an open pre-order line's ship group at a facility of type `PRE_ORDER` or `BACKORDER` (released: at any other) |
| Allocation state | All, Awaiting brokering, Unfillable, Archived | an open pre-order line's ship group facility (Order Manager's vocabulary). No "Allocated": a line with stock reserved is not a pre-order |
| FI type | All, Pre-order, Back-order | `FutureInventoryItem.futureInventoryItemTypeId` |
| Sales channel | enums `ORDER_SALES_CHANNEL` | `OrderHeader.salesChannelEnumId` |
| Shipping method | shipment methods | `OrderItemShipGroup.shipmentMethodTypeId` |
| Order date from / through | dates | `OrderHeader.orderDate` |
| Product store | the menu footer's store | `OrderHeader.productStoreId` |

Sort: newest first (default) or oldest first.

Each row shows:
- the customer, with order name, id and status;
- pre-order lines, and the facilities where they wait (a line with an open reservation, at parking or at a warehouse);
- the FI type and the channel;
- the order date;
- the **current promise date**: the earliest and latest `OrderItem.promisedDatetime` across the
  order's FI lines, read from the database (not Solr, which can lag the date cascade).

Bulk actions (select mode):
- **Release to brokering**: moves lines with an open reservation at pre-order or back-order parking to `_NA_` with
  `POST oms/orders/{orderId}/moveItemToParking`, so routing can broker them.
- **Cancel pre-order items**: `POST oms/orders/{orderId}/items/cancel` on the lines with an open
  reservation (a committed or released line stays); the cancel SECA releases their reservations.
- **Export CSV**.

Detail (`/preorders/:orderId`) shows each line with:
- its product, status and facility;
- its batch (FI id, type, batch promise date, PO);
- its own promise date and auto-cancel date;
- a **Reservation history** section: each line's ledger rows (date, reason, batch, quantity).

Line action: **Move to another batch**. A line waiting at parking can move to any active batch of its
product and type; a line waiting at a facility only to a batch at that facility or one at the store's
parking (location-less).

### 3.3 Future inventory (`/future-inventory`)

Rows are FI batches.

Filters:
- search: FI id, product, PO, external id, shipment external id;
- status (multi);
- FI type;
- facility;
- has reservations;
- overcommitted;
- promise date from / through.

Sort: soonest promise date (default), latest promise date, newest created.

Each row shows:
- the product;
- the batch's PO and facility;
- the promise date and how far away it is;
- on hand, ATP and reserved;
- the status.

Bulk actions:
- **Change promise date**: writes one `FID_ADJUSTED` row per batch carrying the new promise date.
  The date watch expires or reactivates the batch, and the cascade updates the waiting lines (and
  emails their customers).
- **Cancel batch**: writes an `FID_ADJUSTED` row taking on-hand to 0, which cancels the batch.
  Lines stay reserved and appear as exceptions.
- **Export CSV**.

Detail (`/future-inventory/:id`) has:
- summary cards;
- the ledger (FutureInventoryItemDetail rows: reason, on-hand diff, ATP diff, publish diff, order
  line, promise date, user, date);
- the waiting FI-backed lines;
- actions: adjust quantity, change promise date.

### 3.4 Purchase orders (`/purchase-orders`)

The list reads Solr, not the database. Purchase orders are indexed one doc per line (`docType:ORDER`,
`orderTypeId:PURCHASE_ORDER`), and the page groups them by `orderId`:
- the first query matches, sorts, pages and counts the orders (`group.ngroups`);
- the second reads every line of the page's orders, so a line filter picks orders without trimming their totals;
- `oms/futureInventoryItems/purchaseOrderCounts` adds each order's batch count, which Solr doesn't carry.

oms indexes a purchase order when it is stored or its status changes, and a line when it is updated or added.
The supplier on the doc (`customerPartyId`) is the `BILL_FROM_VENDOR`, else the `SHIP_FROM_VENDOR`. Solr shows a
saved change after its next commit, so a bulk action shows its change on the rows at once and the list searches
again a moment later.

Filters:
- search: part of the PO id, name or external id, case-insensitive;
- status (multi), open (created and approved) by default;
- supplier;
- destination facility: a line's facility;
- arrival from / through: a line that is not cancelled arrives in the range;
- order date from / through.

Sort: soonest arrival (orders with no arrival date last), newest, oldest.

Each row shows:
- the PO name and id;
- the supplier;
- the destination facility;
- lines and units;
- the earliest arrival date;
- the status.

Bulk actions:
- **Approve** (`ORDER_APPROVED`);
- **Cancel** (`ORDER_CANCELLED`);
- **Complete** (`ORDER_COMPLETED`);
- **Change arrival date**: sets the date on each open line and writes an `OrderItemChange`, so the
  PO's FI batch takes the new date;
- **Sell as pre-order**: creates a future inventory batch for each open line without one;
- **Export CSV**.

Detail:
- header;
- lines with ordered, received, open and arrival quantities, plus each line's FI batch;
- inbound shipments against the PO;
- receipts.

Create (`/purchase-orders/create`):
- supplier, destination facility, product store, currency and external id;
- lines: product search (Solr, the store's sellable variants and simple products), quantity, unit
  cost and arrival date;
- an optional "Sell as pre-order" toggle with an FI type, which creates a batch per line.

### 3.5 Inbound shipments (`/inbound-shipments`)

These are `INCOMING_SHIPMENT` / `PURCHASE_SHIPMENT` shipments against POs. The page is view only.

Filters:
- search: shipment id, external id, PO;
- status;
- destination facility;
- estimated arrival from / through.

Each row shows:
- the shipment and its external id;
- the PO;
- the destination;
- items, units shipped and units received;
- the estimated arrival;
- the status.

The detail page shows items, each with its received quantity, plus the receipts.

### 3.6 PO imports (`/po-imports`)

These are Data Manager logs for the configs `IMPORT_PO` (CSV), `IMP_NS_PURCHASE_ORDER` and
`IMP_NS_INB_SHIPMENT` (NetSuite), and `SYNC_PREORDER` (FI CSV).

Filters: import type, status and created date.

Each row shows:
- the file name;
- the config;
- the status, with record and failed counts;
- the created, started and finished times;
- downloads for the imported file and the error file.

Upload: pick a type (PO CSV or FI CSV), download its template, upload. This calls
`admin/uploadDataManagerFile`.

### 3.7 Communications (`/communications`)

Pre-order notification emails go from OMS to Klaviyo through Unigate. A ProductStoreEmailSetting
row (store × email type) holds an email's subject, template, gateway remote and auth.

There is no DataFeed behind these emails, so the "feed" toggle is a switch on that setting:

- Each pre-order email type is a card showing:
  - whether the setting exists;
  - whether it is **enabled** (the new `ProductStoreEmailSetting.disabled` flag, honoured by
    `send#EmailOnOrderEvents` for every email);
  - whether a gateway is set, so the email can reach Klaviyo;
  - its sends over the last 7 and 30 days.
- The only pre-order email wired to an OMS event today is `PREORDER_DATE_CHANGE` (pre-order delay /
  date change, SECA on `ITM_DLVRYDATE_CHNGD`). Types with no trigger are listed as not wired.
- Recent communication events show:
  - the email type;
  - the status (sent / bounced);
  - the recipient;
  - the order;
  - the subject;
  - the time.
- Events can be filtered by email type, status and date range.
- To make "how many delay emails went out" a count, `send#EmailOnOrderEvents` now stores the email
  type as the event's `reasonEnumId` (an Enumeration FK) when the caller gives none. Events sent
  before this change have none and count as "Unknown type".

### 3.8 Bulk updates (`/bulk-updates`)

- A batch promise date change reaches its waiting order lines in bulk, not in the transaction that
  moved it: a data feed queues a `FutureInventoryPromiseDateChange` system message, consuming it
  writes the batch's FI-backed lines to an `IMP_FI_PROMISE_DATE` Data Manager file, and Data
  Manager updates each line in its own transaction and sends its delay email (§4.3).
- The page lists those imports, newest first: the batch (linking to it), status, lines and failed
  lines, when it was queued and finished, and the lines and error files to download. A header shows
  how many date changes are received and not yet queued.
- Filters: status, created date range, exact log id.
- One transaction per order (and one email per order) waits on Data Manager running a `groupBy`
  group in one transaction: hotwax/hotwax-maarg-util#346.

### 3.9 Settings

Settings has these cards:
- the user (with logout and Launchpad);
- the OMS instance;
- the product store;
- the app version;
- the timezone;
- the language;
- the local database status.

## 4. Backend contract

All paths are relative to `/rest/s1/`. The app calls `oms/*` and `poorti/*` (and the shared `admin/*`); the
retired `preorder/*` resources are not used. Every path below is one a request in `src/` sends.

### 4.1 Pre-orders and future inventory (`oms`)

| Method + path | Use |
|---|---|
| GET `oms/preorders` | the Pre-orders list: `{orders, ordersCount}`, each order with its FI lines, `openLineCount`, `parkedLineCount`, `readyToReleaseLineCount` and `waitingFacilityIds` |
| GET `oms/preorders/{orderId}` | the detail: the order and its lines, each with its facility, `atParking`, `reservationOpen`, `committed`, `readyToRelease` and its `reservations` ledger |
| POST `oms/orders/{orderId}/moveItemToParking` | Release to brokering (`toFacilityId: _NA_`) |
| POST `oms/orders/{orderId}/items/cancel` | Cancel pre-order items (only lines with an open reservation) |
| POST `oms/orders/{orderId}/items/{orderItemSeqId}/reallocate` | Move a line's reservation to another batch; a line not at parking moves only to a batch at its own facility or a location-less one |
| GET `oms/preorderDashboard` | all dashboard figures for a store, with `demandFacilityCount` |
| GET `oms/futureInventoryItems` | the FI list, and the active batches a line can move to; `{futureInventoryItems, futureInventoryItemsCount}` |
| GET `oms/futureInventoryItems/{id}` | one batch, with its product and PO |
| PUT `oms/futureInventoryItems/{id}` | adjust quantity and/or change the promise date |
| POST `oms/futureInventoryItems/{id}/cancel` | cancel a batch |
| GET `oms/futureInventoryItems/{id}/details` | the ledger, rows with `changedByUserName` |
| GET `oms/futureInventoryItems/{id}/lines` | the lines waiting on the batch |
| GET `oms/futureInventoryItems/purchaseOrderCounts` | each listed PO's batch count (Solr does not carry it) |

### 4.2 Purchase orders and inbound shipments (`oms`, `poorti`)

| Method + path | Use |
|---|---|
| Solr (`admin/search/query` on Moqui, `admin/runSolrQuery` otherwise) | the PO list (line docs grouped by order, scoped to the menu's store, optionally with the orders that name none) and the product search in Create PO |
| GET `oms/purchaseOrders/{orderId}` | PO detail with items |
| POST `oms/purchaseOrders` | create a PO |
| POST `oms/purchaseOrders/{orderId}/status` | approve, cancel and complete |
| PUT `oms/purchaseOrders/{orderId}/items/{orderItemSeqId}` | change a line's arrival date |
| POST `oms/purchaseOrders/{orderId}/futureInventory` | Sell as pre-order: a batch per open line without one |
| GET `oms/purchaseOrders/{orderId}/receipts` | PO receipts |
| GET `oms/parties/roles/SUPPLIER` | the suppliers, paged until the last page |
| GET `poorti/purchaseShipments` | the Inbound shipments list, and a PO's shipments |
| GET `poorti/purchaseShipments/{shipmentId}` | shipment detail: items and receipts |

### 4.3 Communications, imports and shared (`oms`, `admin`)

| Method + path | Use |
|---|---|
| GET/PUT `oms/productStoreEmailSettings/{productStoreId}/emailSettings[/{emailType}]` | email settings per store and type |
| GET `oms/emailGateways` | the gateways an email setting can use: `{gateways: [{systemMessageRemoteId, description}]}` |
| GET `oms/communicationEvents`, `oms/communicationEvents/counts` | the email log, and sends since a date (7 and 30 day windows count today) |
| GET `admin/enums` | email types |
| GET `admin/dataManager/details`, `admin/dataManager/downloadDataManagerFile`, `admin/dataManager/{configId}/downloadTemplate`, POST `admin/uploadDataManagerFile` | import tracking, downloads and uploads |
| GET `admin/systemMessages` | received promise date changes not yet queued |
| `admin/user/*`, `admin/productStores/{id}/settings`, `oms/dataDocumentView`, `oms/goodIdentificationTypes` | the user, permissions, product store settings and identifiers |

### 4.4 Backend changes behind the app (oms)

- `ProductStoreEmailSetting.disabled` (indicator). `send#EmailOnOrderEvents` skips a disabled
  setting, as it skips a missing one.
- `send#EmailOnOrderEvents` records `CommunicationEvent.reasonEnumId = emailType` unless the caller
  gives a reason.
- The promise date cascade: the `FutureInventoryPromiseDateFeed` data feed (on a batch's
  `promiseDate`; a new batch is skipped) queues a `FutureInventoryPromiseDateChange` message;
  `consume#FutureInventoryPromiseDateChange` writes the batch's FI-backed lines to an
  `IMP_FI_PROMISE_DATE` import (`DMC_QUEUE`), and `import#FutureInventoryPromiseDateLine` updates one
  line per row. It replaces the `SyncPromiseDateFromFII` SECA and `sync#PromiseDateFromFII`.

## 5. Known limits and follow-ups

Found while verifying against the local OMS (2026-10-18):

- **The supplier list only names parties already on a PO.** It is `SHIP_FROM_VENDOR` roles on
  existing POs, so a first PO from a new supplier can't be created from the app yet. It should list
  SUPPLIER role parties.
- **"Soonest arrival" sorts POs with no arrival date first.**
- **Local environment problems in oms, not fixed here:**
  - The local Solr has no PRODUCT documents, and `create#ProductIndex` writes documents with a
    null identifier.
  - The local DB has no `COM_EVENT_STATUS` StatusItems, so no CommunicationEvent can be recorded
    and the email log stays empty.
  - `send#EmailOnOrderEvents` throws for a store with no ShopifyShop.
  - The QA fixture stores have no pay-to company, so `store#PurchaseOrder` refuses POs for them.
    Demo Store works.


- **FI is not scoped to a store.** On the dashboard and FI pages, store scope comes from
  ProductStoreFacility, as on the old board.
- **Promise dates are read from the database.** Solr's `promisedDatetime` can lag the cascade,
  because the cascade does not reindex. Not fixed here.
- **The pre-order "Released" filter** runs as a NOT IN over the store's parked order ids. A store
  with very many parked orders needs a sub-select.
- **The locally configured email settings have no gateway.** Enabling an email does not make it
  reach Klaviyo until a CommGatewayAuth and SystemMessageRemote are set.
- **Permissions:** `PREORDER_APP_UPDATE` and `PREORDER_ADMIN` are proposed, not seeded. The new
  REST paths are granted by `PREORDER_APP_READ_API` (VIEW) and `PREORDER_APP_WRITE_API` (ALL), but
  maarg-util adds every user to ADMIN on login, so any login can write through them today; the
  app's update permissions are checked only in the browser.
- **Spec gaps found by QA:** no assertion on the email log's store scope, a successful reallocate
  through the wrapper, or the PO list's supplier, facility and arrival filters.
- **`PurchaseOrderSummary`:** a PO with two different `SHIP_FROM_VENDOR` parties would count its
  quantity twice. No such PO exists today.
