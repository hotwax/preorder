<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>{{ title }}</ion-card-title>
    </ion-card-header>
    <ion-card-content v-if="message || $slots.actions">
      <p v-if="message">{{ message }}</p>
      <slot name="actions" />
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/vue';

defineProps<{
  title: string;
  message?: string;
}>();
</script>
