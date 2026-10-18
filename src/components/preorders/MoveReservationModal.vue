<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button :aria-label="translate('Close')" @click="dismiss()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate('Move to another batch') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-progress-bar v-if="loading" type="indeterminate" />
    <ion-list>
      <ion-list-header>
        <ion-label>{{ translate('Active batches of this product') }}</ion-label>
      </ion-list-header>
      <ion-radio-group v-model="selectedId">
        <ion-item v-for="batch in candidates" :key="batch.futureInventoryItemId">
          <ion-radio :value="batch.futureInventoryItemId">
            <ion-label>
              {{ formatDate(batch.promiseDate) }}
              <p>{{ [batch.futureInventoryItemId, batch.facilityName || batch.facilityId, batch.poId].filter(Boolean).join(' - ') }}</p>
              <p>{{ translate('{atp} available to promise, {reserved} reserved', { atp: formatQuantity(batch.availableToPromiseTotal), reserved: formatQuantity(batch.reservedQuantity) }) }}</p>
            </ion-label>
          </ion-radio>
        </ion-item>
      </ion-radio-group>
      <ion-item v-if="loadError" lines="none">
        <ion-label class="ion-text-wrap">{{ loadError }}</ion-label>
        <ion-button slot="end" fill="outline" size="small" @click="loadBatches">{{ translate('Retry') }}</ion-button>
      </ion-item>
      <ion-item v-else-if="!loading && !candidates.length" lines="none">
        <ion-label>{{ translate('No other active batch of this product and type.') }}</ion-label>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-footer>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button fill="solid" :disabled="!selectedId || saving" @click="save">{{ translate('Move reservation') }}</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonProgressBar, IonRadio, IonRadioGroup, IonTitle, IonToolbar, modalController,
} from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';
import { translate } from '@common';
import { useFutureInventoryActions } from '@/composables/useFutureInventoryActions';
import { usePreorderActions } from '@/composables/usePreorderActions';
import { formatDate } from '@/utils/format';
import { formatQuantity } from '@/utils/labels';
import { showToast } from '@/utils';
import { errorMessage } from '@/utils/response';
import type { FutureInventoryBatch, PreorderLine } from '@/types';

const props = defineProps<{ orderId: string; line: PreorderLine }>();
const { fetchActiveBatches } = useFutureInventoryActions();
const { reallocateLine } = usePreorderActions();

const batches = ref<FutureInventoryBatch[]>([]);
const loading = ref(true);
const saving = ref(false);
const selectedId = ref('');

// The target must be another ACTIVE batch of the line's product and FI type (reallocate#'s rule).
const candidates = computed(() => batches.value.filter((batch) =>
  batch.futureInventoryItemId !== props.line.futureInventoryItemId
  && (!props.line.futureInventoryItemTypeId || batch.futureInventoryItemTypeId === props.line.futureInventoryItemTypeId)));

const loadError = ref('');

async function loadBatches() {
  loading.value = true;
  loadError.value = '';
  try {
    batches.value = await fetchActiveBatches(props.line.productId);
  } catch (error) {
    loadError.value = errorMessage(error, translate('Failed to load batches.'));
  } finally {
    loading.value = false;
  }
}

onMounted(loadBatches);

function dismiss(role = 'cancel') {
  modalController.dismiss(null, role);
}

async function save() {
  if (!props.line.futureInventoryItemId) return;
  saving.value = true;
  try {
    await reallocateLine(props.orderId, props.line.orderItemSeqId, props.line.futureInventoryItemId, selectedId.value);
    await showToast(translate('Reservation moved.'));
    dismiss('confirm');
  } catch (error) {
    await showToast(errorMessage(error, translate('Failed to move the reservation.')));
  } finally {
    saving.value = false;
  }
}
</script>
