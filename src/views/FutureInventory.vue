<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Future inventory') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <SearchFilterCard
        v-model="query"
        :placeholder="translate('Batch, product, PO, external ID')"
        :show-clear="false"
      >
        <UniformFilterLayout @clear="clearFilters">
          <MultiSelectFilter
            v-model="filters.statusId"
            :label="translate('Status')"
            :all-label="translate('All statuses')"
            :options="statusOptions"
          />

          <ion-select v-model="filters.futureInventoryItemTypeId" :label="translate('Type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All types') }}</ion-select-option>
            <ion-select-option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</ion-select-option>
          </ion-select>

          <ion-select v-model="filters.facilityId" :label="translate('Facility')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All facilities') }}</ion-select-option>
            <ion-select-option v-for="facility in facilityOptions" :key="facility.facilityId" :value="facility.facilityId">
              {{ facility.facilityName || facility.facilityId }}
            </ion-select-option>
          </ion-select>

          <ion-select v-model="reservationFilter" :label="translate('Reservations')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All batches') }}</ion-select-option>
            <ion-select-option value="hasReservations">{{ translate('Has reservations') }}</ion-select-option>
            <ion-select-option value="overcommitted">{{ translate('Overcommitted') }}</ion-select-option>
          </ion-select>

          <DateFilterSelect v-model="filters.promiseDateFrom" :label="translate('Promise date from')" :max="filters.promiseDateThru" allow-future outlined />
          <DateFilterSelect v-model="filters.promiseDateThru" :label="translate('Promise date through')" :min="filters.promiseDateFrom" allow-future outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />

      <ion-card v-if="extras.storeScope === 'NO_STORE_FACILITIES'" color="warning">
        <ion-card-content>
          {{ translate('{store} has no facilities assigned, so this shows batches at every facility. Assign the store its facilities in the Company app to see only its own.', { store: storeName }) }}
        </ion-card-content>
      </ion-card>

      <ErrorState v-if="error" :title="translate('Could not load future inventory')" :message="error" retryable @retry="refresh()" />

      <ion-list v-else>
        <ion-list-header v-if="results.length" class="results-header">
          <span class="results-header-start">
            <ion-checkbox
              v-if="selectMode"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              :aria-label="translate('Select all loaded batches')"
              @ionChange="toggleAll($event.detail.checked)"
            />
          </span>
          <ion-label>{{ translate('{shown} of {count} batches', { shown: results.length, count: total }) }}</ion-label>
          <SortPopover v-model="sort" trigger-id="fi-sort-trigger" :options="sortOptions" />
          <ion-button fill="clear" size="small" :disabled="running" @click="toggleSelectMode">
            {{ selectMode ? translate('Done') : translate('Select') }}
          </ion-button>
        </ion-list-header>
        <FutureInventoryRow
          v-for="batch in results"
          :key="batch.futureInventoryItemId"
          :batch="batch"
          :select-mode="selectMode"
          :selected="selectedIds.includes(batch.futureInventoryItemId)"
          @activate="activate(batch.futureInventoryItemId)"
          @selection-change="setSelected(batch.futureInventoryItemId, $event)"
        />
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !results.length"
        :title="translate('No matching batches')"
        :message="translate('Future inventory batches come from purchase orders, inbound shipments and future inventory imports. Adjust the search text or filters to broaden the list.')"
      />

      <ion-infinite-scroll :disabled="!hasMore || !!error" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more batches')" />
      </ion-infinite-scroll>
    </ion-content>

    <ion-footer v-if="selectMode">
      <ion-toolbar>
        <ion-title size="small">{{ translate('{count} selected', { count: selectedIds.length }) }}</ion-title>
        <ion-buttons slot="end" class="bulk-action-buttons">
          <ion-button fill="outline" :disabled="!selectedOpenIds.length || !canUpdate || running || loading" @click="changePromiseDate">{{ translate('Change promise date') }}</ion-button>
          <ion-button fill="outline" color="danger" :disabled="!selectedOpenIds.length || !canUpdate || running || loading" @click="cancelBatches">{{ translate('Cancel batch') }}</ion-button>
          <ion-button fill="outline" :disabled="!selectedIds.length || loading" @click="exportSelected">{{ translate('Export CSV') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCheckbox, IonContent, IonFooter, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent,
  IonLabel, IonList, IonListHeader, IonMenuButton, IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { useUserStore } from '@/store/user';
import { useProductStore } from '@/store/productStore';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useFutureInventoryActions } from '@/composables/useFutureInventoryActions';
import { useFindSearch } from '@/composables/useFindSearch';
import { useBulkAction } from '@/composables/useBulkAction';
import { useStoreFacilities } from '@/composables/useStoreFacilities';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import MultiSelectFilter from '@/components/common/MultiSelectFilter.vue';
import SortPopover from '@/components/common/SortPopover.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import FutureInventoryRow from '@/components/futureInventory/FutureInventoryRow.vue';
import { confirmAction, promptForDate, showToast } from '@/utils';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { ALL, toCsv } from '@/utils/query';
import { downloadText } from '@/utils/download';
import { formatDate, formatQuantity } from '@/utils/format';
import Actions from '@/authorization/actions';

const FINAL_STATUSES = ['FUTURE_INV_CANCELLED', 'FUTURE_INV_RECEIVED'];

const seed = useSeedData();
const { running, runBulk } = useBulkAction();
const { typeLabel, typeOptions } = useFutureInventoryTypes();
const productStore = useProductStore();
const store = useFutureInventorySearchStore();
const { refresh } = useFindSearch(store, { onStoreChange });
const userStore = useUserStore();
const { updateBatch, cancelBatch, forEachBatch } = useFutureInventoryActions();
const { query, filters, sort, results, total, loading, loaded, error, hasMore, extras } = storeToRefs(store);
const storeName = computed(() => (productStore.getCurrentProductStoreId ? seed.productStoreName(productStore.getCurrentProductStoreId) : translate('This store')));

const sortOptions = [
  { label: 'Soonest promise date', value: 'promiseDate' },
  { label: 'Latest promise date', value: '-promiseDate' },
  { label: 'Recently updated', value: '-lastUpdatedStamp' },
];
const statusOptions = computed(() => seed.statusItemsByType('FII_STATUS').map((status: any) => ({ value: status.statusId, label: status.description || status.statusId })));
// Batches sit at the store's receiving locations: warehouses and stores, never the virtual parking facilities.
const { facilityOptions } = useStoreFacilities();
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_FI_UPDATE));

/** The two reservation flags as one select, since they don't combine usefully. */
const reservationFilter = computed({
  get: () => (filters.value.overcommitted ? 'overcommitted' : filters.value.hasReservations ? 'hasReservations' : 'All'),
  set: (value: string) => {
    filters.value.hasReservations = value === 'hasReservations';
    filters.value.overcommitted = value === 'overcommitted';
  },
});

const selectMode = ref(false);
const selectedIds = ref<string[]>([]);
const selectedBatches = computed(() => results.value.filter((batch) => selectedIds.value.includes(batch.futureInventoryItemId)));
const selectedOpenIds = computed(() => selectedBatches.value.filter((batch) => !FINAL_STATUSES.includes(batch.statusId || '')).map((batch) => batch.futureInventoryItemId));
const allSelected = computed(() => results.value.length > 0 && results.value.every((batch) => selectedIds.value.includes(batch.futureInventoryItemId)));
const someSelected = computed(() => results.value.some((batch) => selectedIds.value.includes(batch.futureInventoryItemId)));

watch(results, () => {
  const ids = new Set(results.value.map((batch) => batch.futureInventoryItemId));
  selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
});


function activate(id: string) {
  if (selectMode.value) setSelected(id, !selectedIds.value.includes(id));
  else router.push(`/future-inventory/${encodeURIComponent(id)}`);
}

function setSelected(id: string, checked: boolean) {
  const next = new Set(selectedIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? results.value.map((batch) => batch.futureInventoryItemId) : [];
}

/** Another store's batches leave with their selection, and a facility filter of the old store's facilities with them. */
function onStoreChange() {
  clearSelection();
  filters.value.facilityId = ALL;
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

async function finish(message: string) {
  usePreorderSearchStore().markStale();
  await showToast(message);
  selectMode.value = false;
  selectedIds.value = [];
  await refresh();
}

async function changePromiseDate() {
  const ids = [...selectedOpenIds.value];
  const promiseDate = await promptForDate(
    translate('Change promise date'),
    translate('The {count} batches move to this date. Waiting pre-orders take the new date, and their customers are emailed where that email is on.', { count: ids.length }),
    translate('Change date'),
  );
  if (!promiseDate) return;
  const { done, failed } = await runBulk(() => forEachBatch(ids, (id) => updateBatch(id, { promiseDate, description: 'Promise date changed in the Pre-order app' })));
  await finish(failed ? translate('{done} batches moved, {failed} failed.', { done, failed }) : translate('{done} batches moved to {date}.', { done, count: done, date: formatDate(promiseDate) }));
}

async function cancelBatches() {
  const ids = [...selectedOpenIds.value];
  const reserved = selectedBatches.value.filter((batch) => ids.includes(batch.futureInventoryItemId)).reduce((sum, batch) => sum + Number(batch.reservedQuantity || 0), 0);
  const confirmed = await confirmAction(
    translate('Cancel batch'),
    reserved > 0
      ? translate('This cancels {count} batches. {reserved} reserved units stay with their orders and need moving to another batch.', { count: ids.length, reserved: formatQuantity(reserved) })
      : translate('This cancels {count} batches. This cannot be undone.', { count: ids.length }),
    translate('Cancel batches'),
  );
  if (!confirmed) return;
  const { done, failed } = await runBulk(() => forEachBatch(ids, (id) => cancelBatch(id, 'Cancelled in the Pre-order app')));
  await finish(failed ? translate('{done} batches cancelled, {failed} failed.', { done, failed }) : translate('{done} batches cancelled.', { done, count: done }));
}

function exportSelected() {
  const rows = selectedBatches.value.map((batch) => ({
    ...batch,
    facilityName: seed.facilityName(batch.facilityId || ''),
    type: typeLabel(batch.futureInventoryItemTypeId),
    status: seed.statusDescription(batch.statusId || ''),
    promiseDate: formatDate(batch.promiseDate),
  }));
  downloadText('future-inventory.csv', toCsv(rows, [
    { key: 'futureInventoryItemId', label: 'Batch' }, { key: 'productId', label: 'Product ID' }, { key: 'productName', label: 'Product' },
    { key: 'type', label: 'Type' }, { key: 'facilityName', label: 'Facility' }, { key: 'poId', label: 'PO' },
    { key: 'promiseDate', label: 'Promise date' }, { key: 'quantityOnHandTotal', label: 'On hand' },
    { key: 'availableToPromiseTotal', label: 'ATP' }, { key: 'reservedQuantity', label: 'Reserved' }, { key: 'status', label: 'Status' },
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
