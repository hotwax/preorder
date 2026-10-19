<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/inbound-shipments" />
        </ion-buttons>
        <ion-title>{{ shipment?.externalId || shipmentId }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load the shipment')" :message="error" @retry="load" />

      <template v-else-if="shipment">
        <section class="summary">
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle v-if="shipment.externalId">{{ shipment.shipmentId }}</ion-card-subtitle>
              <ion-card-title>{{ seed.facilityName(shipment.destinationFacilityId || '') }}</ion-card-title>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item>
                <ion-label>{{ translate('Status') }}</ion-label>
                <ion-badge slot="end" :color="statusColor(shipment.statusId)">{{ seed.statusDescription(shipment.statusId || '') }}</ion-badge>
              </ion-item>
              <ion-item v-if="shipment.primaryOrderId" button :router-link="`/purchase-orders/${encodeURIComponent(shipment.primaryOrderId)}`">
                <ion-label>{{ translate('Purchase order') }}</ion-label>
                <ion-note slot="end">{{ shipment.orderName || shipment.orderExternalId || shipment.primaryOrderId }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Shipped') }}</ion-label>
                <ion-note slot="end">{{ formatDate(shipment.estimatedShipDate) || '-' }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Created') }}</ion-label>
                <ion-note slot="end">{{ formatDateTime(shipment.createdDate) }}</ion-note>
              </ion-item>
            </ion-list>
          </ion-card>
          <div class="stats">
            <StatCard :title="translate('Estimated arrival')" :stat="formatDate(shipment.estimatedArrivalDate) || '-'" :subtitle="arrivalSubtitle" />
            <StatCard :title="translate('Shipped')" :stat="formatQuantity(shipment.quantityTotal)" :subtitle="translate('{count} items', { count: shipment.items.length })" />
            <StatCard :title="translate('Received')" :stat="formatQuantity(shipment.receivedQuantity)" :subtitle="Number(shipment.rejectedQuantity) > 0 ? translate('{count} rejected', countParams(shipment.rejectedQuantity)) : translate('{count} receipts', { count: shipment.receipts.length })" />
          </div>
        </section>

        <ion-list>
          <ion-list-header>
            <ion-label>{{ translate('Items') }}</ion-label>
          </ion-list-header>
          <div v-for="item in shipment.items" :key="item.shipmentItemSeqId" class="list-item shipment-item-row">
            <ProductItem :product-id="item.productId" :product-name="item.productName" />
            <ion-label class="tablet">
              {{ formatQuantity(item.quantity) }}
              <p>{{ translate('Shipped') }}</p>
            </ion-label>
            <ion-label class="ion-text-end">
              {{ formatQuantity(item.receivedQuantity) }}
              <p>{{ translate('Received') }}</p>
              <p v-if="Number(item.rejectedQuantity) > 0"><ion-text color="danger">{{ translate('{count} rejected', countParams(item.rejectedQuantity)) }}</ion-text></p>
            </ion-label>
          </div>
          <ion-item v-if="!shipment.items.length" lines="none">
            <ion-label>{{ translate('This shipment has no items.') }}</ion-label>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>{{ translate('Receipts') }}</ion-label>
          </ion-list-header>
          <ion-item v-for="receipt in shipment.receipts" :key="receipt.receiptId">
            <ion-label>
              {{ primaryIdentifier(receipt.productId) || receipt.productId }}
              <p>{{ [receipt.receiptId, receipt.receivedByUserLoginId].filter(Boolean).join(' - ') }}</p>
            </ion-label>
            <ion-note slot="end">{{ translate('{accepted} accepted, {rejected} rejected', { accepted: formatQuantity(receipt.quantityAccepted), rejected: formatQuantity(receipt.quantityRejected) }) }}</ion-note>
            <ion-note slot="end">{{ formatDateTime(receipt.datetimeReceived) }}</ion-note>
          </ion-item>
          <ion-item v-if="!shipment.receipts.length" lines="none">
            <ion-label>{{ translate('Nothing received yet.') }}</ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonBadge, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem,
  IonLabel, IonList, IonListHeader, IonNote, IonPage, IonProgressBar, IonText, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { StatCard, translate } from '@common';
import { useSeedData } from '@common/db';
import { useInboundShipments } from '@/composables/useInboundShipments';
import { useProductIdentity } from '@/composables/useProductIdentity';
import ErrorState from '@/components/common/ErrorState.vue';
import ProductItem from '@/components/common/ProductItem.vue';
import { countParams, formatDate, formatDateTime, formatQuantity, formatRelativeDay } from '@/utils/format';
import { daysOverdue, overdueLabel } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import type { InboundShipmentDetail } from '@/types';

const props = defineProps<{ shipmentId: string }>();
const seed = useSeedData();
const { primaryIdentifier } = useProductIdentity();
const { fetchShipment } = useInboundShipments();

const shipment = ref<InboundShipmentDetail>();
const loading = ref(false);
const error = ref('');
/** A received or cancelled shipment is no longer on its way: it says nothing of days ahead or late. */
const isClosed = computed(() => ['PURCH_SHIP_RECEIVED', 'PURCH_SHIP_CANCELLED'].includes(shipment.value?.statusId || ''));
/** A shipment still on its way whose arrival date has passed. */
const arrivalOverdueDays = computed(() => (isClosed.value ? 0 : daysOverdue(shipment.value?.estimatedArrivalDate)));
const arrivalSubtitle = computed(() => {
  if (isClosed.value) return '';
  return arrivalOverdueDays.value ? overdueLabel(arrivalOverdueDays.value) : formatRelativeDay(shipment.value?.estimatedArrivalDate);
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    shipment.value = await fetchShipment(props.shipmentId);
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the shipment.'));
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(load);
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

.shipment-item-row {
  --columns-desktop: 3;
  --columns-tablet: 3;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.shipment-item-row > ion-label {
  width: 100%;
}
</style>
