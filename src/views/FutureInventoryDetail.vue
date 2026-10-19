<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/future-inventory" />
        </ion-buttons>
        <ion-title>{{ futureInventoryItemId }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load the batch')" :message="error" @retry="load" />

      <template v-else-if="batch">
        <section class="summary">
          <ion-card>
            <ProductItem :product-id="batch.productId" :product-name="batch.product?.productName || batch.product?.internalName" />
            <ion-list lines="none">
              <ion-item>
                <ion-label>{{ translate('Status') }}</ion-label>
                <ion-badge slot="end" :color="statusColor(batch.statusId)">{{ seed.statusDescription(batch.statusId || '') }}</ion-badge>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Type') }}</ion-label>
                <ion-note slot="end">{{ typeLabel(batch.futureInventoryItemTypeId) }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Facility') }}</ion-label>
                <ion-note slot="end">{{ seed.facilityName(batch.facilityId || '') }}</ion-note>
              </ion-item>
              <ion-item v-if="batch.poId" button :router-link="`/purchase-orders/${encodeURIComponent(batch.poId)}`">
                <ion-label>
                  {{ translate('Purchase order') }}
                  <p v-if="poItem">{{ translate('Line {seq}, {quantity} ordered', { seq: poItem.orderItemSeqId, quantity: formatQuantity(poItem.quantity) }) }}</p>
                  <p v-if="poItem?.estimatedDeliveryDate">{{ translate('Expected {date}', { date: formatDate(poItem.estimatedDeliveryDate) }) }}</p>
                  <p v-if="po?.statusId">{{ seed.statusDescription(po.statusId) }}</p>
                </ion-label>
                <ion-note slot="end">{{ po?.orderName || po?.externalId || batch.poId }}</ion-note>
              </ion-item>
              <ion-item v-if="batch.shipmentExternalId">
                <ion-label>{{ translate('Inbound shipment') }}</ion-label>
                <ion-note slot="end">{{ batch.shipmentExternalId }}</ion-note>
              </ion-item>
              <ion-item v-if="batch.externalId">
                <ion-label>{{ translate('External ID') }}</ion-label>
                <ion-note slot="end">{{ batch.externalId }}</ion-note>
              </ion-item>
            </ion-list>
            <ion-button fill="clear" :disabled="!!actionsDisabledReason" @click="changeDate">{{ translate('Change promise date') }}</ion-button>
            <ion-button fill="clear" :disabled="!!actionsDisabledReason" @click="adjustQuantity">{{ translate('Adjust quantity') }}</ion-button>
            <ion-button fill="clear" color="danger" :disabled="!!actionsDisabledReason" @click="cancel">{{ translate('Cancel batch') }}</ion-button>
            <ion-item v-if="actionsDisabledReason" lines="none">
              <ion-label class="ion-text-wrap">
                <p>{{ actionsDisabledReason }}</p>
              </ion-label>
            </ion-item>
          </ion-card>

          <div class="stats">
            <StatCard :title="translate('Promise date')" :stat="formatDate(batch.promiseDate)" :subtitle="promiseSubtitle" />
            <StatCard :title="translate('On order')" :stat="formatQuantity(batch.quantityOnOrderTotal)" :subtitle="onOrderCaption" />
            <StatCard :title="translate('Available to promise')" :stat="formatQuantity(batch.availableToPromiseTotal)" :subtitle="availableCaption" />
            <StatCard :title="translate('Reserved')" :stat="formatQuantity(batch.reservedQuantity)" :subtitle="reservedCaption" />
          </div>
        </section>

        <ion-list v-if="batch.demandByFacility?.length">
          <ion-list-header>
            <ion-label>{{ translate('Demand by location') }}</ion-label>
          </ion-list-header>
          <DemandByFacilityItems :rows="batch.demandByFacility" />
        </ion-list>

        <div class="ion-padding-horizontal">
          <ion-segment v-model="segment">
            <ion-segment-button value="lines">
              <ion-label>{{ translate('Waiting orders') }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="ledger">
              <ion-label>{{ translate('Ledger') }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <template v-if="segment === 'lines'">
          <ErrorState v-if="linesError" :title="translate('Could not load the waiting orders')" :message="linesError" @retry="loadLines" />
          <ion-list v-else>
            <ion-list-header>
              <ion-label>{{ translate('{count} orders waiting on this batch', { count: linesTotal }) }}</ion-label>
            </ion-list-header>
            <div
              v-for="line in lines"
              :key="`${line.orderId}-${line.orderItemSeqId}`"
              class="list-item ledger-row"
              role="link"
              tabindex="0"
              @click="router.push(`/preorders/${encodeURIComponent(line.orderId)}`)"
              @keydown.enter.prevent="router.push(`/preorders/${encodeURIComponent(line.orderId)}`)"
            >
              <ion-item lines="none">
                <ion-label>
                  {{ line.customerName || line.orderName || line.orderId }}
                  <p>{{ [line.customerName ? line.orderName : '', line.orderId, line.orderItemSeqId].filter((id) => id && id !== (line.customerName || line.orderName || line.orderId)).join(' - ') }}</p>
                </ion-label>
              </ion-item>
              <ion-label class="tablet">
                {{ seed.facilityName(line.facilityId || '') }}
                <p>{{ translate('Location') }}</p>
              </ion-label>
              <ion-label class="tablet">
                {{ formatDate(line.orderDate) }}
                <p>{{ translate('Ordered') }}</p>
              </ion-label>
              <ion-label class="tablet">
                {{ formatQuantity(line.openQuantity) }}
                <p>{{ translate('Reserved') }}</p>
              </ion-label>
              <ion-label class="ion-text-end">
                {{ formatDate(line.promisedDatetime) || translate('No promise date') }}
                <p>{{ translate('Promise date') }}</p>
              </ion-label>
            </div>
            <ion-item v-if="!lines.length" lines="none">
              <ion-label>{{ translate('No orders are waiting on this batch.') }}</ion-label>
            </ion-item>
            <ion-item v-else-if="linesTotal > lines.length" lines="none">
              <ion-note>{{ translate('Showing the first {shown} of {count}.', { shown: lines.length, count: linesTotal }) }}</ion-note>
            </ion-item>
          </ion-list>
        </template>

        <template v-else>
          <ErrorState v-if="ledgerError" :title="translate('Could not load the ledger')" :message="ledgerError" @retry="loadLedger" />
          <ion-list v-else>
            <ion-list-header>
              <ion-label>{{ translate('{count} ledger entries', { count: ledgerTotal }) }}</ion-label>
            </ion-list-header>
            <div
              v-for="row in ledger"
              :key="row.futureInventoryItemDetailId"
              class="list-item ledger-row"
              :role="row.orderId ? 'link' : undefined"
              :tabindex="row.orderId ? 0 : undefined"
              @click="row.orderId && router.push(`/preorders/${encodeURIComponent(row.orderId)}`)"
              @keydown.enter.prevent="row.orderId && router.push(`/preorders/${encodeURIComponent(row.orderId)}`)"
            >
              <ion-item lines="none">
                <ion-label>
                  {{ shortDescription(seed.enumDescription(row.reasonEnumId)) || row.reasonEnumId }}
                  <p v-if="row.description">{{ readableNote(row.description) }}</p>
                </ion-label>
              </ion-item>
              <ion-label class="tablet">
                {{ signed(row.quantityOnOrderDiff) }}
                <p>{{ translate('On order') }}</p>
              </ion-label>
              <ion-label class="tablet">
                {{ signed(row.availableToPromiseDiff) }}
                <p>{{ translate('ATP') }}</p>
              </ion-label>
              <ion-label class="tablet">
                <template v-if="row.orderId">
                  {{ row.orderId }}
                  <p>{{ translate('Item {seq}', { seq: row.orderItemSeqId }) }}</p>
                </template>
                <template v-else-if="row.promiseDate">
                  {{ formatDate(row.promiseDate) }}
                  <p>{{ translate('Promise date') }}</p>
                </template>
                <template v-else-if="row.facilityId">
                  {{ seed.facilityName(row.facilityId) }}
                  <p>{{ translate('Facility') }}</p>
                </template>
              </ion-label>
              <ion-label class="ion-text-end">
                {{ formatDateTime(row.createdDate || row.createdStamp) }}
                <p>{{ row.changedByUserName || row.changedByUserId || translate('System') }}</p>
              </ion-label>
            </div>
            <ion-item v-if="!ledger.length" lines="none">
              <ion-label>{{ translate('No ledger entries.') }}</ion-label>
            </ion-item>
            <ion-item v-else-if="ledgerTotal > ledger.length" lines="none">
              <ion-note>{{ translate('Showing the latest {shown} of {count}.', { shown: ledger.length, count: ledgerTotal }) }}</ion-note>
            </ion-item>
          </ion-list>
        </template>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader,
  IonNote, IonPage, IonProgressBar, IonSegment, IonSegmentButton, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { commonUtil, StatCard, translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { useFutureInventoryActions } from '@/composables/useFutureInventoryActions';
import { useUserStore } from '@/store/user';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import ErrorState from '@/components/common/ErrorState.vue';
import ProductItem from '@/components/common/ProductItem.vue';
import DemandByFacilityItems from '@/components/preorders/DemandByFacilityItems.vue';
import { usePrompts } from '@/composables/usePrompts';
import { countParams, dayBound, formatDate, formatDateTime, formatQuantity, formatRelativeDay } from '@/utils/format';
import { daysOverdue, overdueLabel, readableNote, shortDescription } from '@/utils/labels';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';
import type { FutureInventoryBatchDetail } from '@/types';

const props = defineProps<{ futureInventoryItemId: string }>();
const seed = useSeedData();
const { confirmAction, promptForDate, promptForNumber } = usePrompts();
const { typeLabel } = useFutureInventoryTypes();
const userStore = useUserStore();
const { fetchBatch, fetchLedger, fetchWaitingLines, updateBatch, cancelBatch } = useFutureInventoryActions();

const batch = ref<FutureInventoryBatchDetail>();
const po = computed(() => batch.value?.purchaseOrderHeader);
const poItem = computed(() => batch.value?.purchaseOrderItem);
const lines = ref<any[]>([]);
const linesTotal = ref(0);
const ledger = ref<any[]>([]);
const ledgerTotal = ref(0);
const loading = ref(false);
const error = ref('');
/** A failed list shows its own error: the batch and the other list still show. */
const linesError = ref('');
const ledgerError = ref('');
const segment = ref('lines');

/** An active batch whose promise date has passed: its supply is late. */
const promiseOverdueDays = computed(() => (batch.value?.statusId === 'FUTURE_INV_ACTIVE' ? daysOverdue(batch.value.promiseDate) : 0));
/** How far off the promise date is: only an active batch is still expected, so a received or cancelled one says nothing of days ahead. */
const promiseSubtitle = computed(() => {
  if (batch.value?.statusId !== 'FUTURE_INV_ACTIVE') return '';
  return promiseOverdueDays.value ? overdueLabel(promiseOverdueDays.value) : formatRelativeDay(batch.value.promiseDate);
});
const isFinal = computed(() => ['FUTURE_INV_CANCELLED', 'FUTURE_INV_RECEIVED'].includes(batch.value?.statusId || ''));
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_FI_UPDATE));
const isReceived = computed(() => batch.value?.statusId === 'FUTURE_INV_RECEIVED');

/** Why the batch actions are off, said under them: a closed batch, or no permission. */
const actionsDisabledReason = computed(() => {
  if (isReceived.value) return translate('A received batch cannot be changed: its stock is in the facility.');
  if (isFinal.value) return translate('A cancelled batch cannot be changed.');
  if (!canUpdate.value) return translate('You do not have permission to change future inventory.');
  return '';
});

const reservedCaption = computed(() => (isReceived.value && Number(batch.value?.reservedQuantity || 0) > 0
  ? translate('Batch received, ready to release')
  : translate('Sold before it arrives')));
const onOrderCaption = computed(() => (isReceived.value ? translate('Received into the facility') : translate('Supply still to arrive')));
const availableCaption = computed(() => {
  if (isFinal.value) return translate('No longer sold as pre-order');
  return Number(batch.value?.availableToPromiseTotal) < 0 ? translate('Overcommitted') : translate('Can still be sold');
});

const signed = (value: unknown) => {
  const number = Number(value || 0);
  return number > 0 ? `+${formatQuantity(number)}` : formatQuantity(number);
};

async function loadLines() {
  linesError.value = '';
  try {
    const waiting = await fetchWaitingLines(props.futureInventoryItemId);
    lines.value = waiting.rows;
    linesTotal.value = waiting.total;
  } catch (err) {
    lines.value = [];
    linesTotal.value = 0;
    linesError.value = errorMessage(err, translate('Failed to load the waiting lines.'));
  }
}

async function loadLedger() {
  ledgerError.value = '';
  try {
    const entries = await fetchLedger(props.futureInventoryItemId);
    ledger.value = entries.rows;
    ledgerTotal.value = entries.total;
  } catch (err) {
    ledger.value = [];
    ledgerTotal.value = 0;
    ledgerError.value = errorMessage(err, translate('Failed to load the ledger.'));
  }
}

/** The batch, and its two lists beside it: a list that fails shows its own error, never hiding the batch. */
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [batchRow] = await Promise.all([fetchBatch(props.futureInventoryItemId), loadLines(), loadLedger()]);
    batch.value = batchRow;
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the batch.'));
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(load);

async function run(action: () => Promise<any>, success: string) {
  try {
    await action();
    useFutureInventorySearchStore().markStale();
    usePreorderSearchStore().markStale();
    await commonUtil.showToast(success);
    await load();
  } catch (err) {
    await commonUtil.showToast(errorMessage(err, translate('The change was not saved.')));
  }
}

async function changeDate() {
  const promiseDate = await promptForDate(
    translate('Change promise date'),
    translate('Waiting pre-orders take the new date, and their customers are emailed where that email is on.'),
    translate('Change date'),
    dayBound(batch.value?.promiseDate, 'start', 'date'),
  );
  if (promiseDate) await run(() => updateBatch(props.futureInventoryItemId, { promiseDate, description: 'Promise date changed in the Pre-order app' }), translate('Promise date changed.'));
}

async function adjustQuantity() {
  const quantityDiff = await promptForNumber(
    translate('Adjust quantity'),
    translate('Add or remove units from this batch: a negative number removes them. On order and available to promise change together.'),
    translate('Adjust'),
    '-5',
  );
  if (quantityDiff) await run(() => updateBatch(props.futureInventoryItemId, { quantityDiff, description: 'Quantity adjusted in the Pre-order app' }), translate('Quantity adjusted.'));
}

async function cancel() {
  const reserved = Number(batch.value?.reservedQuantity || 0);
  const confirmed = await confirmAction(
    translate('Cancel batch'),
    reserved > 0
      ? translate('{reserved} reserved units stay with their orders and need moving to another batch. This cannot be undone.', countParams(reserved, 'reserved'))
      : translate('This cannot be undone.'),
    translate('Cancel batch'),
  );
  if (confirmed) await run(() => cancelBatch(props.futureInventoryItemId, 'Cancelled in the Pre-order app'), translate('Batch cancelled.'));
}
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

.ledger-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.ledger-row > ion-label {
  width: 100%;
}
</style>
