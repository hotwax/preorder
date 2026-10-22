<template>
  <ion-item v-for="row in rows" :key="row.facilityId" lines="none">
    <ion-label>
      {{ row.facilityName || seed.facilityName(row.facilityId) || row.facilityId }}
      <p v-if="row.parking">{{ translate('At parking') }}</p>
    </ion-label>
    <ion-label slot="end" class="ion-text-end">
      {{ translate('{count} units', countParams(row.units)) }}
      <p>{{ translate('{count} items', countParams(row.lines)) }}</p>
    </ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { IonItem, IonLabel } from '@ionic/vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { countParams } from '@/utils/format';
import type { DemandByFacility } from '@/types';

/** The rows of where open pre-order reservations wait: the facility, a parking note, and its units and items. */
defineProps<{ rows: DemandByFacility[] }>();
const seed = useSeedData();
</script>
