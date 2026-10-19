<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Purchase orders') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <SearchFilterCard
        v-model="query"
        :placeholder="translate('PO, name, external ID')"
        :show-clear="false"
      >
        <UniformFilterLayout @clear="clearFilters">
          <MultiSelectFilter
            v-model="filters.statusId"
            :label="translate('Status')"
            :all-label="translate('All statuses')"
            :options="orderStatusOptions"
          />

          <ion-select v-model="filters.supplierPartyId" :label="translate('Supplier')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All suppliers') }}</ion-select-option>
            <ion-select-option v-for="supplier in suppliers" :key="supplier.partyId" :value="supplier.partyId">{{ supplier.name || supplier.partyId }}</ion-select-option>
          </ion-select>

          <ion-select v-model="filters.facilityId" :label="translate('Destination')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All facilities') }}</ion-select-option>
            <ion-select-option v-for="facility in facilityOptions" :key="facility.facilityId" :value="facility.facilityId">
              {{ facility.facilityName || facility.facilityId }}
            </ion-select-option>
          </ion-select>

          <DateFilterSelect v-model="filters.arrivalDateFrom" :label="translate('Arrival from')" :max="filters.arrivalDateThru" allow-future outlined />
          <DateFilterSelect v-model="filters.arrivalDateThru" :label="translate('Arrival through')" :min="filters.arrivalDateFrom" allow-future outlined />
          <DateFilterSelect v-model="filters.orderDateFrom" :label="translate('Order date from')" :max="filters.orderDateThru" outlined />
          <DateFilterSelect v-model="filters.orderDateThru" :label="translate('Order date through')" :min="filters.orderDateFrom" outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />

      <ErrorState v-if="error" :title="translate('Could not load purchase orders')" :message="error" retryable @retry="refresh()" />

      <ion-list v-else>
        <ion-list-header v-if="results.length" class="results-header">
          <span class="results-header-start">
            <ion-checkbox
              v-if="selectMode"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              :aria-label="translate('Select all loaded purchase orders')"
              @ionChange="toggleAll($event.detail.checked)"
            />
          </span>
          <ion-label>{{ translate('{shown} of {count} purchase orders', { shown: formatNumber(results.length), ...countParams(total) }) }}</ion-label>
          <SortPopover v-model="sort" trigger-id="po-sort-trigger" :options="sortOptions" />
          <ion-button fill="clear" size="small" :disabled="running" @click="toggleSelectMode">
            {{ selectMode ? translate('Done') : translate('Select') }}
          </ion-button>
        </ion-list-header>
        <PurchaseOrderRow
          v-for="order in results"
          :key="order.orderId"
          :order="order"
          :select-mode="selectMode"
          :selected="selectedIds.includes(order.orderId)"
          @activate="activate(order.orderId)"
          @selection-change="setSelected(order.orderId, $event)"
        />
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !results.length"
        :title="translate('No matching purchase orders')"
        :message="translate('Adjust the search text or filters, or create a purchase order.')"
      />

      <ion-infinite-scroll :disabled="!hasMore || !!error" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more purchase orders')" />
      </ion-infinite-scroll>

      <ion-fab v-if="!selectMode && canUpdate" vertical="bottom" horizontal="end" slot="fixed" class="fab-vertical-bottom">
        <ion-fab-button :aria-label="translate('Create purchase order')" router-link="/purchase-orders/create">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-footer v-if="selectMode">
      <ion-toolbar>
        <ion-title size="small">{{ translate('{count} selected', { count: selectedIds.length }) }}</ion-title>
        <ion-buttons slot="end" class="bulk-action-buttons">
          <ion-button fill="outline" :disabled="!selectedWithStatus(['ORDER_CREATED']).length || !canUpdate || running || loading" @click="bulkStatus('ORDER_APPROVED')">{{ translate('Approve') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedOpen.length || !canUpdateFutureInventory || running || loading" @click="changeArrivalDate">{{ translate('Change arrival date') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedOpen.length || !canUpdateFutureInventory || running || loading" @click="sellAsPreorderBulk">{{ translate('Sell as pre-order') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedWithStatus(['ORDER_APPROVED']).length || !canUpdate || running || loading" @click="bulkStatus('ORDER_COMPLETED')">{{ translate('Complete') }}</ion-button>
          <ion-button fill="outline" color="danger" :disabled="!selectedOpen.length || !canUpdate || running || loading" @click="bulkStatus('ORDER_CANCELLED')">{{ translate('Cancel') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedIds.length || loading" @click="exportSelected">{{ translate('Export CSV') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonLabel, IonList, IonListHeader, IonMenuButton, IonPage, IonProgressBar, IonSelect,
  IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { commonUtil, logger, translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { OPEN_PURCHASE_ORDER_STATUSES as OPEN_STATUSES, SOLR_SETTLE_MS, usePurchaseOrderSearchStore } from '@/store/purchaseOrderSearch';
import { useUserStore } from '@/store/user';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';
import { useFindSearch } from '@/composables/useFindSearch';
import { useBulkAction } from '@/composables/useBulkAction';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import MultiSelectFilter from '@/components/common/MultiSelectFilter.vue';
import SortPopover from '@/components/common/SortPopover.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PurchaseOrderRow from '@/components/purchaseOrders/PurchaseOrderRow.vue';
import { usePrompts } from '@/composables/usePrompts';
import { toCsv } from '@/utils/query';
import { downloadText } from '@/utils/download';
import { errorMessage } from '@/utils/response';
import { countParams, formatDate, formatNumber, toMillis } from '@/utils/format';
import Actions from '@/authorization/actions';
import type { PurchaseOrderSummary } from '@/types';

const seed = useSeedData();
const { confirmAction, promptForDate } = usePrompts();
const { running, runBulk } = useBulkAction();
const store = usePurchaseOrderSearchStore();
const { refresh, refreshLater } = useFindSearch(store, { onStoreChange: clearSelection });
const userStore = useUserStore();
const { fetchSuppliers, changeStatus, changeArrivalDate: changeOrderArrivalDate, sellAsPreorder, forEachOrder } = usePurchaseOrderActions();
const { query, filters, sort, results, total, loading, loaded, error, hasMore } = storeToRefs(store);

const sortOptions = [
  { label: 'Soonest arrival', value: 'earliestArrivalDate' },
  { label: 'Newest first', value: '-orderDate' },
  { label: 'Oldest first', value: 'orderDate' },
];
const orderStatusOptions = computed(() => seed.statusItemsByType('ORDER_STATUS').map((status: any) => ({ value: status.statusId, label: status.description || status.statusId })));
const facilityOptions = computed(() => seed.facilities().filter((facility: any) => seed.facilityType(facility.facilityTypeId)?.parentTypeId !== 'VIRTUAL_FACILITY' && facility.facilityTypeId !== 'VIRTUAL_FACILITY'));
const suppliers = ref<{ partyId: string; name: string }[]>([]);
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PO_UPDATE));
// Moving arrival dates and selling as pre-order create or move future inventory: the FI permission, not the PO one
const canUpdateFutureInventory = computed(() => userStore.hasPermission(Actions.APP_FI_UPDATE));

const selectMode = ref(false);
const selectedIds = ref<string[]>([]);
const selectedOrders = computed(() => results.value.filter((order) => selectedIds.value.includes(order.orderId)));
const selectedWithStatus = (statusIds: string[]) => selectedOrders.value.filter((order) => statusIds.includes(order.statusId || '')).map((order) => order.orderId);
const selectedOpen = computed(() => selectedWithStatus(OPEN_STATUSES));
const allSelected = computed(() => results.value.length > 0 && results.value.every((order) => selectedIds.value.includes(order.orderId)));
const someSelected = computed(() => results.value.some((order) => selectedIds.value.includes(order.orderId)));

watch(results, () => {
  const ids = new Set(results.value.map((order) => order.orderId));
  selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
});

onMounted(async () => {
  try {
    suppliers.value = await fetchSuppliers();
  } catch (error) {
    logger.error('Failed to load suppliers', error);
    await commonUtil.showToast(errorMessage(error, translate('Suppliers could not be loaded.')));
  }
});

function activate(orderId: string) {
  if (selectMode.value) setSelected(orderId, !selectedIds.value.includes(orderId));
  else router.push(`/purchase-orders/${encodeURIComponent(orderId)}`);
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

/**
 * Says how a bulk action went, shows its change on the rows it succeeded for at once, and searches again once Solr
 * has the change.
 */
async function report(result: { done: number; failed: number; errors: string[]; succeeded: string[] }, success: string, patch?: (order: PurchaseOrderSummary) => PurchaseOrderSummary | null) {
  await commonUtil.showToast(result.failed ? translate('{done} done, {failed} failed: {errors}', { ...result, errors: result.errors.slice(0, 2).join('; ') }) : success);
  useFutureInventorySearchStore().markStale();
  if (patch) {
    const changed = new Set(result.succeeded);
    store.updateRows((order) => (changed.has(order.orderId) ? patch(order) : order));
  }
  selectMode.value = false;
  selectedIds.value = [];
  refreshLater(SOLR_SETTLE_MS);
}

const STATUS_ACTIONS: Record<string, { header: string; message: string; confirm: string; from: string[]; done: string }> = {
  ORDER_APPROVED: { header: 'Approve purchase orders', message: 'Approve {count} purchase orders?', confirm: 'Approve', from: ['ORDER_CREATED'], done: '{done} purchase orders approved.' },
  ORDER_COMPLETED: { header: 'Complete purchase orders', message: 'Complete {count} purchase orders? Their open lines close, and nothing more is expected against them.', confirm: 'Complete', from: ['ORDER_APPROVED'], done: '{done} purchase orders completed.' },
  ORDER_CANCELLED: { header: 'Cancel purchase orders', message: 'Cancel {count} purchase orders? This cannot be undone.', confirm: 'Cancel orders', from: OPEN_STATUSES, done: '{done} purchase orders cancelled.' },
};

async function bulkStatus(statusId: string) {
  const action = STATUS_ACTIONS[statusId];
  const orderIds = selectedWithStatus(action.from);
  if (!await confirmAction(translate(action.header), translate(action.message, { count: orderIds.length }), translate(action.confirm))) return;
  const result = await runBulk(() => forEachOrder(orderIds, (orderId) => changeStatus(orderId, statusId)));
  const listedStatusIds = filters.value.statusId;
  await report(result, translate(action.done, { done: result.done, count: result.done }), (order) =>
    (listedStatusIds.length && !listedStatusIds.includes(statusId) ? null : { ...order, statusId }));
}

async function changeArrivalDate() {
  const orderIds = [...selectedOpen.value];
  const arrivalDate = await promptForDate(
    translate('Change arrival date'),
    translate('The open lines of {count} purchase orders move to this date. Their future inventory batches and waiting pre-orders follow.', { count: orderIds.length }),
    translate('Change date'),
  );
  if (!arrivalDate) return;
  const result = await runBulk(() => forEachOrder(orderIds, (orderId) => changeOrderArrivalDate(orderId, arrivalDate)));
  const arrivalMillis = toMillis(arrivalDate);
  await report(result, translate('{done} purchase orders now arrive {date}.', { done: result.done, count: result.done, date: formatDate(arrivalDate) }), (order) =>
    ({ ...order, earliestArrivalDate: arrivalMillis, latestArrivalDate: arrivalMillis }));
}

async function sellAsPreorderBulk() {
  const orderIds = [...selectedOpen.value];
  if (!await confirmAction(
    translate('Sell as pre-order'),
    translate('Creates a pre-order future inventory batch for each open line of {count} purchase orders that does not have one, at its arrival date and quantity.', { count: orderIds.length }),
    translate('Create batches'),
  )) return;
  const result = await runBulk(() => forEachOrder(orderIds, (orderId) => sellAsPreorder(orderId)));
  await report(result, translate('Future inventory created for {done} purchase orders.', { done: result.done, count: result.done }));
}

function exportSelected() {
  const rows = selectedOrders.value.map((order) => ({
    ...order,
    facilityName: seed.facilityName(order.facilityId || ''),
    status: seed.statusDescription(order.statusId || ''),
    orderDate: formatDate(order.orderDate),
    earliestArrivalDate: formatDate(order.earliestArrivalDate),
  }));
  downloadText('purchase-orders.csv', toCsv(rows, [
    { key: 'orderId', label: translate('PO') }, { key: 'orderName', label: translate('Name') }, { key: 'externalId', label: translate('External ID') },
    { key: 'supplierName', label: translate('Supplier') }, { key: 'facilityName', label: translate('Destination') }, { key: 'status', label: translate('Status') },
    { key: 'orderDate', label: translate('Order date') }, { key: 'earliestArrivalDate', label: translate('Arrival') }, { key: 'itemCount', label: translate('Lines') },
    { key: 'quantityTotal', label: translate('Units') },
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
