<template>
  <ion-card>
    <ion-card-content class="search-filter-card-content">
      <ion-searchbar
        :value="modelValue"
        :placeholder="placeholder"
        @ionInput="updateSearch"
      />

      <div class="search-filter-row">
        <div class="search-filter-controls">
          <slot />
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonSearchbar } from '@ionic/vue';

defineProps<{
  modelValue: string;
  placeholder: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

function updateSearch(event: CustomEvent) {
  emit('update:modelValue', event.detail.value || '');
}
</script>

<style scoped>
.search-filter-card-content,
.search-filter-row,
.search-filter-controls {
  display: flex;
  gap: var(--spacer-sm);
}

.search-filter-card-content {
  flex-direction: column;
  padding: var(--spacer-sm);
}

.search-filter-row,
.search-filter-controls {
  align-items: center;
}

.search-filter-row {
  flex-wrap: nowrap;
}

.search-filter-controls {
  flex: 1 1 auto;
  flex-wrap: wrap;
  min-width: 0;
}

.search-filter-controls :slotted(*) {
  flex: 1 1 220px;
  min-width: 0;
}

.search-filter-controls :slotted(.date-filter-select) {
  flex: 0 0 11rem;
  max-width: 11rem;
}

@media (max-width: 640px) {
  .search-filter-row,
  .search-filter-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .search-filter-controls :slotted(*) {
    flex-basis: auto;
  }

  .search-filter-controls :slotted(.date-filter-select) {
    flex: 1 1 auto;
    max-width: none;
  }
}
</style>
