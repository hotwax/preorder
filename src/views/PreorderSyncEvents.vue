<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ translate('Future inventory sync') }}</ion-title><ion-buttons slot="end"><ion-button :disabled="loading || !shopId" @click="load">{{ translate('Refresh') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ion-list>
        <ion-item><ion-select v-model="shopId" :label="translate('Shopify shop')" interface="popover"><ion-select-option v-for="shop in shops" :key="shop.shopId" :value="shop.shopId">{{ shop.name || shop.shopId }}</ion-select-option></ion-select></ion-item>
        <ion-item><ion-select v-model="kind" :label="translate('Show')" interface="popover"><ion-select-option value="quantity">{{ translate('Quantity sync events') }}</ion-select-option><ion-select-option value="metafield">{{ translate('Metafield sync events') }}</ion-select-option><ion-select-option value="published">{{ translate('Published metafield mappings') }}</ion-select-option><ion-select-option value="activation">{{ translate('Product location activation') }}</ion-select-option></ion-select></ion-item>
      </ion-list>
      <ErrorState v-if="error" :title="translate('Could not load sync events')" :message="error" retryable @retry="load" />
      <ion-list v-else-if="page">
        <ion-list-header><ion-label>{{ translate('Page {page}', { page: pageIndex + 1 }) }} — {{ formatDateTime(page.fetchedAt) }}</ion-label></ion-list-header>
        <ion-item v-for="(row, index) in page.rows" :key="index">
          <ion-label class="ion-text-wrap">
            <h2>{{ row.eventTypeId || row.metafieldPurposeEnumId || row.productId }}</h2>
            <p v-if="row.eventReferenceId">{{ translate('Future inventory event') }}: {{ row.eventReferenceId }}</p>
            <p v-if="row.shopifyInventoryItemId">{{ translate('Shopify inventory item') }}: {{ row.shopifyInventoryItemId }} — {{ translate('Location') }}: {{ row.shopifyLocationId }}</p>
            <p v-if="row.shopifyOwnerId">{{ translate('Shopify variant') }}: {{ row.shopifyOwnerId }}</p>
            <p v-if="row.shopifyMetafieldId">{{ translate('Metafield ID') }}: {{ row.shopifyMetafieldId }}</p>
            <p v-if="row.facilityId">{{ translate('Facility') }}: {{ seed.facilityName(row.facilityId) }}</p>
            <p v-if="row.computedInventoryChange !== undefined">{{ translate('Quantity') }}: {{ row.computedInventoryChange }}</p>
            <p v-if="row.decisionComment">{{ row.decisionComment }}</p>
            <p v-if="row.systemMessageId || row.lastSystemMessageId">{{ translate('Delivery message') }}: {{ row.systemMessageId || row.lastSystemMessageId }}</p>
            <p v-if="row.createdDate">{{ formatDateTime(row.createdDate) }}</p>
          </ion-label>
          <ion-badge slot="end" :color="statusColor(row.systemMessageStatusId || '')">{{ row.activationStatus || (kind === 'published' ? translate('Recorded') : deliveryLabel(row)) }}</ion-badge>
        </ion-item>
        <ion-item v-if="!page.rows?.length"><ion-label>{{ translate('No records for this shop and page.') }}</ion-label></ion-item>
      </ion-list>
      <ion-button fill="clear" :disabled="loading || pageIndex === 0" @click="pageIndex--">{{ translate('Previous') }}</ion-button>
      <ion-button fill="clear" :disabled="loading || !page?.hasMore" @click="pageIndex++">{{ translate('Next') }}</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonProgressBar, IonList, IonListHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonBadge, onIonViewWillEnter } from '@ionic/vue';
import { translate } from '@common';
import { useLiveEntity, useSeedData } from '@common/db';
import { preorderDb } from '@/db/preorderDb';
import { refreshAfterMutation } from '@/db/appDbSync';
import { useProductStore } from '@/store/productStore';
import ErrorState from '@/components/common/ErrorState.vue';
import { errorMessage } from '@/utils/response';
import { formatDateTime } from '@/utils/format';
import { statusColor } from '@/utils/statusColors';
const store = useProductStore(); const seed = useSeedData();
const shopId = ref(''); const kind = ref('quantity'); const pageIndex = ref(0); const loading = ref(false); const error = ref('');
const pageKey = computed(() => `${shopId.value}:${kind.value}:${pageIndex.value}`);
const { records: shops } = useLiveEntity<any>(preorderDb.tables.shopifyShops, () => ({ equals: { productStoreId: store.getCurrentProductStoreId } }));
const { first: page } = useLiveEntity<any>(preorderDb.tables.preorderSyncPages, () => ({ equals: { pageKey: pageKey.value } }));
watch(shops, rows => { if (!rows.some(row => row.shopId === shopId.value)) shopId.value = rows[0]?.shopId || ''; }, { immediate: true });
watch([shopId, kind], () => { pageIndex.value = 0; });
watch(pageKey, () => { void load(); });
function deliveryLabel(row: any) {
  if (row.systemMessageStatusId) return seed.statusDescription(row.systemMessageStatusId);
  if (row.systemMessageId) return translate('Message history unavailable');
  if (kind.value === 'quantity' && Number(row.computedInventoryChange) === 0) return translate('No quantity change');
  return translate('Pending');
}
async function load() {
  if (!shopId.value) return;
  loading.value = true; error.value = '';
  try { await refreshAfterMutation('preorderSyncPage', { shopId: shopId.value, kind: kind.value, pageIndex: pageIndex.value }); }
  catch (err) { error.value = errorMessage(err, translate('Could not load sync events')); }
  finally { loading.value = false; }
}
onIonViewWillEnter(load);
</script>
