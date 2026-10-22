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
        :placeholder="translate('Order name')"
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

          <DateFilterSelect v-model="filters.orderDateFrom" :label="translate('Order date from')" :max="filters.orderDateThru" />
          <DateFilterSelect v-model="filters.orderDateThru" :label="translate('Order date through')" :min="filters.orderDateFrom" />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />

      <ErrorState v-if="error" :title="translate('Could not load pre-orders')" :message="error" @retry="refresh()" />

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
          <ion-button fill="outline" :disabled="!selectedReleasableCount || !canUpdate || running || loading" @click="confirmRelease">{{ translate('Release to brokering') }}</ion-button>
          <ion-button fill="outline" color="danger" :disabled="!selectedWaitingCount || !canUpdate || running || loading" @click="confirmCancel">{{ translate('Cancel pre-order items') }}</ion-button>
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
import { computed } from 'vue';
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
import { useRowSelection } from '@/composables/useRowSelection';
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
import { useParkingFacilities } from '@/composables/useParkingFacilities';
import { toCsv } from '@/utils/query';
import { releasableLines, waitingLines } from '@/utils/preorderLines';
import { downloadText } from '@/utils/download';
import { countParams, formatDate, formatNumber } from '@/utils/format';
import Actions from '@/authorization/actions';
import type { PreorderOrder } from '@/types';

const seed = useSeedData();
const { confirmAction, promptForChoice } = usePrompts();
const { running, runBulk } = useBulkAction();
const { typeLabel, typeOptions } = useFutureInventoryTypes();
const store = usePreorderSearchStore();
// Another store's orders leave with their selection, so a bulk action never runs on them under the new store
const { refresh } = useFindSearch(store, { onStoreChange: () => clearSelection() });
const userStore = useUserStore();
const { releaseToBrokering, fetchCancelReasons, cancelPreorderItems } = usePreorderActions();
const { query, filters, sort, results: rawResults, total, loading, loaded, error, hasMore } = storeToRefs(store);
const { shape } = useParkingFacilities();
/** The loaded orders with their lines marked at parking or not, and the counts the rows show. */
const results = computed<PreorderOrder[]>(() => rawResults.value.map(shape));

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

const { selectMode, selectedIds, selectedRows: selectedOrders, allSelected, someSelected, setSelected, toggleSelected, toggleAll, deselectAll, clearSelection, toggleSelectMode } = useRowSelection(results, (order) => order.orderId);
// Bulk actions take only lines still holding an open reservation: a committed or released line is no longer a pre-order
const selectedWaitingCount = computed(() => selectedOrders.value.reduce((count, order) => count + waitingLines(order).length, 0));
const selectedReleasableCount = computed(() => selectedOrders.value.reduce((count, order) => count + releasableLines(order).length, 0));

function activate(order: PreorderOrder) {
  if (selectMode.value) toggleSelected(order.orderId);
  else router.push(`/preorders/${encodeURIComponent(order.orderId)}`);
}

function clearFilters() {
  store.clearFilters();
  deselectAll();
}

async function loadMore(event: CustomEvent) {
  await store.appendNextPage();
  (event.target as HTMLIonInfiniteScrollElement).complete();
}

async function confirmRelease() {
  const confirmed = await confirmAction(
    translate('Release to brokering'),
    translate('This moves {count} items waiting at pre-order or back-order parking to brokering, so routing can allocate them to a fulfillment location.', { count: selectedReleasableCount.value }),
    translate('Release'),
  );
  if (!confirmed) return;
  const { moved, failed } = await runBulk(() => releaseToBrokering(selectedOrders.value));
  await commonUtil.showToast(failed ? translate('{moved} items released, {failed} failed.', { moved, failed, n: moved }) : translate('{moved} items released to brokering.', { moved, count: moved }));
  useFutureInventorySearchStore().markStale();
  clearSelection();
  await refresh();
}

async function confirmCancel() {
  let reasons: { value: string; label: string }[] = [];
  try {
    reasons = await fetchCancelReasons();
  } catch (error: any) {
    await commonUtil.showToast(error?.message || translate('Failed to load the cancel reasons.'));
    return;
  }
  if (!reasons.length) {
    await commonUtil.showToast(translate('No cancel reason is set up, so nothing can be cancelled.'));
    return;
  }
  const reason = await promptForChoice(
    translate('Cancel pre-order items'),
    translate('This cancels the {count} items still waiting on future inventory in the selected orders and releases their reservations. This cannot be undone. Why are they cancelled?', countParams(selectedWaitingCount.value)),
    translate('Cancel items'),
    reasons,
  );
  if (!reason) return;
  const { cancelled, failed } = await runBulk(() => cancelPreorderItems(selectedOrders.value, reason));
  await commonUtil.showToast(failed ? translate('{cancelled} items cancelled, {failed} failed.', { cancelled, failed, n: cancelled }) : translate('{cancelled} items cancelled.', { cancelled, count: cancelled }));
  useFutureInventorySearchStore().markStale();
  clearSelection();
  await refresh();
}

function exportSelected() {
  const rows = selectedOrders.value.flatMap((order) => (order.lines || []).map((line) => ({
    orderId: order.orderId,
    orderName: order.orderName,
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
    { key: 'orderId', label: translate('Order ID') }, { key: 'orderName', label: translate('Order name') }, { key: 'orderDate', label: translate('Order date') }, { key: 'status', label: translate('Status') },
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
