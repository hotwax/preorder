<template>
  <span class="sort-popover">
    <ion-button :id="triggerId" fill="clear" size="small">
      {{ selectedLabel }}
    </ion-button>
    <ion-popover :trigger="triggerId" trigger-action="click" dismiss-on-select>
      <ion-content>
        <ion-list>
          <ion-radio-group :value="modelValue" @ionChange="updateSort">
            <ion-item v-for="option in options" :key="option.value" lines="none">
              <ion-radio :value="option.value" justify="start" label-placement="end">
                {{ translate(option.label) }}
              </ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </ion-content>
    </ion-popover>
  </span>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonPopover,
  IonRadio,
  IonRadioGroup,
} from '@ionic/vue';
import { translate } from '@common';
import { computed } from 'vue';

export interface OrderSortOption {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: string;
  options: OrderSortOption[];
  triggerId: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const selectedLabel = computed(() => {
  const option = props.options.find((candidate) => candidate.value === props.modelValue);
  return translate(option?.label || 'Sort');
});

function updateSort(event: CustomEvent) {
  emit('update:modelValue', String(event.detail.value || ''));
}
</script>
