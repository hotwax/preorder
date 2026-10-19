<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Dashboard') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" :aria-label="translate('Refresh')" @click="load">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ion-item lines="none" class="selected-store-header">
        <ion-icon slot="start" :icon="globeOutline" />
        <ion-label>
          <h1>{{ storeName }}</h1>
        </ion-label>
      </ion-item>

      <ion-card v-if="dashboard?.storeScope === 'NO_STORE_FACILITIES'" color="warning" class="scope-note">
        <ion-card-content>
          {{ translate('{store} has no facilities assigned, so future inventory figures cover every facility. Assign the store its facilities in the Company app to see only its own.', { store: storeName }) }}
        </ion-card-content>
      </ion-card>

      <!-- Global stat: what is promised and not yet fulfilled -->
      <ion-card class="global-stat">
        <ion-card-content v-if="error" class="section-error">
          <p>{{ translate("Couldn't load the dashboard") }}</p>
          <ion-button fill="outline" size="small" @click="load">
            <ion-icon slot="start" :icon="refreshOutline" />
            {{ translate('Retry') }}
          </ion-button>
        </ion-card-content>

        <ion-card-content v-else-if="loading && !dashboard" class="section-loading">
          <ion-spinner name="crescent" />
        </ion-card-content>

        <ion-card-content v-else-if="dashboard">
          <div class="total-units">
            <p class="overline">{{ translate('Open pre-order units') }}</p>
            <h1 class="big-number">{{ formatNumber(dashboard.openUnits) }}</h1>
            <p class="time-elapsed">{{ translate('{orders} orders, {lines} items', { orders: formatNumber(dashboard.openOrders), lines: formatNumber(dashboard.openLines) }) }}</p>
          </div>

          <div class="metrics">
            <ion-item v-for="metric in metrics" :key="metric.id" lines="none" class="metric">
              <div class="metric-body">
                <div class="metric-label">
                  <p>{{ metric.label }}</p>
                  <p>{{ metric.percent }}%</p>
                </div>
                <ion-note>{{ metric.note }}</ion-note>
                <ion-progress-bar :value="metric.value" :aria-label="metric.label" />
              </div>
            </ion-item>
          </div>
        </ion-card-content>
      </ion-card>

      <section v-if="dashboard && !error" class="drilldown ion-padding">
        <StatCard :title="translate('Arriving in {days} days', { days: ARRIVAL_DAYS })" :stat="formatNumber(dashboard.arrivingSoon.count)" :subtitle="translate('{quantity} units, {reserved} already sold', { quantity: formatQuantity(dashboard.arrivingSoon.quantity), reserved: formatQuantity(dashboard.arrivingSoon.reserved) })">
          <ion-list lines="none" class="drilldown-list">
            <ion-item v-for="batch in dashboard.arrivingSoon.batches" :key="batch.futureInventoryItemId" button :detail="true" :router-link="batchRoute(batch.futureInventoryItemId)">
              <ion-label>
                {{ productLabel(batch.productId, batch.productName) }}
                <p>{{ formatDate(batch.promiseDate) }}</p>
              </ion-label>
              <p slot="end">{{ formatQuantity(batch.quantityOnHandTotal) }}</p>
            </ion-item>
          </ion-list>
        </StatCard>

        <StatCard :title="translate('Past due')" :stat="formatNumber(dashboard.pastDue.count)" :subtitle="translate('Active batches whose promise date has passed')">
          <ion-list lines="none" class="drilldown-list">
            <ion-item v-for="batch in dashboard.pastDue.batches" :key="batch.futureInventoryItemId" button :detail="true" :router-link="batchRoute(batch.futureInventoryItemId)">
              <ion-label>
                {{ productLabel(batch.productId, batch.productName) }}
                <p>{{ [batch.poId, formatDate(batch.promiseDate)].filter(Boolean).join(' - ') }}</p>
              </ion-label>
              <p slot="end">{{ daysOverdue(batch.promiseDate) ? overdueLabel(daysOverdue(batch.promiseDate)) : formatRelativeDay(batch.promiseDate) }}</p>
            </ion-item>
          </ion-list>
        </StatCard>

        <StatCard :title="translate('Needs attention')" :stat="formatNumber(dashboard.exceptions.count + dashboard.overcommitted.count)" :subtitle="translate('{over} overcommitted, {closed} closed with reservations', { over: dashboard.overcommitted.count, closed: dashboard.exceptions.count })">
          <ion-list lines="none" class="drilldown-list">
            <ion-item v-for="batch in attentionBatches" :key="batch.futureInventoryItemId" button :detail="true" :router-link="batchRoute(batch.futureInventoryItemId)">
              <ion-label>
                {{ productLabel(batch.productId, batch.productName) }}
                <p>{{ batch.exceptionReason || translate('{atp} available to promise', { atp: formatQuantity(batch.availableToPromiseTotal) }) }}</p>
              </ion-label>
              <p slot="end">{{ translate('{count} reserved', { count: formatQuantity(batch.reservedQuantity) }) }}</p>
            </ion-item>
          </ion-list>
        </StatCard>

        <StatCard :title="translate('No promise date')" :stat="formatNumber(dashboard.noPromiseDate.count)" :subtitle="translate('Pre-order items customers have no date for')">
          <ion-list lines="none" class="drilldown-list">
            <ion-item v-for="line in dashboard.noPromiseDate.lines" :key="`${line.orderId}-${line.orderItemSeqId}`" button :detail="true" :router-link="`/preorders/${encodeURIComponent(line.orderId)}`">
              <ion-label>
                {{ line.orderName || line.orderId }}
                <p>{{ productLabel(line.productId) }}</p>
              </ion-label>
              <p slot="end">{{ formatDate(line.orderDate) }}</p>
            </ion-item>
          </ion-list>
        </StatCard>

        <StatCard :title="translate('Pre-order demand')" :stat="formatNumber(demandTotal)" :subtitle="translate('Units reserved in the last {days} days', { days: TREND_DAYS })">
          <Sparkline v-if="demandPoints.length > 1" :points="demandPoints" :label="translate('Units reserved per day')" color="primary" />
        </StatCard>

        <StatCard :title="translate('Delay emails')" :stat="formatNumber(dashboard.delayEmails.count)" :subtitle="translate('{changes} promise date changes in the last {days} days', { changes: formatNumber(dashboard.promiseDateChanges), days: TREND_DAYS })">
          <Sparkline v-if="emailPoints.length > 1" :points="emailPoints" :label="translate('Delay emails per day')" color="warning" />
          <ion-list lines="none" class="drilldown-list">
            <ion-item button :detail="true" router-link="/communications">
              <ion-label>{{ translate('Communications') }}</ion-label>
            </ion-item>
          </ion-list>
        </StatCard>
      </section>

      <template v-if="dashboard && !error">
        <hr class="divider" />

        <ion-item lines="none" class="section-heading">
          <ion-icon slot="start" :icon="pricetagsOutline" />
          <ion-label>
            <h1>{{ translate('Top pre-order products') }}</h1>
          </ion-label>
        </ion-item>

        <ion-list class="ion-padding-top">
          <ion-list-header>
            <ion-label>{{ translate('Open reserved units') }}</ion-label>
          </ion-list-header>
          <ion-item v-for="product in dashboard.topProducts" :key="product.productId" lines="none" button :detail="false" class="product-metric-item" @click="openProduct(product.productId)">
            <div class="product-metric">
              <div class="product-metric-label">
                <ion-label>{{ productLabel(product.productId, product.productName) }}</ion-label>
                <ion-note>{{ formatQuantity(product.openUnits) }}</ion-note>
              </div>
              <ion-progress-bar :value="topProductMax ? product.openUnits / topProductMax : 0" :aria-label="productLabel(product.productId, product.productName)" />
            </div>
          </ion-item>
          <ion-item v-if="!dashboard.topProducts.length" lines="none">
            <ion-label>{{ translate('No open pre-orders.') }}</ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonMenuButton, IonNote, IonPage, IonProgressBar, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { globeOutline, pricetagsOutline, refreshOutline } from 'ionicons/icons';
import { computed, ref, watch } from 'vue';
import { Sparkline, StatCard, translate } from '@common';
import { useProductMaster, useSeedData } from '@common/db';
import router from '@/router';
import { useDashboard, type PreorderDashboard } from '@/composables/useDashboard';
import { useProductIdentity } from '@/composables/useProductIdentity';
import { useProductStore } from '@/store/productStore';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { countParams, formatDate, formatNumber, formatQuantity, formatRelativeDay } from '@/utils/format';
import { daysOverdue, overdueLabel } from '@/utils/labels';

const ARRIVAL_DAYS = 7;
const TREND_DAYS = 30;

const seed = useSeedData();
const productStore = useProductStore();
const futureInventorySearch = useFutureInventorySearchStore();
const { prefetch } = useProductMaster();
const { getProduct, primaryId } = useProductIdentity();
const { fetchDashboard } = useDashboard();

const dashboard = ref<PreorderDashboard>();
const loading = ref(false);
const error = ref(false);

const productStoreId = computed(() => productStore.getCurrentProductStoreId);
const storeName = computed(() => (productStoreId.value ? seed.productStoreName(productStoreId.value) : translate('All stores')));

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const metrics = computed(() => {
  const data = dashboard.value;
  if (!data) return [];
  const preorderUnits = Number(data.openUnitsByType?.FIT_PRE_ORDER || 0);
  const backorderUnits = Number(data.openUnitsByType?.FIT_BACK_ORDER || 0);
  const supply = Number(data.supply?.quantityOnHand || 0);
  const reserved = Number(data.supply?.reserved || 0);
  return [
    { id: 'preorder', label: translate('On pre-order'), percent: percent(preorderUnits, data.openUnits), value: data.openUnits ? preorderUnits / data.openUnits : 0, note: translate('{count} units', countParams(preorderUnits)) },
    { id: 'backorder', label: translate('On back-order'), percent: percent(backorderUnits, data.openUnits), value: data.openUnits ? backorderUnits / data.openUnits : 0, note: translate('{count} units', countParams(backorderUnits)) },
    { id: 'parked', label: translate('Waiting at parking'), percent: percent(data.parkedLines, data.openLines), value: data.openLines ? data.parkedLines / data.openLines : 0, note: translate('{shown} / {total} items', { shown: formatNumber(data.parkedLines), total: formatNumber(data.openLines) }) },
    { id: 'sellThrough', label: translate('Future inventory sold'), percent: percent(reserved, supply), value: supply ? Math.min(reserved / supply, 1) : 0, note: translate('{reserved} of {supply} units on {batches} active batches', { reserved: formatQuantity(reserved), supply: formatQuantity(supply), batches: formatNumber(data.supply?.activeBatches) }) },
  ];
});

const attentionBatches = computed(() => [...(dashboard.value?.overcommitted.batches || []), ...(dashboard.value?.exceptions.batches || [])].slice(0, 5));
const demandPoints = computed(() => (dashboard.value?.demandTrend || []).map((point) => Number(point.units || 0)));
const demandTotal = computed(() => demandPoints.value.reduce((sum, units) => sum + units, 0));
const emailPoints = computed(() => (dashboard.value?.delayEmails.trend || []).map((point) => Number(point.count || 0)));
const topProductMax = computed(() => Math.max(0, ...(dashboard.value?.topProducts || []).map((product) => Number(product.openUnits || 0))));

const productLabel = (productId: string, fallback?: string) => primaryId(getProduct(productId), [fallback, productId]);
const batchRoute = (id: string) => `/future-inventory/${encodeURIComponent(id)}`;

// Only the latest request may land: a store switch while one is in flight discards the older answer.
let requestId = 0;

async function load() {
  const current = ++requestId;
  loading.value = true;
  error.value = false;
  try {
    const data = await fetchDashboard(productStoreId.value, TREND_DAYS, ARRIVAL_DAYS);
    if (current !== requestId) return;
    dashboard.value = data;
    void prefetch([
      ...data.arrivingSoon.batches, ...data.pastDue.batches, ...data.exceptions.batches, ...data.overcommitted.batches,
      ...data.noPromiseDate.lines, ...data.topProducts,
    ].map((row: any) => row.productId).filter(Boolean));
  } catch {
    if (current === requestId) error.value = true;
  } finally {
    if (current === requestId) loading.value = false;
  }
}

/** A top product opens its active batches on the Future inventory page. */
function openProduct(productId: string) {
  futureInventorySearch.clearFilters();
  futureInventorySearch.query = productId;
  futureInventorySearch.markStale();
  router.push('/future-inventory');
}

// Another store's figures never show under this store's name.
watch(productStoreId, () => {
  dashboard.value = undefined;
  void load();
});
onIonViewWillEnter(load);
</script>

<style scoped>
/* Order Manager's Funnel layout: the store header, a global stat card, a grid of drilldown cards. */
.selected-store-header {
  margin-top: var(--spacer-xs);
  margin-bottom: var(--spacer-xs);
}

.global-stat,
.scope-note {
  margin: var(--spacer-sm);
}

.global-stat ion-card-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacer-base);
  padding: var(--spacer-sm);
}

@media (min-width: 768px) {
  .global-stat ion-card-content {
    grid-template-columns: minmax(128px, 160px) minmax(0, 1fr);
    align-items: stretch;
  }
}

.total-units {
  display: grid;
  align-content: center;
  margin: 0;
  min-width: 0;
}

.big-number {
  margin: var(--spacer-xs) 0;
}

.time-elapsed {
  margin: 0;
}

.metrics {
  display: grid;
  gap: var(--spacer-xs);
  min-width: 0;
}

.metric-body {
  width: 100%;
}

.metric-label {
  display: flex;
  justify-content: space-between;
  gap: var(--spacer-sm);
  margin-bottom: var(--spacer-2xs);
}

.metric-label p {
  margin: 0;
}

.metric ion-progress-bar {
  height: var(--spacer-lg);
  border-radius: var(--spacer-xs);
  overflow: hidden;
}

.global-stat .section-loading,
.global-stat .section-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacer-sm);
}

.drilldown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacer-sm);
}

.drilldown-list {
  padding: 0;
}

.divider {
  margin: var(--spacer-base) 0;
}

.product-metric-item {
  --padding-start: var(--spacer-sm);
  --inner-padding-end: var(--spacer-sm);
}

.product-metric {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacer-sm);
}

.product-metric-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer-sm);
  flex: 0 1 306px;
}

.product-metric ion-progress-bar {
  flex: 1 1 auto;
  height: var(--spacer-lg);
  border-radius: var(--spacer-xs);
}

@media (max-width: 767px) {
  .product-metric {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacer-xs);
  }

  .product-metric-label {
    flex: initial;
  }
}
</style>
