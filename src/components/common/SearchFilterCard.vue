<template>
  <ion-card>
    <ion-card-content class="search-filter-card-content">
      <ion-searchbar
        :value="modelValue"
        :placeholder="placeholder"
        @ionInput="updateSearch"
        @ionChange="$emit('search')"
      />

      <div class="search-filter-row">
        <div class="search-filter-controls">
          <slot />
        </div>
        <ion-button v-if="showClear" class="search-filter-clear" fill="clear" @click="$emit('clear')">{{ translate('Clear') }}</ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonSearchbar } from '@ionic/vue';
import { translate } from '@common';

withDefaults(defineProps<{
  modelValue: string;
  placeholder: string;
  showClear?: boolean;
}>(), {
  showClear: true,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'clear'): void;
  (event: 'search'): void;
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

.search-filter-clear {
  flex: 0 0 auto;
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

  .search-filter-clear {
    align-self: stretch;
  }
}
</style>
