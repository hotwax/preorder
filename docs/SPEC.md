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
| `/purchase-orders` | Find purchase orders (not scoped to the menu's store: supply belongs to facilities, and a PO may name no store) | `APP_PO_VIEW` |
| `/purchase-orders/create` | Create purchase order | `APP_PO_UPDATE` |
| `/purchase-orders/:orderId` | PO detail | `APP_PO_VIEW` |
| `/inbound-shipments` | Find inbound shipments | `APP_PO_VIEW` |
| `/inbound-shipments/:shipmentId` | Inbound shipment detail | `APP_PO_VIEW` |
| `/po-imports` | PO and FI import tracking, CSV upload | `APP_PO_VIEW` |
| `/communications` | Post-purchase communications | `APP_COMMS_VIEW` |
| `/settings` | Settings | any |

Only `PREORDER_APP_VIEW` exists in seed data today. Update actions fall back to existing admin
permissions (`ORDERMGR_ADMIN`, `ORD_PURCH_ORDER_ADMIN`, `COMMON_ADMIN`) until `PREORDER_APP_UPDATE`
and `PREORDER_ADMIN` are seeded (`src/authorization/actions.ts`).

Menu: Dashboard, Pre-orders, Future inventory; **Supply**: Purchase orders, Inbound shipments,
PO imports; **Customers**: Communications; Settings.

## 3. Pages

### 3.1 Dashboard (`/dashboard`)

Inspired by eBike's Tathya "E-Bike - Dashboard" (id 34: backorder units, YoY revenue, inventory
arriving soon, PO arriving soon, backdated POs, backorders with no promise date, on/off backorder)
and rebuilt on the FI model, in Funnel's layout. One request: `GET preorder/dashboard`.

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

A pre-order is a sales order with at least one line that has reserved future inventory (an
`FID_RESERVED` ledger row). Rows are orders.

Filters: every Find orders filter from Order Manager, plus parking.

| Filter | Values | Backed by |
|---|---|---|
| Search | order id, order name, external id, customer name, email | `OrderHeader`, `OrderRole BILL_TO_CUSTOMER` + `Person`, `OrderContactMech ORDER_EMAIL` |
| Status | multi: order statuses | `OrderHeader.statusId` |
| At parking now | Any / At parking / Released | any FI line's ship group at a facility of type `PRE_ORDER` or `BACKORDER` |
| Allocation state | All, Allocated, Awaiting brokering, Unfillable, Archived | the line's ship group facility (Order Manager's vocabulary) |
| FI type | All, Pre-order, Back-order | `FutureInventoryItem.futureInventoryItemTypeId` |
| Sales channel | enums `ORDER_SALES_CHANNEL` | `OrderHeader.salesChannelEnumId` |
| Shipping method | shipment methods | `OrderItemShipGroup.shipmentMethodTypeId` |
| Order date from / through | dates | `OrderHeader.orderDate` |
| Product store | the menu footer's store | `OrderHeader.productStoreId` |

Sort: oldest first (default) or newest first.

Each row shows:
- the customer, with order name, id and status;
- pre-order lines, and how many are at parking now;
- the FI type and the channel;
- the order date;
- the **current promise date**: the earliest and latest `OrderItem.promisedDatetime` across the
  order's FI lines, read from the database (not Solr, which can lag the date cascade).

Bulk actions (select mode):
- **Release to brokering**: moves lines waiting at pre-order or back-order parking to `_NA_` with
  `POST oms/orders/{orderId}/moveItemToParking`, so routing can broker them.
- **Cancel pre-order items**: `POST oms/orders/{orderId}/items/cancel` on the open FI lines; the
  cancel SECA releases their reservations.
- **Export CSV**.

Detail (`/preorders/:orderId`) shows each line with:
- its product, status and facility;
- its batch (FI id, type, batch promise date, PO);
- its own promise date and auto-cancel date.

Line action: **Move to another batch**, which calls `reallocate#FutureInventoryReservation`.

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

Filters:
- search: PO id, name, external id;
- status (multi);
- supplier;
- destination facility;
- arrival from / through;
- order date from / through.

Sort: soonest arrival, newest, oldest.

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
- lines: product search (Solr, sellable variants and simple products; falls back to OMS's
  product list when Solr has no product documents), quantity, unit cost and arrival date;
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

### 3.8 Settings

Settings has these cards:
- the user (with logout and Launchpad);
- the OMS instance;
- the product store;
- the app version;
- the timezone;
- the language;
- the local database status.

## 4. Backend contract

All paths are relative to `/rest/s1/`.

### 4.1 Existing endpoints used

| Path | Use |
|---|---|
| `GET oms/purchaseOrders/{orderId}` | PO detail with items |
| `POST oms/purchaseOrders/{orderId}/status` | approve, cancel and complete |
| `GET oms/purchaseOrders/{orderId}/receipts` | PO receipts |
| `POST oms/orders/{orderId}/moveItemToParking` | release to brokering |
| `POST oms/orders/{orderId}/items/cancel` | cancel pre-order items |
| `GET preorder/futureInventory` | FI entity list |
| `POST admin/uploadDataManagerFile` | uploads |
| `GET admin/dataManager/details` | import tracking |
| `GET admin/dataManager/downloadDataManagerFile` | import file downloads |
| `GET admin/dataManager/{configId}/downloadTemplate` | import templates |
| `GET/PUT/POST oms/productStoreEmailSettings...` | email settings |
| `admin/search/query` | product search in Create PO |

### 4.2 New: `preorder` REST (preorder-maarg, branch `feat/preorder-app-api`)

| Method + path | Backing | Notes |
|---|---|---|
| GET `preorder/dashboard` | `get#PreorderDashboard` | all dashboard figures for a store |
| GET `preorder/preorders` | `get#PreorderOrders` | filters as in 3.2. Returns `{orders, ordersCount}`; each order carries its FI lines |
| GET `preorder/preorders/{orderId}` | `get#PreorderOrder` | header and FI lines with batches |
| POST `preorder/preorders/{orderId}/items/{orderItemSeqId}/reallocate` | `reallocate#FutureInventoryReservation` | |
| GET `preorder/futureInventory/{futureInventoryItemId}` | FI view, one | |
| GET `preorder/futureInventoryItems` | `get#FutureInventoryItems` over `FutureInventoryItemAndProduct` | product and facility names, computed `reservedQuantity`; `{futureInventoryItems, futureInventoryItemsCount}` |
| GET `preorder/futureInventory/{id}/details` | FutureInventoryItemDetail list | the ledger |
| GET `preorder/futureInventory/{id}/lines` | FutureInventoryBackedLine list | waiting lines |
| POST `preorder/futureInventory/{id}/adjust` | `adjust#FutureInventoryItem` | a quantity diff and/or a new promise date; one `FID_ADJUSTED` row |
| POST `preorder/futureInventory/{id}/cancel` | `cancel#FutureInventoryItem` | |
| GET `preorder/purchaseOrders` | `PurchaseOrderSummary` view | supplier, facility, line and unit totals, earliest arrival; `{orders, ordersCount}` |
| POST `preorder/purchaseOrders` | `create#PurchaseOrder` | header and lines through `store#PurchaseOrder` (the import path); optional FI batches |
| POST `preorder/purchaseOrders/{orderId}/arrivalDate` | `update#PurchaseOrderArrivalDate` | open lines' date plus `OrderItemChange`, so FI follows |
| POST `preorder/purchaseOrders/{orderId}/futureInventory` | `create#PurchaseOrderFutureInventory` | a batch per open line without one |
| GET `preorder/inboundShipments` | `InboundShipmentSummary` view | `{shipments, shipmentsCount}` |
| GET `preorder/inboundShipments/{shipmentId}` | `get#InboundShipment` | items with received quantity, and receipts |
| GET `preorder/communicationEvents` | `CommunicationEventOrderStore` view | email events scoped to a store through their order; `{communicationEvents, communicationEventsCount}` |
| GET `preorder/communicationEventCounts` | count view | by email type and status, since a date |
| GET `preorder/emailSettings` | `get#PreorderEmailSettings` | pre-order email types with setting, enabled, gateway and wired state |
| POST `preorder/emailSettings/{emailType}` | `update#PreorderEmailSetting` | enable or disable; creates the setting on first enable |

### 4.3 New: oms (branch `feat/preorder-app-api`)

- `ProductStoreEmailSetting.disabled` (indicator). `send#EmailOnOrderEvents` skips a disabled
  setting, as it skips a missing one.
- `send#EmailOnOrderEvents` records `CommunicationEvent.reasonEnumId = emailType` unless the caller
  gives a reason.

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
