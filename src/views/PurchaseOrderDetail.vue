<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/purchase-orders" />
        </ion-buttons>
        <ion-title>{{ order?.orderName || orderId }}</ion-title>
        <ion-buttons v-if="isOpen && canUpdate" slot="end">
          <ion-button :id="`po-actions-${orderId}`" :disabled="loading" :aria-label="translate('Purchase order actions')"><ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-popover v-if="isOpen && canUpdate" :trigger="`po-actions-${orderId}`" :dismiss-on-select="true">
      <ion-content><ion-list>
        <ion-item v-if="order?.statusId === 'ORDER_CREATED'" button :detail="false" @click="setStatus('ORDER_APPROVED')"><ion-label>{{ translate('Approve') }}</ion-label></ion-item>
        <ion-item v-if="canChangeArrival" button :detail="false" @click="changeArrival()"><ion-label>{{ translate('Change arrival date') }}</ion-label></ion-item>
        <ion-item v-if="canUpdateFutureInventory" button :detail="false" :disabled="!linesWithoutBatch" @click="sellAsPreorderNow"><ion-label>{{ translate('Sell as pre-order') }}</ion-label></ion-item>
        <ion-item v-if="order?.statusId === 'ORDER_APPROVED'" button :detail="false" @click="setStatus('ORDER_COMPLETED')"><ion-label>{{ translate('Complete') }}</ion-label></ion-item>
        <ion-item button :detail="false" @click="setStatus('ORDER_CANCELLED')"><ion-label color="danger">{{ translate('Cancel order') }}</ion-label></ion-item>
      </ion-list></ion-content>
    </ion-popover>
    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load the purchase order')" :message="error" @retry="load" />

      <template v-else-if="order">
        <section class="summary">
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle v-if="idsBesideTitle">{{ idsBesideTitle }}</ion-card-subtitle>
              <ion-card-title>{{ order.supplierName || order.supplierPartyId || translate('No supplier') }}</ion-card-title>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item>
                <ion-label>{{ translate('Status') }}</ion-label>
                <ion-badge slot="end" :color="statusColor(order.statusId)">{{ seed.statusDescription(order.statusId || '') }}</ion-badge>
              </ion-item>
              <!-- The label above the facility name, which wraps: a long name in the end slot squeezed the label into broken words -->
              <ion-item>
                <ion-label class="ion-text-wrap">
                  <p class="overline">{{ translate('Destination') }}</p>
                  {{ seed.facilityName(order.facilityId || '') }}
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Ordered') }}</ion-label>
                <ion-note slot="end">{{ formatDate(order.orderDate) }}</ion-note>
              </ion-item>
              <ion-item v-if="Number(order.grandTotal) > 0">
                <ion-label>{{ translate('Total') }}</ion-label>
                <ion-note slot="end">{{ formatMoney(order.grandTotal, order.currencyUom) }}</ion-note>
              </ion-item>
            </ion-list>

          </ion-card>

          <div class="stats">
            <StatCard :title="translate('Ordered')" :stat="formatQuantity(sum('quantity') - sum('cancelQuantity'))" :subtitle="translate('{count} lines', { count: order.items.length })" />
            <StatCard :title="translate('Received')" :stat="formatQuantity(sum('receivedQuantity'))" :subtitle="receiptsError ? translate('Receipts could not be loaded') : translate('{count} receipts', { count: receipts.length })" />
            <StatCard :title="translate('Still to arrive')" :stat="formatQuantity(sum('openQuantity'))" :subtitle="earliestArrival ? translate('Next arrival {date}', { date: formatDate(earliestArrival) }) : translate('No arrival date')" />
            <StatCard :title="translate('Sold as pre-order')" :stat="formatQuantity(sumBatches('futureInventoryReserved'))" :subtitle="translate('{count} of {total} lines have a future inventory batch', { count: formatNumber(linesWithBatch), total: formatNumber(order.items.length), n: order.items.length })" />
          </div>
        </section>

        <ion-list>
          <ion-list-header>
            <ion-label>{{ translate('Lines') }}</ion-label>
          </ion-list-header>
          <div
            v-for="item in order.items"
            :key="item.orderItemSeqId"
            class="list-item po-line-row"
            :role="item.futureInventoryItemId ? 'link' : undefined"
            :tabindex="item.futureInventoryItemId ? 0 : undefined"
            @click="openBatch(item.futureInventoryItemId)"
            @keydown.enter.prevent="openBatch(item.futureInventoryItemId)"
          >
            <ProductItem :product-id="item.productId" :product-name="item.productName" />
            <ion-label class="tablet">
              {{ formatQuantity(Number(item.quantity || 0) - Number(item.cancelQuantity || 0)) }}
              <p>{{ translate('Ordered') }}</p>
            </ion-label>
            <ion-label class="tablet">
              {{ formatQuantity(item.receivedQuantity) }}
              <p>{{ translate('Received') }}</p>
            </ion-label>
            <ion-label class="tablet">
              <ion-chip v-if="item.futureInventoryItemId" :outline="true">
                <ion-icon :icon="layersOutline" />
                <ion-label>{{ translate('{atp} ATP, {reserved} reserved', { atp: formatQuantity(item.futureInventoryAvailableToPromise), reserved: formatQuantity(item.futureInventoryReserved) }) }}</ion-label>
              </ion-chip>
              <ion-note v-else>{{ translate('Not sold as pre-order') }}</ion-note>
            </ion-label>
            <ion-label>
              <ion-badge :color="statusColor(item.statusId)">{{ seed.statusDescription(item.statusId || '') }}</ion-badge>
            </ion-label>
            <ion-label class="ion-text-end">
              {{ formatDate(item.estimatedDeliveryDate) || translate('No arrival date') }}
              <p v-if="lineOverdueDays(item)"><ion-text color="danger">{{ overdueLabel(lineOverdueDays(item)) }}</ion-text></p>
              <p v-else-if="!isClosedLine(item)">{{ formatRelativeDay(item.estimatedDeliveryDate) }}</p>
            </ion-label>
          </div>
          <ion-item v-if="!order.items.length" lines="none">
            <ion-label>{{ translate('This purchase order has no lines.') }}</ion-label>
          </ion-item>
        </ion-list>

        <ErrorState v-if="shipmentsError" :title="translate('Could not load the inbound shipments')" :message="shipmentsError" @retry="loadShipments" />
        <ion-list v-else>
          <ion-list-header>
            <ion-label>{{ translate('Inbound shipments') }}</ion-label>
            <ion-button v-if="canUpdate && order.statusId === 'ORDER_APPROVED' && hasUnshipped" :router-link="`/purchase-orders/${encodeURIComponent(orderId)}/shipments/new`">
              {{ translate('Create shipment') }}
            </ion-button>
          </ion-list-header>
          <ion-item v-for="shipment in shipments" :key="shipment.shipmentId" button :router-link="`/inbound-shipments/${encodeURIComponent(shipment.shipmentId)}`">
            <ion-icon slot="start" :icon="boatOutline" />
            <ion-label>
              {{ shipment.externalId || shipment.shipmentId }}
              <p>{{ translate('{received} of {total} received', { received: formatQuantity(shipment.receivedQuantity), total: formatQuantity(shipment.quantityTotal) }) }}</p>
            </ion-label>
            <ion-badge slot="end" :color="statusColor(shipment.statusId)">{{ shipmentStatusLabel(shipment, seed.statusDescription(shipment.statusId || '')) }}</ion-badge>
            <ion-note slot="end">{{ formatDate(shipment.estimatedArrivalDate) }}</ion-note>
          </ion-item>
          <ion-item v-if="!shipments.length" lines="none">
            <ion-label>{{ translate('No inbound shipments against this purchase order yet.') }}</ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonContent,
  IonPopover, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage, IonProgressBar, IonText, IonTitle, IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { boatOutline, ellipsisVerticalOutline, layersOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { commonUtil, StatCard, translate } from '@common';
import { useSeedData } from '@common/db';
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';
import { useUserStore } from '@/store/user';
import { SOLR_SETTLE_MS, usePurchaseOrderSearchStore } from '@/store/purchaseOrderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import router from '@/router';
import ErrorState from '@/components/common/ErrorState.vue';
import ProductItem from '@/components/common/ProductItem.vue';
import { usePrompts } from '@/composables/usePrompts';
import { dayBound, formatDate, formatMoney, formatNumber, formatQuantity, formatRelativeDay, toMillis } from '@/utils/format';
import { daysOverdue, overdueLabel, shipmentStatusLabel } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import { isClosedLine } from '@/utils/purchaseOrders';
import type { InboundShipmentSummary, PurchaseOrderDetail, PurchaseOrderLine, PurchaseOrderReceipt } from '@/types';
import Actions from '@/authorization/actions';

const props = defineProps<{ orderId: string }>();
const seed = useSeedData();
const { confirmAction, promptForDate } = usePrompts();
const userStore = useUserStore();
const { fetchPurchaseOrder, fetchPurchaseOrderShipments, fetchPurchaseOrderReceipts, changeStatus, changeArrivalDate, sellAsPreorder } = usePurchaseOrderActions();

const order = ref<PurchaseOrderDetail>();
const loading = ref(false);
const error = ref('');
/** The order's shipments and receipts load beside it: one that fails shows its own error, never hiding the order. */
const shipments = ref<InboundShipmentSummary[]>([]);
const shipmentsError = ref('');
const receipts = ref<PurchaseOrderReceipt[]>([]);
const receiptsError = ref('');

const isOpen = computed(() => ['ORDER_CREATED', 'ORDER_APPROVED'].includes(order.value?.statusId || ''));
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PO_UPDATE));
/** A line with units no shipment carries yet: something a new inbound shipment can ship. */
const hasUnshipped = computed(() => (order.value?.items || []).some((item: any) => Number(item.unshippedQuantity) > 0));
// Selling as pre-order creates future inventory: the FI permission
const canUpdateFutureInventory = computed(() => userStore.hasPermission(Actions.APP_FI_UPDATE));
// Moving arrival dates updates the PO lines and moves their future inventory: both permissions
const canChangeArrival = computed(() => canUpdate.value && canUpdateFutureInventory.value);
const openItems = computed(() => (order.value?.items || []).filter((item) => !isClosedLine(item)));
const linesWithoutBatch = computed(() => openItems.value.filter((item) => !item.futureInventoryItemId).length);
/** Lines of any status with a batch: a closed line without one is not counted as having one. */
const linesWithBatch = computed(() => (order.value?.items || []).filter((item) => item.futureInventoryItemId).length);
/** The ids the toolbar title does not already show. */
const idsBesideTitle = computed(() => [order.value?.orderId, order.value?.externalId].filter((id) => id && id !== (order.value?.orderName || props.orderId)).join(' - '));
const earliestArrival = computed(() => openItems.value.map((item) => toMillis(item.estimatedDeliveryDate)).filter((millis): millis is number => !!millis).sort((a, b) => a - b)[0]);

/** An open line whose arrival date has passed: its supply is late. */
const lineOverdueDays = (item: PurchaseOrderLine) => (isClosedLine(item) ? 0 : daysOverdue(item.estimatedDeliveryDate));

type LineQuantity = 'quantity' | 'cancelQuantity' | 'receivedQuantity' | 'openQuantity' | 'futureInventoryReserved';
const sum = (field: LineQuantity) => (order.value?.items || []).reduce((total, item) => total + Number(item[field] || 0), 0);
const sumBatches = (field: LineQuantity) => (order.value?.items || []).filter((item) => item.futureInventoryItemId).reduce((total, item) => total + Number(item[field] || 0), 0);

async function loadShipments() {
  shipmentsError.value = '';
  try {
    shipments.value = await fetchPurchaseOrderShipments(props.orderId);
  } catch (err) {
    shipments.value = [];
    shipmentsError.value = errorMessage(err, translate('Failed to load the inbound shipments.'));
  }
}

async function loadReceipts() {
  receiptsError.value = '';
  try {
    receipts.value = await fetchPurchaseOrderReceipts(props.orderId);
  } catch (err) {
    receipts.value = [];
    receiptsError.value = errorMessage(err, translate('Failed to load the receipts.'));
  }
}

/** The order, and its shipments and receipts beside it: a part that fails shows its own error, never hiding the order. */
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [orderRow] = await Promise.all([fetchPurchaseOrder(props.orderId), loadShipments(), loadReceipts()]);
    order.value = orderRow;
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the purchase order.'));
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(load);

async function run(action: () => Promise<any>, success: string) {
  try {
    await action();
    await commonUtil.showToast(success);
  } catch (err) {
    await commonUtil.showToast(errorMessage(err, translate('The change was not saved.')));
  } finally {
    // Arrival dates save line by line: a failure can follow committed changes, which still need to be shown.
    usePurchaseOrderSearchStore().markStale(SOLR_SETTLE_MS);
    useFutureInventorySearchStore().markStale();
    usePreorderSearchStore().markStale();
    await load();
  }
}

const STATUS_ACTIONS: Record<string, { header: string; message: string; confirm: string; done: string }> = {
  ORDER_APPROVED: { header: 'Approve purchase order', message: 'Approve this purchase order?', confirm: 'Approve', done: 'Purchase order approved.' },
  ORDER_COMPLETED: { header: 'Complete purchase order', message: 'Complete this purchase order? Its open lines close, and nothing more is expected against it.', confirm: 'Complete', done: 'Purchase order completed.' },
  ORDER_CANCELLED: { header: 'Cancel purchase order', message: 'Cancel this purchase order? This cannot be undone.', confirm: 'Cancel order', done: 'Purchase order cancelled.' },
};

async function setStatus(statusId: string) {
  const action = STATUS_ACTIONS[statusId];
  if (await confirmAction(translate(action.header), translate(action.message), translate(action.confirm))) {
    await run(() => changeStatus(props.orderId, statusId), translate(action.done));
  }
}

function openBatch(futureInventoryItemId?: string) {
  if (futureInventoryItemId) router.push(`/future-inventory/${encodeURIComponent(futureInventoryItemId)}`);
}

async function changeArrival() {
  const arrivalDate = await promptForDate(
    translate('Change arrival date'),
    translate('The open lines move to this date. Their future inventory batches and waiting pre-orders follow.'),
    translate('Change date'),
    dayBound(earliestArrival.value, 'start', 'date'),
  );
  if (arrivalDate) await run(() => changeArrivalDate(props.orderId, arrivalDate, order.value?.items), translate('Arrival date changed.'));
}

async function sellAsPreorderNow() {
  const confirmed = await confirmAction(
    translate('Sell as pre-order'),
    translate('Creates a pre-order future inventory batch for each open line without one, at its arrival date and quantity.'),
    translate('Create batches'),
  );
  if (confirmed) await run(() => sellAsPreorder(props.orderId), translate('Future inventory created.'));
}
</script>

<style scoped>
.summary {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: minmax(0, 1fr);
  padding: var(--spacer-sm);
}

@media (min-width: 991px) {
  .summary {
    grid-template-columns: minmax(20rem, 1fr) 2fr;
  }
}

.summary ion-card {
  margin: 0;
}

.stats {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  align-content: start;
}

.po-line-row {
  --columns-desktop: 6;
  --columns-tablet: 5;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.po-line-row > ion-label {
  width: 100%;
}
@media (min-width: 700px) {
  .po-line-row { grid-template-columns: minmax(12rem, 2fr) repeat(2, minmax(3rem, .6fr)) minmax(8rem, 1.3fr) minmax(6rem, 1fr); }
}
@media (min-width: 991px) {
  .po-line-row { grid-template-columns: minmax(12rem, 2fr) repeat(2, minmax(3rem, .6fr)) minmax(8rem, 1.3fr) minmax(5rem, .7fr) minmax(6rem, 1fr); }
}
</style>
