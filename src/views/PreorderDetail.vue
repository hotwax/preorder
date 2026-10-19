<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/preorders" />
        </ion-buttons>
        <ion-title>{{ order?.orderName || orderId }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load the pre-order')" :message="error" retryable @retry="load" />

      <template v-else-if="order">
        <section class="summary">
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle>{{ translate('Customer') }}</ion-card-subtitle>
              <ion-card-title>{{ order.customerName || order.customerPartyId || translate('Unknown customer') }}</ion-card-title>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item v-if="order.email">
                <ion-label>{{ order.email }}</ion-label>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Ordered') }}</ion-label>
                <ion-note slot="end">{{ formatDateTime(order.orderDate) }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Status') }}</ion-label>
                <ion-badge slot="end" :color="statusColor(order.statusId)">{{ seed.statusDescription(order.statusId || '') }}</ion-badge>
              </ion-item>
              <ion-item v-if="order.salesChannelEnumId">
                <ion-label>{{ translate('Sales channel') }}</ion-label>
                <ion-note slot="end">{{ seed.enumDescription(order.salesChannelEnumId) }}</ion-note>
              </ion-item>
            </ion-list>
          </ion-card>

          <StatCard :title="translate('Current promise date')" :stat="promiseLabel" :subtitle="promiseSubtitle" />
          <StatCard :title="translate('Waiting at parking')" :stat="parkedCount" :subtitle="translate('{count} pre-order items', { count: order.lines.length })" />
        </section>

        <ion-list>
          <ion-list-header>
            <ion-label>{{ translate('Pre-order items') }}</ion-label>
          </ion-list-header>
          <div
            v-for="line in order.lines"
            :key="line.orderItemSeqId"
            class="list-item line-row"
            :role="line.futureInventoryItemId ? 'link' : undefined"
            :tabindex="line.futureInventoryItemId ? 0 : undefined"
            @click="openBatch(line)"
            @keydown.enter.prevent="openBatch(line)"
          >
            <ProductItem :product-id="line.productId" :product-name="line.productName" />

            <ion-label class="tablet">
              <ion-chip :outline="true" :disabled="!line.futureInventoryItemId">
                <ion-icon :icon="layersOutline" />
                <ion-label>{{ line.futureInventoryItemId || translate('No batch') }}</ion-label>
              </ion-chip>
              <p>{{ typeLabel(line.futureInventoryItemTypeId) }}<template v-if="line.poId">{{ ' - ' + line.poId }}</template></p>
            </ion-label>

            <ion-label class="tablet">
              {{ seed.facilityName(line.facilityId || '') }}
              <p v-if="isOpen(line)">{{ line.atParking ? translate('Waiting at parking') : translate('Released from parking') }}</p>
            </ion-label>

            <ion-label class="tablet">
              <ion-badge :color="statusColor(line.itemStatusId)">{{ seed.statusDescription(line.itemStatusId || '') }}</ion-badge>
              <p>{{ line.reservationOpen ? translate('{count} reserved', { count: formatQuantity(line.openQuantity) }) : translate('Reservation closed') }}</p>
            </ion-label>

            <div class="line-row-end">
              <ion-label class="ion-text-end">
                <template v-if="line.promisedDatetime">
                  {{ formatDate(line.promisedDatetime) }}
                  <p>{{ formatRelative(line.promisedDatetime) }}</p>
                </template>
                <ion-note v-else color="danger">{{ translate('No promise date') }}</ion-note>
                <p v-if="line.autoCancelDate">{{ translate('Auto cancels {date}', { date: formatDate(line.autoCancelDate) }) }}</p>
              </ion-label>
              <ion-button
                v-if="line.reservationOpen && line.futureInventoryItemId"
                fill="clear"
                size="small"
                :disabled="!canUpdate"
                @click.stop="openMove(line)"
              >
                {{ translate('Move') }}
              </ion-button>
            </div>
          </div>
          <ion-item v-if="!order.lines.length" lines="none">
            <ion-label>{{ translate('This order has no pre-order items.') }}</ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonContent,
  IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage, IonProgressBar, IonTitle, IonToolbar,
  modalController, onIonViewWillEnter,
} from '@ionic/vue';
import { layersOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { StatCard, translate } from '@common';
import { useSeedData, useProductMaster } from '@common/db';
import { usePreorderActions } from '@/composables/usePreorderActions';
import { useUserStore } from '@/store/user';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import router from '@/router';
import ErrorState from '@/components/common/ErrorState.vue';
import ProductItem from '@/components/common/ProductItem.vue';
import MoveReservationModal from '@/components/preorders/MoveReservationModal.vue';
import { formatDate, formatDateTime, formatRelative } from '@/utils/format';
import { formatDateRange, formatQuantity } from '@/utils/labels';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';
import type { PreorderLine, PreorderOrder } from '@/types';

const props = defineProps<{ orderId: string }>();
const seed = useSeedData();
const { typeLabel } = useFutureInventoryTypes();
const { prefetch } = useProductMaster();
const { fetchPreorder, parkedLines } = usePreorderActions();
const userStore = useUserStore();

const order = ref<PreorderOrder>();
const loading = ref(false);
const error = ref('');
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PREORDER_UPDATE));

const parkedCount = computed(() => (order.value ? parkedLines(order.value).length : 0));
const isOpen = (line: PreorderLine) => !['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'].includes(line.itemStatusId || '');
const promiseLabel = computed(() => formatDateRange(order.value?.earliestPromiseDate, order.value?.latestPromiseDate) || translate('None'));
const promiseSubtitle = computed(() => {
  const date = order.value?.earliestPromiseDate || order.value?.latestPromiseDate;
  return date ? formatRelative(date) : translate('No item has a promise date');
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    order.value = await fetchPreorder(props.orderId);
    void prefetch(order.value.lines.map((line) => line.productId));
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the pre-order.'));
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(load);

function openBatch(line: PreorderLine) {
  if (line.futureInventoryItemId) router.push(`/future-inventory/${encodeURIComponent(line.futureInventoryItemId)}`);
}

async function openMove(line: PreorderLine) {
  const modal = await modalController.create({ component: MoveReservationModal, componentProps: { orderId: props.orderId, line } });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  if (role !== 'confirm') return;
  usePreorderSearchStore().markStale();
  useFutureInventorySearchStore().markStale();
  await load();
}
</script>

<style scoped>
.summary {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  padding: var(--spacer-sm);
}

.summary ion-card {
  margin: 0;
}

.line-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.line-row > ion-label {
  width: 100%;
}

.line-row-end {
  align-items: center;
  display: flex;
  gap: var(--spacer-xs);
}
</style>
