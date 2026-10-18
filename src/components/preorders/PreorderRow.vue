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
        {{ order.customerName || order.email || order.customerPartyId || translate('Unknown customer') }}
        <p>{{ identityLabel }}</p>
      </ion-label>
    </ion-item>

    <ion-label class="tablet">
      {{ translate('{count} pre-order items', { count: order.lineCount ?? order.lines?.length ?? 0 }) }}
      <p>{{ order.parkedLineCount ? translate('{count} at parking', { count: order.parkedLineCount }) : translate('Released from parking') }}</p>
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
      <template v-if="order.earliestPromiseDate || order.latestPromiseDate">
        {{ formatDateRange(order.earliestPromiseDate, order.latestPromiseDate) }}
        <p>{{ translate('Promised {age}', { age: formatRelative(order.earliestPromiseDate || order.latestPromiseDate) }) }}</p>
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
import { formatDateRange, futureInventoryTypeLabel } from '@/utils/labels';
import type { PreorderOrder } from '@/types';

const props = defineProps<{ order: PreorderOrder; selectMode?: boolean; selected?: boolean }>();
const emit = defineEmits<{ (event: 'activate'): void; (event: 'selectionChange', selected: boolean): void }>();
const seed = useSeedData();

const identityLabel = computed(() => [...new Set([props.order.orderName, props.order.orderId, seed.statusDescription(props.order.statusId || '')].filter(Boolean))].join(' - '));
const typeLabel = computed(() => {
  const types = props.order.futureInventoryItemTypeIds || [];
  return types.length ? types.map(futureInventoryTypeLabel).join(', ') : translate('Pre-order');
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
