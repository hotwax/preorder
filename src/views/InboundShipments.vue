<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Inbound shipments') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <SearchFilterCard
        v-model="query"
        :placeholder="translate('Shipment, external ID, purchase order')"
      >
        <UniformFilterLayout @clear="store.clearFilters()">
          <MultiSelectFilter
            v-model="filters.statusId"
            :label="translate('Status')"
            :all-label="translate('All statuses')"
            :options="statusOptions"
          />

          <ion-select v-model="filters.destinationFacilityId" :label="translate('Destination')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All facilities') }}</ion-select-option>
            <ion-select-option v-for="facility in facilityOptions" :key="facility.facilityId" :value="facility.facilityId">
              {{ facility.label }}
            </ion-select-option>
          </ion-select>

          <DateFilterSelect v-model="filters.arrivalDateFrom" :label="translate('Arrival from')" :max="filters.arrivalDateThru" allow-future />
          <DateFilterSelect v-model="filters.arrivalDateThru" :label="translate('Arrival through')" :min="filters.arrivalDateFrom" allow-future />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />

      <ion-card v-if="noStoreFacilities" color="warning">
        <ion-card-content>
          {{ translate('{store} has no facilities assigned, so no inbound shipments are listed. Assign the store its facilities in the Company app to see its own.', { store: storeName }) }}
        </ion-card-content>
      </ion-card>

      <ErrorState v-if="error" :title="translate('Could not load inbound shipments')" :message="error" @retry="refresh()" />

      <ion-list v-else>
        <ion-list-header v-if="results.length" class="results-header">
          <ion-label>{{ translate('{shown} of {count} shipments', { shown: formatNumber(results.length), ...countParams(total) }) }}</ion-label>
          <SortPopover v-model="sort" trigger-id="shipment-sort-trigger" :options="sortOptions" />
        </ion-list-header>
        <InboundShipmentRow
          v-for="shipment in results"
          :key="shipment.shipmentId"
          :shipment="shipment"
          @activate="router.push(`/inbound-shipments/${encodeURIComponent(shipment.shipmentId)}`)"
        />
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !results.length"
        :title="translate('No matching shipments')"
        :message="translate('Inbound shipments are created against purchase orders, by suppliers or by imports. Adjust the search text or filters to broaden the list.')"
      />

      <ion-infinite-scroll :disabled="!hasMore || !!error" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more shipments')" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel, IonList, IonListHeader,
  IonMenuButton, IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { useInboundShipmentSearchStore } from '@/store/inboundShipmentSearch';
import { useProductStore } from '@/store/productStore';
import { useFindSearch } from '@/composables/useFindSearch';
import { useStoreFacilities } from '@/composables/useStoreFacilities';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import MultiSelectFilter from '@/components/common/MultiSelectFilter.vue';
import SortPopover from '@/components/common/SortPopover.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import InboundShipmentRow from '@/components/shipments/InboundShipmentRow.vue';
import { countParams, formatNumber } from '@/utils/format';
import { ALL } from '@/utils/query';

const seed = useSeedData();
const store = useInboundShipmentSearchStore();
const productStore = useProductStore();
const { refresh } = useFindSearch(store, { onStoreChange });
const { query, filters, sort, results, total, loading, loaded, error, hasMore } = storeToRefs(store);

const sortOptions = [
  { label: 'Latest arrival first', value: '-estimatedArrivalDate' },
  { label: 'Soonest arrival first', value: 'estimatedArrivalDate' },
  { label: 'Newest first', value: '-createdDate' },
];
const statusOptions = computed(() => seed.statusItemsByType('PURCH_SHIP_STATUS').map((status: any) => ({ value: status.statusId, label: status.description || status.statusId })));
// Shipments are bound for the store's receiving locations: warehouses and stores, never the virtual parking facilities.
// A store with no facilities has no shipments to list, so the picker offers no facility for it either.
const { facilityOptions, noStoreFacilities } = useStoreFacilities({ fallbackToAll: false });
const storeName = computed(() => (productStore.getCurrentProductStoreId ? seed.productStoreName(productStore.getCurrentProductStoreId) : translate('This store')));

/** A destination filter of the old store's facilities leaves with it. */
function onStoreChange() {
  filters.value.destinationFacilityId = ALL;
}

async function loadMore(event: CustomEvent) {
  await store.appendNextPage();
  (event.target as HTMLIonInfiniteScrollElement).complete();
}
</script>

<style scoped>
.results-header {
  align-items: center;
  display: flex;
  gap: var(--spacer-xs);
}
</style>
