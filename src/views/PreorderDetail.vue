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
      <ErrorState v-if="error" :title="translate('Could not load the pre-order')" :message="error" @retry="load" />

      <template v-else-if="order">
        <section class="summary">
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle>{{ translate('Customer') }}</ion-card-subtitle>
              <ion-card-title>{{ order.customerName || shownPartyId(order.customerPartyId) || translate('Unknown customer') }}</ion-card-title>
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
              <!-- The label above the channel's description, which wraps: a long one in the end slot squeezed the label into broken words -->
              <ion-item v-if="order.salesChannelEnumId">
                <ion-label class="ion-text-wrap">
                  <p class="overline">{{ translate('Sales channel') }}</p>
                  {{ seed.enumDescription(order.salesChannelEnumId) }}
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card>

          <StatCard :title="translate('Current promise date')" :stat="promiseLabel" :subtitle="promiseSubtitle" />
          <StatCard :title="translate('Waiting')" :stat="waitingCount" :subtitle="waitingSubtitle" />
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
              <p v-if="line.readyToRelease"><ion-text color="warning">{{ translate('Batch received, ready to release') }}</ion-text></p>
              <p v-else-if="isOpen(line)">{{ lineWaitLabel(line) }}</p>
            </ion-label>

            <ion-label class="tablet">
              <ion-badge :color="statusColor(line.itemStatusId)">{{ seed.statusDescription(line.itemStatusId || '') }}</ion-badge>
              <p>{{ line.reservationOpen ? translate('{count} reserved', { count: formatQuantity(line.openQuantity) }) : translate('Reservation closed') }}</p>
            </ion-label>

            <div class="line-row-end">
              <ion-label class="ion-text-end">
                <template v-if="line.promisedDatetime">
                  {{ formatDate(line.promisedDatetime) }}
                  <p v-if="lineOverdueDays(line)"><ion-text color="danger">{{ overdueLabel(lineOverdueDays(line)) }}</ion-text></p>
                  <p v-else>{{ formatRelativeDay(line.promisedDatetime) }}</p>
                </template>
                <ion-note v-else color="danger">{{ translate('No promise date') }}</ion-note>
                <p v-if="line.autoCancelDate">{{ translate('Auto cancels {date}', { date: formatDate(line.autoCancelDate) }) }}</p>
              </ion-label>
              <ion-button
                v-if="line.reservationOpen && line.futureInventoryItemId && line.batchStatusId === 'FUTURE_INV_ACTIVE'"
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

        <ion-list v-if="historyLines.length">
          <ion-list-header>
            <ion-label>{{ translate('Reservation history') }}</ion-label>
          </ion-list-header>
          <ion-accordion-group multiple>
            <ion-accordion v-for="line in historyLines" :key="line.orderItemSeqId" :value="line.orderItemSeqId">
              <ion-item slot="header">
                <ion-label>
                  {{ primaryId(getProduct(line.productId), [line.productName, line.productId]) }}
                  <p>{{ translate('Item {seq}', { seq: line.orderItemSeqId }) }}</p>
                </ion-label>
                <ion-note slot="end">{{ translate('{count} reservations', countParams(line.reservations?.length)) }}</ion-note>
              </ion-item>
              <ion-list slot="content" lines="none">
                <ion-item
                  v-for="(row, index) in reservationHistory(line)"
                  :key="`${row.futureInventoryItemId}-${row.reasonEnumId}-${index}`"
                  button
                  :detail="false"
                  @click="openBatchById(row.futureInventoryItemId)"
                >
                  <ion-label>
                    {{ reasonLabel(row.reasonEnumId) }}
                    <p>{{ formatDateTime(row.createdDate) }}</p>
                  </ion-label>
                  <ion-badge v-if="row.open" slot="end" color="success">{{ translate('Open') }}</ion-badge>
                  <ion-label slot="end" class="ion-text-end">
                    {{ formatQuantity(row.quantity) }}
                    <p>{{ row.futureInventoryItemId }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-accordion>
          </ion-accordion-group>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAccordion, IonAccordionGroup, IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonContent,
  IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage, IonProgressBar, IonText, IonTitle, IonToolbar,
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
import { countParams, formatDate, formatDateTime, formatQuantity, formatRelativeDay, toMillis } from '@/utils/format';
import { daysOverdue, formatDateRange, overdueLabel, shortDescription, shownPartyId } from '@/utils/labels';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { useParkingFacilities } from '@/composables/useParkingFacilities';
import { useProductIdentity } from '@/composables/useProductIdentity';
import { waitingFacilityIds, waitingLines } from '@/utils/preorderLines';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';
import type { PreorderLine, PreorderOrder } from '@/types';

const props = defineProps<{ orderId: string }>();
const seed = useSeedData();
const { typeLabel } = useFutureInventoryTypes();
const { prefetch, getProduct } = useProductMaster();
const { primaryId } = useProductIdentity();
const { fetchPreorder } = usePreorderActions();
const { shape } = useParkingFacilities();
const userStore = useUserStore();

const order = ref<PreorderOrder>();
const loading = ref(false);
const error = ref('');
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PREORDER_UPDATE));

/** The items still waiting: those holding an open reservation, at any facility. The list below keeps every item the order reserved. */
const waitingCount = computed(() => order.value?.openLineCount ?? (order.value ? waitingLines(order.value).length : 0));
/** Where they wait, by facility name. */
const waitingSubtitle = computed(() => {
  const places = order.value ? waitingFacilityIds(order.value).map((facilityId) => seed.facilityName(facilityId)).join(', ') : '';
  return places ? translate('At {facilities}', { facilities: places }) : translate('No item is waiting on future inventory');
});
const isOpen = (line: PreorderLine) => !['ITEM_CANCELLED', 'ITEM_COMPLETED', 'ITEM_REJECTED'].includes(line.itemStatusId || '');
/** Where an open line stands: waiting on future inventory (at parking, or at the warehouse a rule routed it to), committed to stock, or released. */
const lineWaitLabel = (line: PreorderLine) => {
  if (line.reservationOpen) return line.atParking ? translate('Waiting at parking') : translate('Waiting on future inventory');
  if (line.committed) return translate('Committed to stock');
  return line.atParking ? translate('Waiting at parking') : translate('Released from parking');
};
/** An open line whose promise date has passed: the customer is waiting past it. */
const lineOverdueDays = (line: PreorderLine) => (isOpen(line) ? daysOverdue(line.promisedDatetime) : 0);
const promiseLabel = computed(() => formatDateRange(order.value?.earliestPromiseDate, order.value?.latestPromiseDate) || translate('None'));
const promiseSubtitle = computed(() => {
  const date = order.value?.earliestPromiseDate || order.value?.latestPromiseDate;
  if (!date) return translate('No item has a promise date');
  const overdue = daysOverdue(date);
  return overdue ? overdueLabel(overdue) : formatRelativeDay(date);
});

/** The lines that have a reservation ledger, the history the list above does not show. */
const historyLines = computed(() => (order.value?.lines || []).filter((line) => line.reservations?.length));
/** A line's ledger, newest first. */
const reservationHistory = (line: PreorderLine) => [...(line.reservations || [])]
  .sort((a, b) => (toMillis(b.createdDate) ?? 0) - (toMillis(a.createdDate) ?? 0));
/** Why a reservation changed, by the reason enum's short name. */
const reasonLabel = (reasonEnumId: string) => shortDescription(seed.enumDescription(reasonEnumId)) || reasonEnumId;

async function load() {
  loading.value = true;
  error.value = '';
  try {
    order.value = shape(await fetchPreorder(props.orderId));
    void prefetch(order.value.lines.map((line) => line.productId));
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the pre-order.'));
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(load);

function openBatchById(futureInventoryItemId?: string) {
  if (futureInventoryItemId) router.push(`/future-inventory/${encodeURIComponent(futureInventoryItemId)}`);
}

function openBatch(line: PreorderLine) {
  openBatchById(line.futureInventoryItemId);
}

async function openMove(line: PreorderLine) {
  const modal = await modalController.create({ component: MoveReservationModal, componentProps: { orderId: props.orderId, productStoreId: order.value?.productStoreId, line } });
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
