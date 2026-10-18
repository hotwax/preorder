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
      <ErrorState v-if="error" :title="translate('Could not load the batch')" :message="error" retryable @retry="load" />

      <template v-else-if="batch">
        <section class="summary">
          <ion-card>
            <ProductItem :product-id="batch.productId" :product-name="batch.productName" />
            <ion-list lines="none">
              <ion-item>
                <ion-label>{{ translate('Status') }}</ion-label>
                <ion-badge slot="end" :color="statusColor(batch.statusId)">{{ seed.statusDescription(batch.statusId || '') }}</ion-badge>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Type') }}</ion-label>
                <ion-note slot="end">{{ futureInventoryTypeLabel(batch.futureInventoryItemTypeId) }}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Facility') }}</ion-label>
                <ion-note slot="end">{{ batch.facilityName || seed.facilityName(batch.facilityId || '') }}</ion-note>
              </ion-item>
              <ion-item v-if="batch.poId" button :router-link="`/purchase-orders/${encodeURIComponent(batch.poId)}`">
                <ion-label>{{ translate('Purchase order') }}</ion-label>
                <ion-note slot="end">{{ batch.poId }}<template v-if="batch.poItemSeqId">{{ ' / ' + batch.poItemSeqId }}</template></ion-note>
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
            <ion-button fill="clear" :disabled="isFinal || !canUpdate" @click="changeDate">{{ translate('Change promise date') }}</ion-button>
            <ion-button fill="clear" :disabled="isFinal || !canUpdate" @click="adjustQuantity">{{ translate('Adjust quantity') }}</ion-button>
            <ion-button fill="clear" color="danger" :disabled="isFinal || !canUpdate" @click="cancel">{{ translate('Cancel batch') }}</ion-button>
          </ion-card>

          <div class="stats">
            <StatCard :title="translate('Promise date')" :stat="formatDate(batch.promiseDate)" :subtitle="formatRelative(batch.promiseDate)" />
            <StatCard :title="translate('On hand')" :stat="formatQuantity(batch.quantityOnHandTotal)" :subtitle="translate('Supply still to arrive')" />
            <StatCard :title="translate('Available to promise')" :stat="formatQuantity(batch.availableToPromiseTotal)" :subtitle="Number(batch.availableToPromiseTotal) < 0 ? translate('Overcommitted') : translate('Can still be sold')" />
            <StatCard :title="translate('Reserved')" :stat="formatQuantity(batch.reservedQuantity)" :subtitle="translate('Sold before it arrives')" />
          </div>
        </section>

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

        <ion-list v-if="segment === 'lines'">
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
                {{ seed.enumDescription(row.reasonEnumId) }}
                <p>{{ row.description || row.futureInventoryItemDetailId }}</p>
              </ion-label>
            </ion-item>
            <ion-label class="tablet">
              {{ signed(row.quantityOnHandDiff) }}
              <p>{{ translate('On hand') }}</p>
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
              {{ formatDateTime(row.createdDate) }}
              <p>{{ row.changedByUserId || translate('System') }}</p>
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader,
  IonNote, IonPage, IonProgressBar, IonSegment, IonSegmentButton, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { StatCard, translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { useFutureInventoryActions } from '@/composables/useFutureInventoryActions';
import { useUserStore } from '@/store/user';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import ErrorState from '@/components/common/ErrorState.vue';
import ProductItem from '@/components/common/ProductItem.vue';
import { confirmAction, promptForDate, promptForNumber, showToast } from '@/utils';
import { formatDate, formatDateTime, formatRelative, toDateInputValue } from '@/utils/format';
import { formatQuantity, futureInventoryTypeLabel } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';
import type { FutureInventoryBatch } from '@/types';

const props = defineProps<{ futureInventoryItemId: string }>();
const seed = useSeedData();
const userStore = useUserStore();
const { fetchBatch, fetchLedger, fetchWaitingLines, adjustBatch, cancelBatch } = useFutureInventoryActions();

const batch = ref<FutureInventoryBatch>();
const lines = ref<any[]>([]);
const linesTotal = ref(0);
const ledger = ref<any[]>([]);
const ledgerTotal = ref(0);
const loading = ref(false);
const error = ref('');
const segment = ref('lines');

const isFinal = computed(() => ['FUTURE_INV_CANCELLED', 'FUTURE_INV_RECEIVED'].includes(batch.value?.statusId || ''));
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_FI_UPDATE));

const signed = (value: unknown) => {
  const number = Number(value || 0);
  return number > 0 ? `+${formatQuantity(number)}` : formatQuantity(number);
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [batchRow, waiting, entries] = await Promise.all([
      fetchBatch(props.futureInventoryItemId),
      fetchWaitingLines(props.futureInventoryItemId),
      fetchLedger(props.futureInventoryItemId),
    ]);
    batch.value = batchRow;
    lines.value = waiting.rows;
    linesTotal.value = waiting.total;
    ledger.value = entries.rows;
    ledgerTotal.value = entries.total;
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
    await showToast(success);
    await load();
  } catch (err) {
    await showToast(errorMessage(err, translate('The change was not saved.')));
  }
}

async function changeDate() {
  const promiseDate = await promptForDate(
    translate('Change promise date'),
    translate('Waiting pre-orders take the new date, and their customers are emailed where that email is on.'),
    translate('Change date'),
    toDateInputValue(batch.value?.promiseDate),
  );
  if (promiseDate) await run(() => adjustBatch(props.futureInventoryItemId, { promiseDate, description: 'Promise date changed in the Pre-order app' }), translate('Promise date changed.'));
}

async function adjustQuantity() {
  const quantityDiff = await promptForNumber(
    translate('Adjust quantity'),
    translate('Add or remove units from this batch: a negative number removes them. On hand and available to promise change together.'),
    translate('Adjust'),
    '-5',
  );
  if (quantityDiff) await run(() => adjustBatch(props.futureInventoryItemId, { quantityDiff, description: 'Quantity adjusted in the Pre-order app' }), translate('Quantity adjusted.'));
}

async function cancel() {
  const reserved = Number(batch.value?.reservedQuantity || 0);
  const confirmed = await confirmAction(
    translate('Cancel batch'),
    reserved > 0
      ? translate('{reserved} reserved units stay with their orders and need moving to another batch. This cannot be undone.', { reserved: formatQuantity(reserved) })
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
