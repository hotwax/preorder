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
          <MultiSelectFilter
            v-model="filters.statusId"
            :label="translate('Status')"
            :all-label="translate('All statuses')"
            :options="orderStatusOptions"
          />

          <ion-select v-model="filters.futureInventoryItemTypeId" :label="translate('Future inventory type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All types') }}</ion-select-option>
            <ion-select-option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</ion-select-option>
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

      <ErrorState v-if="error" :title="translate('Could not load pre-orders')" :message="error" retryable @retry="refresh()" />

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
          <ion-label>{{ translate('{shown} of {count} pre-orders', { shown: formatNumber(results.length), ...countParams(total) }) }}</ion-label>
          <SortPopover v-model="sort" trigger-id="preorder-sort-trigger" :options="sortOptions" />
          <ion-button fill="clear" size="small" :disabled="running" @click="toggleSelectMode">
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
        :message="translate('Pre-orders are open orders with items still waiting on future inventory, with no stock reserved yet. Adjust the search text or filters to broaden the list.')"
      />

      <ion-infinite-scroll :disabled="!hasMore || !!error" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more pre-orders')" />
      </ion-infinite-scroll>
    </ion-content>

    <ion-footer v-if="selectMode">
      <ion-toolbar>
        <ion-title size="small">{{ translate('{count} selected', { count: selectedIds.length }) }}</ion-title>
        <ion-buttons slot="end" class="bulk-action-buttons">
          <ion-button fill="outline" :disabled="!selectedParkedCount || !canUpdate || running || loading" @click="confirmRelease">{{ translate('Release to brokering') }}</ion-button>
          <ion-button fill="outline" color="danger" :disabled="!selectedIds.length || !canUpdate || running || loading" @click="confirmCancel">{{ translate('Cancel pre-order items') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedIds.length || loading" @click="exportSelected">{{ translate('Export CSV') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonFooter, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent,
  IonLabel, IonList, IonListHeader, IonMenuButton, IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { commonUtil, translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useUserStore } from '@/store/user';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { usePreorderActions } from '@/composables/usePreorderActions';
import { useFindSearch } from '@/composables/useFindSearch';
import { useBulkAction } from '@/composables/useBulkAction';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import MultiSelectFilter from '@/components/common/MultiSelectFilter.vue';
import SortPopover from '@/components/common/SortPopover.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PreorderRow from '@/components/preorders/PreorderRow.vue';
import { usePrompts } from '@/composables/usePrompts';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { toCsv } from '@/utils/query';
import { downloadText } from '@/utils/download';
import { countParams, formatDate, formatNumber } from '@/utils/format';
import Actions from '@/authorization/actions';
import type { PreorderOrder } from '@/types';

const seed = useSeedData();
const { confirmAction } = usePrompts();
const { running, runBulk } = useBulkAction();
const { typeLabel, typeOptions } = useFutureInventoryTypes();
const store = usePreorderSearchStore();
const { refresh } = useFindSearch(store, { onStoreChange });
const userStore = useUserStore();
const { releaseToBrokering, cancelPreorderItems, parkedLines } = usePreorderActions();
const { query, filters, sort, results, total, loading, loaded, error, hasMore } = storeToRefs(store);

const sortOptions = [
  { label: 'Newest first', value: '-orderDate' },
  { label: 'Oldest first', value: 'orderDate' },
];
// A closed order has no open pre-order line, so its statuses are not offered
const CLOSED_ORDER_STATUSES = ['ORDER_COMPLETED', 'ORDER_CANCELLED', 'ORDER_REJECTED'];
const orderStatusOptions = computed(() => seed.statusItemsByType('ORDER_STATUS')
  .filter((status: any) => !CLOSED_ORDER_STATUSES.includes(status.statusId))
  .map((status: any) => ({ value: status.statusId, label: status.description || status.statusId })));
const salesChannels = computed(() => seed.enumsByType('ORDER_SALES_CHANNEL'));
const shipmentMethodOptions = computed(() => seed.shipmentMethodOptions());
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PREORDER_UPDATE));

const selectMode = ref(false);
const selectedIds = ref<string[]>([]);
const selectedOrders = computed(() => results.value.filter((order) => selectedIds.value.includes(order.orderId)));
const selectedParkedCount = computed(() => selectedOrders.value.reduce((count, order) => count + parkedLines(order).length, 0));
const allSelected = computed(() => results.value.length > 0 && results.value.every((order) => selectedIds.value.includes(order.orderId)));
const someSelected = computed(() => results.value.some((order) => selectedIds.value.includes(order.orderId)));

watch(results, () => {
  const ids = new Set(results.value.map((order) => order.orderId));
  selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
});

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

/** Another store's orders leave with their selection, so a bulk action never runs on them under the new store. */
function onStoreChange() {
  clearSelection();
}

function clearSelection() {
  selectMode.value = false;
  selectedIds.value = [];
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
  const { moved, failed } = await runBulk(() => releaseToBrokering(selectedOrders.value));
  await commonUtil.showToast(failed ? translate('{moved} items released, {failed} failed.', { moved, failed, n: moved }) : translate('{moved} items released to brokering.', { moved, count: moved }));
  useFutureInventorySearchStore().markStale();
  selectMode.value = false;
  selectedIds.value = [];
  await refresh();
}

async function confirmCancel() {
  const confirmed = await confirmAction(
    translate('Cancel pre-order items'),
    translate('This cancels the open pre-order items of the {count} selected orders and releases their future inventory. This cannot be undone.', { count: selectedIds.value.length }),
    translate('Cancel items'),
  );
  if (!confirmed) return;
  const { cancelled, failed } = await runBulk(() => cancelPreorderItems(selectedOrders.value));
  await commonUtil.showToast(failed ? translate('{cancelled} items cancelled, {failed} failed.', { cancelled, failed, n: cancelled }) : translate('{cancelled} items cancelled.', { cancelled, count: cancelled }));
  useFutureInventorySearchStore().markStale();
  selectMode.value = false;
  selectedIds.value = [];
  await refresh();
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
    type: typeLabel(line.futureInventoryItemTypeId),
    batch: line.futureInventoryItemId,
    atParking: line.atParking ? translate('Yes') : translate('No'),
    promiseDate: formatDate(line.promisedDatetime),
  })));
  downloadText('pre-orders.csv', toCsv(rows, [
    { key: 'orderId', label: translate('Order ID') }, { key: 'orderName', label: translate('Order name') }, { key: 'customer', label: translate('Customer') },
    { key: 'email', label: translate('Email') }, { key: 'orderDate', label: translate('Order date') }, { key: 'status', label: translate('Status') },
    { key: 'orderItemSeqId', label: translate('Item') }, { key: 'productId', label: translate('Product ID') }, { key: 'type', label: translate('Type') },
    { key: 'batch', label: translate('Future inventory') }, { key: 'atParking', label: translate('At parking') }, { key: 'promiseDate', label: translate('Promise date') },
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
