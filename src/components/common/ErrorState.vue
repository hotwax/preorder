<template>
  <ion-card color="danger">
    <ion-card-header>
      <ion-card-title>{{ title }}</ion-card-title>
    </ion-card-header>
    <ion-card-content v-if="message">
      {{ message }}
    </ion-card-content>
    <ion-button
      v-if="retryable"
      color="light"
      fill="clear"
      class="retry-button"
      @click="$emit('retry')"
    >
      {{ translate('Retry') }}
    </ion-button>
  </ion-card>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/vue';
import { translate } from '@common';

defineProps<{
  title: string;
  message?: string;
  retryable?: boolean;
}>();

defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<style scoped>
.retry-button {
  margin: 0 var(--spacer-xs) var(--spacer-xs);
}
</style>
