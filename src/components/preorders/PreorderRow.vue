<template>
  <div
    class="list-item preorder-row"
    :role="selectMode ? 'button' : 'link'"
    tabindex="0"
    @click="emit('activate')"
    @keydown.enter.prevent="emit('activate')"
    @keydown.space.prevent="emit('activate')"
  >
    <ion-item lines="none">
      <ion-checkbox
        v-if="selectMode"
        slot="start"
        :checked="selected"
        :aria-label="translate('Select order')"
        @click.stop
        @keydown.stop
        @ion-change="emit('selectionChange', $event.detail.checked)"
      />
      <ion-label>
        {{ order.orderName || order.externalId || order.orderId }}
        <p>{{ identityLabel }}</p>
      </ion-label>
    </ion-item>

    <ion-label class="tablet">
      {{ translate('{count} pre-order items', { count: summary.lineCount }) }}
      <p>{{ translate('{count} at parking', { count: summary.parkedLineCount }) }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ typeLabel }}
      <p v-if="order.salesChannelEnumId">{{ seed.enumDescription(order.salesChannelEnumId) }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ formatDate(order.orderDate) }}
      <p v-if="order.orderDate">{{ translate('Ordered {age}', { age: formatRelative(order.orderDate) }) }}</p>
    </ion-label>

    <ion-label class="preorder-row-end ion-text-end">
      <template v-if="summary.earliestPromiseDate || summary.latestPromiseDate">
        {{ formatDateRange(summary.earliestPromiseDate, summary.latestPromiseDate) }}
        <p>{{ translate('Promised {age}', { age: formatRelative(summary.earliestPromiseDate || summary.latestPromiseDate) }) }}</p>
      </template>
      <ion-note v-else color="danger">{{ translate('No promise date') }}</ion-note>
    </ion-label>
  </div>
</template>

<script setup lang="ts">
import { IonCheckbox, IonItem, IonLabel, IonNote } from '@ionic/vue';
import { computed } from 'vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { formatDate, formatRelative } from '@/utils/format';
import { formatDateRange } from '@/utils/labels';
import { useParkingFacilities } from '@/composables/useParkingFacilities';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import type { PreorderOrder } from '@/types';

const props = defineProps<{ order: PreorderOrder; selectMode?: boolean; selected?: boolean }>();
const emit = defineEmits<{ (event: 'activate'): void; (event: 'selectionChange', selected: boolean): void }>();
const seed = useSeedData();
const { typeLabel: futureInventoryTypeName } = useFutureInventoryTypes();
const { summarize } = useParkingFacilities();
const summary = computed(() => summarize(props.order));

const identityLabel = computed(() => [...new Set([props.order.orderName ? props.order.orderId : '', props.order.externalId, seed.statusDescription(props.order.statusId || '')].filter(Boolean))].join(' - '));
const typeLabel = computed(() => {
  const types = summary.value.futureInventoryItemTypeIds;
  return types.length ? types.map((type) => futureInventoryTypeName(type)).join(', ') : translate('Pre-order');
});
</script>

<style scoped>
/* Order Manager's order row: the end column holds the promise date, so it keeps one width. */
.preorder-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  min-height: 5rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.preorder-row > ion-label {
  width: 100%;
}

.preorder-row > ion-label.preorder-row-end {
  display: block;
  justify-self: end;
  max-width: 12rem;
  min-width: 12rem;
  width: 12rem;
}
</style>
