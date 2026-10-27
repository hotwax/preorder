<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>{{ translate('Future inventory sync') }}</ion-title>
        <ion-buttons slot="end"
          ><ion-button :disabled="loading || !shopId" :aria-label="translate('Refresh')" @click="load"
            ><ion-icon slot="icon-only" :icon="refreshOutline" /></ion-button
        ></ion-buttons>
      </ion-toolbar>
      <ion-progress-bar v-if="loading" type="indeterminate" />
    </ion-header>
    <ion-content>
      <main class="sync-content">
        <ion-card>
          <ion-card-content class="sync-filters">
            <ion-select
              v-model="shopId"
              :label="translate('Shopify shop')"
              label-placement="stacked"
              fill="outline"
              interface="popover"
              :disabled="!shops.length"
            >
              <ion-select-option v-for="shop in shops" :key="shop.shopId" :value="shop.shopId">{{
                shop.name || shop.shopId
              }}</ion-select-option>
            </ion-select>
            <ion-select
              v-model="kind"
              :label="translate('Activity')"
              label-placement="stacked"
              fill="outline"
              interface="popover"
            >
              <ion-select-option v-for="(label, value) in kindLabels" :key="value" :value="value">{{
                translate(label)
              }}</ion-select-option>
            </ion-select>
          </ion-card-content>
        </ion-card>
        <ErrorState
          v-if="error"
          :title="translate('Could not load sync events')"
          :message="error"
          retryable
          @retry="load"
        />
        <ion-list v-else-if="page">
          <ion-list-header
            ><ion-label
              >{{ translate(kindLabels[kind]) }}
              <p>
                <ion-note>{{ translate('Updated {date}', { date: formatDateTime(page.fetchedAt) }) }}</ion-note>
              </p></ion-label
            ></ion-list-header
          >
          <ion-accordion-group :key="pageKey">
            <ion-accordion v-for="(row, index) in page.rows" :key="index" :value="String(index)">
              <ion-item slot="header">
                <ion-icon
                  slot="start"
                  :icon="kind === 'quantity' || kind === 'activation' ? swapHorizontalOutline : codeSlashOutline"
                />
                <ion-label class="ion-text-wrap">
                  <h2>
                    {{ translate(eventLabels[kind])
                    }}<template v-if="row.computedInventoryChange !== undefined"
                      >: {{ Number(row.computedInventoryChange) > 0 ? '+' : ''
                      }}{{ row.computedInventoryChange }}</template
                    >
                  </h2>
                  <p>
                    {{
                      row.productId
                        ? translate('Product {id}', { id: row.productId })
                        : row.shopifyInventoryItemId
                        ? translate('Inventory item {id}', { id: row.shopifyInventoryItemId })
                        : row.shopifyOwnerId
                        ? translate('Variant {id}', { id: row.shopifyOwnerId })
                        : row.shopifyMetafieldId || row.metafieldId
                    }}
                  </p>
                  <p v-if="row.createdDate">{{ formatDateTime(row.createdDate) }}</p>
                </ion-label>
                <ion-badge slot="end" :color="statusColor(row.systemMessageStatusId || '')">{{
                  row.activationStatus || (kind === 'published' ? translate('Recorded') : deliveryLabel(row))
                }}</ion-badge>
              </ion-item>
              <ion-list slot="content" lines="none" class="event-details">
                <ion-item v-if="row.eventTypeId || row.metafieldPurposeEnumId"
                  ><ion-label class="ion-text-wrap"
                    ><p>{{ translate('Event type') }}</p>
                    {{ row.eventTypeId || row.metafieldPurposeEnumId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.eventReferenceId"
                  ><ion-label
                    ><p>{{ translate('Inventory event reference') }}</p>
                    {{ row.eventReferenceId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.shopifyInventoryItemId"
                  ><ion-label
                    ><p>{{ translate('Shopify inventory item') }}</p>
                    {{ row.shopifyInventoryItemId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.shopifyLocationId"
                  ><ion-label
                    ><p>{{ translate('Shopify location') }}</p>
                    {{ row.shopifyLocationId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.shopifyOwnerId"
                  ><ion-label
                    ><p>{{ translate('Shopify variant') }}</p>
                    {{ row.shopifyOwnerId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.shopifyMetafieldId"
                  ><ion-label
                    ><p>{{ translate('Metafield ID') }}</p>
                    {{ row.shopifyMetafieldId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.facilityId"
                  ><ion-label
                    ><p>{{ translate('Facility') }}</p>
                    {{ seed.facilityName(row.facilityId) }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.systemMessageId || row.lastSystemMessageId"
                  ><ion-label
                    ><p>{{ translate('Delivery message') }}</p>
                    {{ row.systemMessageId || row.lastSystemMessageId }}</ion-label
                  ></ion-item
                >
                <ion-item v-if="row.decisionComment" class="event-reason"
                  ><ion-label class="ion-text-wrap"
                    ><p>{{ translate('Decision') }}</p>
                    {{ row.decisionComment }}</ion-label
                  ></ion-item
                >
              </ion-list>
            </ion-accordion>
          </ion-accordion-group>
          <div v-if="!page.rows?.length" class="empty-state">
            <ion-icon :icon="swapHorizontalOutline" size="large" />
            <h3>{{ translate('No sync activity') }}</h3>
            <p>{{ translate('No records for this shop and page.') }}</p>
          </div>
        </ion-list>
        <div v-else-if="!shopId && !loading" class="empty-state">
          <p>{{ translate('No Shopify shop is connected to the selected store.') }}</p>
        </div>
      </main>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start"
          ><ion-button :disabled="loading || pageIndex === 0" @click="pageIndex--"
            ><ion-icon slot="start" :icon="chevronBackOutline" />{{ translate('Previous') }}</ion-button
          ></ion-buttons
        >
        <ion-title size="small" class="ion-text-center">{{
          translate('Page {page}', { page: pageIndex + 1 })
        }}</ion-title>
        <ion-buttons slot="end"
          ><ion-button :disabled="loading || !page?.hasMore" @click="pageIndex++"
            >{{ translate('Next') }}<ion-icon slot="end" :icon="chevronForwardOutline" /></ion-button
        ></ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonProgressBar,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonCard,
  IonCardContent,
  IonFooter,
  IonIcon,
  IonMenuButton,
  IonNote,
  IonAccordion,
  IonAccordionGroup,
  onIonViewWillEnter,
} from '@ionic/vue';
import { translate } from '@common';
import {
  refreshOutline,
  swapHorizontalOutline,
  codeSlashOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { useLiveEntity, useSeedData } from '@common/db';
import { preorderDb } from '@/db/preorderDb';
import { refreshAfterMutation } from '@/db/appDbSync';
import { useProductStore } from '@/store/productStore';
import ErrorState from '@/components/common/ErrorState.vue';
import { errorMessage } from '@/utils/response';
import { formatDateTime } from '@/utils/format';
import { statusColor } from '@/utils/statusColors';
const store = useProductStore();
const seed = useSeedData();
const shopId = ref('');
const kind = ref('quantity');
const pageIndex = ref(0);
const loading = ref(false);
const error = ref('');
const kindLabels: Record<string, string> = {
  quantity: 'Quantity sync events',
  metafield: 'Metafield sync events',
  published: 'Published metafield mappings',
  activation: 'Product location activation',
};
const eventLabels: Record<string, string> = {
  quantity: 'Quantity adjustment',
  metafield: 'Metafield update',
  published: 'Published metafield',
  activation: 'Location activation',
};
const pageKey = computed(() => `${shopId.value}:${kind.value}:${pageIndex.value}`);
const { records: shops } = useLiveEntity<any>(preorderDb.tables.shopifyShops, () => ({
  equals: { productStoreId: store.getCurrentProductStoreId },
}));
const { first: page } = useLiveEntity<any>(preorderDb.tables.preorderSyncPages, () => ({
  equals: { pageKey: pageKey.value },
}));
watch(
  shops,
  (rows) => {
    if (!rows.some((row) => row.shopId === shopId.value)) shopId.value = rows[0]?.shopId || '';
  },
  { immediate: true }
);
watch([shopId, kind], () => {
  pageIndex.value = 0;
});
watch(pageKey, () => {
  void load();
});
function deliveryLabel(row: any) {
  if (row.confirmedDate) return translate('Confirmed');
  if (row.failed === 'Y') return translate('Failed');
  if (row.systemMessageStatusId) return seed.statusDescription(row.systemMessageStatusId);
  if (row.systemMessageId) return translate('Message history unavailable');
  if (kind.value === 'quantity' && Number(row.computedInventoryChange) === 0) return translate('No quantity change');
  return translate('Pending');
}
async function load() {
  if (!shopId.value) return;
  loading.value = true;
  error.value = '';
  try {
    await refreshAfterMutation('preorderSyncPage', {
      shopId: shopId.value,
      kind: kind.value,
      pageIndex: pageIndex.value,
    });
  } catch (err) {
    error.value = errorMessage(err, translate('Could not load sync events'));
  } finally {
    loading.value = false;
  }
}
onIonViewWillEnter(load);
</script>

<style scoped>
.sync-content {
  max-width: 90rem;
  margin-inline: auto;
}
.sync-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: var(--spacer-sm);
}
.event-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  padding-inline: var(--spacer-sm);
}
.event-reason {
  grid-column: 1 / -1;
}
</style>
