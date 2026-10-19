<template>
  <div class="list-item shipment-row" role="link" tabindex="0" @click="emit('activate')" @keydown.enter.prevent="emit('activate')" @keydown.space.prevent="emit('activate')">
    <ion-item lines="none">
      <ion-icon slot="start" :icon="boatOutline" />
      <ion-label>
        {{ shipment.externalId || shipment.shipmentId }}
        <p v-if="shipment.externalId">{{ shipment.shipmentId }}</p>
      </ion-label>
    </ion-item>

    <ion-label class="tablet">
      {{ shipment.orderName || shipment.orderExternalId || shipment.primaryOrderId || translate('No purchase order') }}
      <p>{{ translate('Purchase order') }}</p>
    </ion-label>

    <ion-label>
      {{ seed.facilityName(shipment.destinationFacilityId || '') }}
      <p>{{ translate('Destination') }}</p>
    </ion-label>

    <ion-label class="tablet">
      {{ translate('{received} of {total} received', { received: formatQuantity(shipment.receivedQuantity), total: formatQuantity(shipment.quantityTotal) }) }}
      <p>{{ translate('{count} items', { count: shipment.itemCount ?? 0 }) }}</p>
    </ion-label>

    <ion-label class="tablet">
      <ion-badge :color="statusColor(shipment.statusId)">{{ seed.statusDescription(shipment.statusId || '') }}</ion-badge>
    </ion-label>

    <ion-label class="shipment-row-end ion-text-end">
      <template v-if="shipment.estimatedArrivalDate">
        {{ formatDate(shipment.estimatedArrivalDate) }}
        <p>
          <ion-text v-if="overdueDays" color="danger">{{ overdueLabel(overdueDays) }}</ion-text>
          <template v-else-if="(daysFromToday(shipment.estimatedArrivalDate) ?? 0) < 0">{{ translate('Expected {age}', { age: formatRelativeDay(shipment.estimatedArrivalDate) }) }}</template>
          <template v-else>{{ translate('Arrives {age}', { age: formatRelativeDay(shipment.estimatedArrivalDate) }) }}</template>
        </p>
      </template>
      <ion-note v-else>{{ translate('No arrival date') }}</ion-note>
    </ion-label>
  </div>
</template>

<script setup lang="ts">
import { IonBadge, IonIcon, IonItem, IonLabel, IonNote, IonText } from '@ionic/vue';
import { computed } from 'vue';
import { boatOutline } from 'ionicons/icons';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { daysFromToday, formatDate, formatQuantity, formatRelativeDay } from '@/utils/format';
import { daysOverdue, overdueLabel } from '@/utils/labels';
import { statusColor } from '@/utils/statusColors';
import type { InboundShipmentSummary } from '@/types';

const props = defineProps<{ shipment: InboundShipmentSummary }>();
const emit = defineEmits<{ (event: 'activate'): void }>();
const seed = useSeedData();
/** A shipment still on its way whose arrival date has passed. */
const overdueDays = computed(() => (['PURCH_SHIP_RECEIVED', 'PURCH_SHIP_CANCELLED'].includes(props.shipment.statusId || '') ? 0 : daysOverdue(props.shipment.estimatedArrivalDate)));
</script>

<style scoped>
.shipment-row {
  --columns-desktop: 6;
  --columns-tablet: 5;
  min-height: 5rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.shipment-row > ion-label {
  width: 100%;
}

.shipment-row > ion-label.shipment-row-end {
  display: block;
  justify-self: end;
  max-width: 10rem;
  min-width: 10rem;
  width: 10rem;
}
</style>
