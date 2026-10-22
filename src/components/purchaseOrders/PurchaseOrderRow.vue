<template>
  <div
    class="list-item po-row"
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
        :aria-label="translate('Select purchase order')"
        @click.stop
        @keydown.stop
        @ion-change="emit('selectionChange', $event.detail.checked)"
      />
      <ion-label>
        {{ title }}
        <p v-if="subtitle">{{ subtitle }}</p>
      </ion-label>
    </ion-item>

    <ion-label class="tablet">
      {{ order.supplierName || order.supplierPartyId || translate('No supplier') }}
      <p>{{ translate('Supplier') }}</p>
    </ion-label>

    <ion-label>
      {{ seed.facilityName(order.facilityId || '') || translate('No facility') }}
      <p>{{ translate('Destination') }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ translate('{count} units', countParams(order.quantityTotal)) }}
      <p>{{ translate('{count} lines', { count: order.itemCount ?? 0 }) }}<template v-if="order.futureInventoryBatchCount">{{ ', ' + translate('{count} sold as pre-order', { count: order.futureInventoryBatchCount }) }}</template></p>
    </ion-label>

    <ion-label class="tablet">
      <ion-badge :color="statusColor(order.statusId)">{{ seed.statusDescription(order.statusId || '') }}</ion-badge>
      <p>{{ translate('Ordered {date}', { date: formatDate(order.orderDate) }) }}</p>
    </ion-label>

    <ion-label class="po-row-end ion-text-end">
      <template v-if="order.earliestArrivalDate">
        {{ formatDateRange(order.earliestArrivalDate, order.latestArrivalDate) }}
        <p>
          <ion-text v-if="overdueDays" color="danger">{{ overdueLabel(overdueDays) }}</ion-text>
          <template v-else-if="(daysFromToday(order.earliestArrivalDate) ?? 0) < 0">{{ translate('Expected {age}', { age: formatRelativeDay(order.earliestArrivalDate) }) }}</template>
          <template v-else>{{ translate('Arrives {age}', { age: formatRelativeDay(order.earliestArrivalDate) }) }}</template>
        </p>
      </template>
      <ion-note v-else>{{ translate('No arrival date') }}</ion-note>
    </ion-label>
  </div>
</template>

<script setup lang="ts">
import { IonBadge, IonCheckbox, IonItem, IonLabel, IonNote, IonText } from '@ionic/vue';
import { computed } from 'vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { countParams, daysFromToday, formatDate, formatRelativeDay } from '@/utils/format';
import { daysOverdue, formatDateRange, overdueLabel } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import type { PurchaseOrderSummary } from '@/types';

const props = defineProps<{ order: PurchaseOrderSummary; selectMode?: boolean; selected?: boolean }>();
const emit = defineEmits<{ (event: 'activate'): void; (event: 'selectionChange', selected: boolean): void }>();
const seed = useSeedData();
const title = computed(() => props.order.orderName || props.order.externalId || props.order.orderId);
/** The ids the title does not already show. */
const subtitle = computed(() => [...new Set([props.order.orderId, props.order.externalId].filter((id) => id && id !== title.value))].join(' - '));
const isOpen = computed(() => ['ORDER_CREATED', 'ORDER_APPROVED'].includes(props.order.statusId || ''));
/** An open order's first arrival date that has passed: its supply is late. */
const overdueDays = computed(() => (isOpen.value ? daysOverdue(props.order.earliestArrivalDate) : 0));
</script>

<style scoped>
.po-row {
  --columns-desktop: 6;
  --columns-tablet: 5;
  min-height: 5rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.po-row > ion-label {
  width: 100%;
}

.po-row > ion-label.po-row-end {
  display: block;
  justify-self: end;
  max-width: 12rem;
  min-width: 12rem;
  width: 12rem;
}
</style>
