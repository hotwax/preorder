<template>
  <div class="uniform-filter-layout">
    <div class="uniform-filter-grid">
      <slot />
    </div>
    <ion-button class="uniform-filter-clear" fill="clear" size="small" @click="emit('clear')">
      {{ translate('Clear filters') }}
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import { translate } from '@common';

const emit = defineEmits<{
  (event: 'clear'): void;
}>();
</script>

<style scoped>
.uniform-filter-layout {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
  min-width: 0;
  width: 100%;
}

.uniform-filter-grid {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
  width: 100%;
}

.uniform-filter-grid :deep(ion-select),
.uniform-filter-grid :deep(.date-filter-select) {
  max-width: none;
  min-width: 0;
  width: 100%;
}

.uniform-filter-clear {
  align-self: flex-end;
}
</style>
