<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Pre-orders') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <SearchFilterCard
        v-model="query"
        :placeholder="translate('Order, external ID, customer, email')"
        :show-clear="false"
      >
        <UniformFilterLayout @clear="clearFilters">
          <ion-select v-model="filters.parking" :label="translate('At parking now')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="any">{{ translate('Any') }}</ion-select-option>
            <ion-select-option value="parked">{{ translate('At pre-order parking') }}</ion-select-option>
            <ion-select-option value="released">{{ translate('Released from parking') }}</ion-select-option>
          </ion-select>

          <MultiSelectFilter
            v-model="filters.statusId"
            :label="translate('Status')"
            :all-label="translate('All statuses')"
            :options="orderStatusOptions"
          />

          <ion-select v-model="filters.allocationState" :label="translate('Allocation state')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All locations') }}</ion-select-option>
            <ion-select-option value="Allocated">{{ translate('Allocated') }}</ion-select-option>
            <ion-select-option value="AwaitingBrokering">{{ translate('Awaiting brokering') }}</ion-select-option>
            <ion-select-option value="Unfillable">{{ translate('Unfillable') }}</ion-select-option>
            <ion-select-option value="Archived">{{ translate('Archived') }}</ion-select-option>
          </ion-select>

          <ion-select v-model="filters.futureInventoryItemTypeId" :label="translate('Future inventory type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All types') }}</ion-select-option>
            <ion-select-option v-for="type in FUTURE_INVENTORY_TYPES" :key="type.value" :value="type.value">{{ translate(type.label) }}</ion-select-option>
          </ion-select>

          <ion-select v-model="filters.salesChannelEnumId" :label="translate('Sales channel')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All channels') }}</ion-select-option>
            <ion-select-option v-for="option in salesChannels" :key="option.enumId" :value="option.enumId">
              {{ option.description || option.enumName || option.enumId }}
            </ion-select-option>
          </ion-select>

          <ion-select v-model="filters.shipmentMethodTypeId" :label="translate('Shipping method')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All methods') }}</ion-select-option>
            <ion-select-option v-for="option in shipmentMethodOptions" :key="option.id" :value="option.id">{{ option.label }}</ion-select-option>
          </ion-select>

          <DateFilterSelect v-model="filters.orderDateFrom" :label="translate('Order date from')" :max="filters.orderDateThru" outlined />
          <DateFilterSelect v-model="filters.orderDateThru" :label="translate('Order date through')" :min="filters.orderDateFrom" outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />

      <ErrorState v-if="error" :title="translate('Could not load pre-orders')" :message="error" retryable @retry="store.runSearch()" />

      <ion-list v-else>
        <ion-list-header v-if="results.length" class="results-header">
          <span class="results-header-start">
            <ion-checkbox
              v-if="selectMode"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              :aria-label="translate('Select all loaded orders')"
              @ionChange="toggleAll($event.detail.checked)"
            />
          </span>
          <ion-label>{{ translate('{shown} of {count} pre-orders', { shown: results.length, count: total }) }}</ion-label>
          <SortPopover v-model="sort" trigger-id="preorder-sort-trigger" :options="sortOptions" />
          <ion-button fill="clear" size="small" @click="toggleSelectMode">
            {{ selectMode ? translate('Done') : translate('Select') }}
          </ion-button>
        </ion-list-header>
        <PreorderRow
          v-for="order in results"
          :key="order.orderId"
          :order="order"
          :select-mode="selectMode"
          :selected="selectedIds.includes(order.orderId)"
          @activate="activate(order)"
          @selection-change="setSelected(order.orderId, $event)"
        />
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !results.length"
        :title="translate('No matching pre-orders')"
        :message="translate('Pre-orders are sales orders with items that reserved future inventory. Adjust the search text or filters to broaden the list.')"
      />

      <ion-infinite-scroll :disabled="!hasMore" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more pre-orders')" />
      </ion-infinite-scroll>
    </ion-content>

    <ion-footer v-if="selectMode">
      <ion-toolbar>
        <ion-title size="small">{{ translate('{count} selected', { count: selectedIds.length }) }}</ion-title>
        <ion-buttons slot="end" class="bulk-action-buttons">
          <ion-button fill="outline" :disabled="!selectedParkedCount || !canUpdate" @click="confirmRelease">{{ translate('Release to brokering') }}</ion-button>
          <ion-button fill="outline" color="danger" :disabled="!selectedIds.length || !canUpdate" @click="confirmCancel">{{ translate('Cancel pre-order items') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedIds.length" @click="exportSelected">{{ translate('Export CSV') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonFooter, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent,
  IonLabel, IonList, IonListHeader, IonMenuButton, IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user';
import { usePreorderActions } from '@/composables/usePreorderActions';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import MultiSelectFilter from '@/components/common/MultiSelectFilter.vue';
import SortPopover from '@/components/common/SortPopover.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PreorderRow from '@/components/preorders/PreorderRow.vue';
import { confirmAction, showToast } from '@/utils';
import { FUTURE_INVENTORY_TYPES, futureInventoryTypeLabel } from '@/utils/labels';
import { toCsv } from '@/utils/query';
import { downloadText } from '@/utils/download';
import { formatDate } from '@/utils/format';
import Actions from '@/authorization/actions';
import type { PreorderOrder } from '@/types';

const seed = useSeedData();
const store = usePreorderSearchStore();
const productStore = useProductStore();
const userStore = useUserStore();
const { releaseToBrokering, cancelPreorderItems, parkedLines } = usePreorderActions();
const { query, filters, sort, results, total, loading, loaded, error, hasMore } = storeToRefs(store);

const sortOptions = [
  { label: 'Oldest first', value: 'orderDate' },
  { label: 'Newest first', value: '-orderDate' },
];
const orderStatusOptions = computed(() => seed.statusItemsByType('ORDER_STATUS').map((status: any) => ({ value: status.statusId, label: status.description || status.statusId })));
const salesChannels = computed(() => seed.enumsByType('ORDER_SALES_CHANNEL'));
const shipmentMethodOptions = computed(() => seed.shipmentMethodOptions());
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PREORDER_UPDATE));

const selectMode = ref(false);
const selectedIds = ref<string[]>([]);
const selectedOrders = computed(() => results.value.filter((order) => selectedIds.value.includes(order.orderId)));
const selectedParkedCount = computed(() => selectedOrders.value.reduce((count, order) => count + parkedLines(order).length, 0));
const allSelected = computed(() => results.value.length > 0 && results.value.every((order) => selectedIds.value.includes(order.orderId)));
const someSelected = computed(() => results.value.some((order) => selectedIds.value.includes(order.orderId)));

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(query, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => store.runSearch(), 300);
});
watch(filters, () => store.runSearch(), { deep: true });
watch(sort, () => store.runSearch());
watch(() => productStore.getCurrentProductStore?.productStoreId, () => store.runSearch());
watch(results, () => {
  const ids = new Set(results.value.map((order) => order.orderId));
  selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
});

onIonViewWillEnter(() => store.runSearch());

function activate(order: PreorderOrder) {
  if (selectMode.value) setSelected(order.orderId, !selectedIds.value.includes(order.orderId));
  else router.push(`/preorders/${encodeURIComponent(order.orderId)}`);
}

function setSelected(orderId: string, checked: boolean) {
  const next = new Set(selectedIds.value);
  if (checked) next.add(orderId);
  else next.delete(orderId);
  selectedIds.value = [...next];
}

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? results.value.map((order) => order.orderId) : [];
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value;
  if (!selectMode.value) selectedIds.value = [];
}

function clearFilters() {
  store.clearFilters();
  selectedIds.value = [];
}

async function loadMore(event: CustomEvent) {
  await store.appendNextPage();
  (event.target as HTMLIonInfiniteScrollElement).complete();
}

async function confirmRelease() {
  const confirmed = await confirmAction(
    translate('Release to brokering'),
    translate('This moves {count} items waiting at pre-order or back-order parking to brokering, so routing can allocate them to a fulfillment location.', { count: selectedParkedCount.value }),
    translate('Release'),
  );
  if (!confirmed) return;
  const { moved, failed } = await releaseToBrokering(selectedOrders.value);
  await showToast(failed ? translate('{moved} items released, {failed} failed.', { moved, failed }) : translate('{moved} items released to brokering.', { moved }));
  selectMode.value = false;
  selectedIds.value = [];
  await store.runSearch();
}

async function confirmCancel() {
  const confirmed = await confirmAction(
    translate('Cancel pre-order items'),
    translate('This cancels the open pre-order items of the {count} selected orders and releases their future inventory. This cannot be undone.', { count: selectedIds.value.length }),
    translate('Cancel items'),
  );
  if (!confirmed) return;
  const { cancelled, failed } = await cancelPreorderItems(selectedOrders.value);
  await showToast(failed ? translate('{cancelled} items cancelled, {failed} failed.', { cancelled, failed }) : translate('{cancelled} items cancelled.', { cancelled }));
  selectMode.value = false;
  selectedIds.value = [];
  await store.runSearch();
}

function exportSelected() {
  const rows = selectedOrders.value.flatMap((order) => (order.lines || []).map((line) => ({
    orderId: order.orderId,
    orderName: order.orderName,
    customer: order.customerName,
    email: order.email,
    orderDate: formatDate(order.orderDate),
    status: seed.statusDescription(order.statusId || ''),
    orderItemSeqId: line.orderItemSeqId,
    productId: line.productId,
    type: futureInventoryTypeLabel(line.futureInventoryItemTypeId),
    batch: line.futureInventoryItemId,
    atParking: line.atParking ? 'Y' : 'N',
    promiseDate: formatDate(line.promisedDatetime),
  })));
  downloadText('pre-orders.csv', toCsv(rows, [
    { key: 'orderId', label: 'Order ID' }, { key: 'orderName', label: 'Order name' }, { key: 'customer', label: 'Customer' },
    { key: 'email', label: 'Email' }, { key: 'orderDate', label: 'Order date' }, { key: 'status', label: 'Status' },
    { key: 'orderItemSeqId', label: 'Item' }, { key: 'productId', label: 'Product ID' }, { key: 'type', label: 'Type' },
    { key: 'batch', label: 'Future inventory' }, { key: 'atParking', label: 'At parking' }, { key: 'promiseDate', label: 'Promise date' },
  ]));
}
</script>

<style scoped>
.results-header {
  align-items: center;
  display: flex;
  gap: var(--spacer-xs);
}

.results-header-start {
  display: flex;
  min-width: 24px;
}

.bulk-action-buttons {
  overflow-x: auto;
}
</style>
