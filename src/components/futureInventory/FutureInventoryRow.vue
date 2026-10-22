<template>
  <div
    class="list-item fi-row"
    :role="selectMode ? 'button' : 'link'"
    tabindex="0"
    @click="emit('activate')"
    @keydown.enter.prevent="emit('activate')"
    @keydown.space.prevent="emit('activate')"
  >
    <ProductItem :product-id="batch.productId" :product-name="batch.productName">
      <template #start>
        <ion-checkbox
          v-if="selectMode"
          slot="start"
          :checked="selected"
          :aria-label="translate('Select batch')"
          @click.stop
          @keydown.stop
          @ion-change="emit('selectionChange', $event.detail.checked)"
        />
      </template>
    </ProductItem>

    <ion-label class="tablet">
      {{ batch.futureInventoryItemId }}
      <p>{{ [typeLabel(batch.futureInventoryItemTypeId), batch.poId].filter(Boolean).join(' - ') }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ seed.facilityName(batch.facilityId || '') }}
      <p><ion-badge :color="statusColor(batch.statusId)">{{ seed.statusDescription(batch.statusId || '') }}</ion-badge></p>
    </ion-label>

    <ion-label class="tablet">
      {{ translate('{qoo} on order', { qoo: formatQuantity(batch.quantityOnOrderTotal) }) }}
      <p>{{ translate('{atp} ATP, {reserved} reserved', { atp: formatQuantity(batch.availableToPromiseTotal), reserved: formatQuantity(batch.reservedQuantity) }) }}</p>
    </ion-label>

    <ion-label class="fi-row-end ion-text-end">
      {{ formatDate(batch.promiseDate) }}
      <p>
        <ion-text :color="batch.statusId === 'FUTURE_INV_ACTIVE' && isPast(batch.promiseDate) ? 'danger' : undefined">{{ formatRelative(batch.promiseDate) }}</ion-text>
      </p>
    </ion-label>
  </div>
</template>

<script setup lang="ts">
import { IonBadge, IonCheckbox, IonLabel, IonText } from '@ionic/vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import ProductItem from '@/components/common/ProductItem.vue';
import { formatDate, formatRelative } from '@/utils/format';
import { formatQuantity, isPast } from '@/utils/labels';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { statusColor } from '@/utils/statusColors';
import type { FutureInventoryBatch } from '@/types';

defineProps<{ batch: FutureInventoryBatch; selectMode?: boolean; selected?: boolean }>();
const emit = defineEmits<{ (event: 'activate'): void; (event: 'selectionChange', selected: boolean): void }>();
const seed = useSeedData();
const { typeLabel } = useFutureInventoryTypes();
</script>

<style scoped>
.fi-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  min-height: 5rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.fi-row > ion-label {
  width: 100%;
}

.fi-row > ion-label.fi-row-end {
  display: block;
  justify-self: end;
  max-width: 10rem;
  min-width: 10rem;
  width: 10rem;
}
</style>
