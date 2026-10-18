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
        {{ order.orderName || order.externalId || order.orderId }}
        <p>{{ [...new Set([order.orderId, order.externalId].filter(Boolean))].join(' - ') }}</p>
      </ion-label>
    </ion-item>

    <ion-label class="tablet">
      {{ order.supplierName || order.supplierPartyId || translate('No supplier') }}
      <p>{{ translate('Supplier') }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ order.facilityName || seed.facilityName(order.facilityId || '') || translate('No facility') }}
      <p>{{ translate('Destination') }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ translate('{count} units', { count: formatQuantity(order.quantityTotal) }) }}
      <p>{{ translate('{count} lines', { count: order.itemCount ?? 0 }) }}<template v-if="order.futureInventoryBatchCount">{{ ', ' + translate('{count} sold as pre-order', { count: order.futureInventoryBatchCount }) }}</template></p>
    </ion-label>

    <ion-label>
      <ion-badge :color="statusColor(order.statusId)">{{ seed.statusDescription(order.statusId || '') }}</ion-badge>
      <p>{{ translate('Ordered {date}', { date: formatDate(order.orderDate) }) }}</p>
    </ion-label>

    <ion-label class="po-row-end ion-text-end">
      <template v-if="order.earliestArrivalDate">
        {{ formatDateRange(order.earliestArrivalDate, order.latestArrivalDate) }}
        <p>
          <ion-text :color="isOpen && isPast(order.earliestArrivalDate) ? 'danger' : undefined">{{ translate('Arrives {age}', { age: formatRelative(order.earliestArrivalDate) }) }}</ion-text>
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
import { formatDate, formatRelative } from '@/utils/format';
import { formatDateRange, formatQuantity, isPast } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import type { PurchaseOrderSummary } from '@/types';

const props = defineProps<{ order: PurchaseOrderSummary; selectMode?: boolean; selected?: boolean }>();
const emit = defineEmits<{ (event: 'activate'): void; (event: 'selectionChange', selected: boolean): void }>();
const seed = useSeedData();
const isOpen = computed(() => ['ORDER_CREATED', 'ORDER_APPROVED'].includes(props.order.statusId || ''));
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
