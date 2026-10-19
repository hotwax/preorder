<template>
  <div class="multi-select-filter">
    <ion-input
      :id="triggerId"
      class="multi-select-filter-trigger"
      :label="label"
      label-placement="stacked"
      fill="outline"
      :value="summary"
      readonly
    >
      <ion-icon slot="end" :icon="chevronDownOutline" color="medium" aria-hidden="true" />
    </ion-input>
    <ion-popover :trigger="triggerId" trigger-action="click">
      <ion-content>
        <ion-list>
          <ion-item lines="none">
            <ion-checkbox :checked="!modelValue.length" :disabled="!modelValue.length" justify="start" label-placement="end" @ionChange="selectAll(Boolean($event.detail.checked))">
              {{ allLabel }}
            </ion-checkbox>
          </ion-item>
          <ion-item v-for="option in options" :key="option.value" lines="none">
            <ion-checkbox :checked="modelValue.includes(option.value)" justify="start" label-placement="end" @ionChange="toggle(option.value, Boolean($event.detail.checked))">
              {{ option.label }}
            </ion-checkbox>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script lang="ts">
let multiSelectFilterCounter = 0;
</script>

<script setup lang="ts">
import { IonCheckbox, IonContent, IonIcon, IonInput, IonItem, IonList, IonPopover } from '@ionic/vue';
import { chevronDownOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { translate } from '@common';

/** Order Manager's status filter: an outlined trigger and a popover of checkboxes, "All" first. */
const props = defineProps<{
  modelValue: string[];
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}>();
const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>();

const triggerId = `multi-select-filter-${(multiSelectFilterCounter += 1)}`;

const summary = computed(() => {
  if (!props.modelValue.length) return props.allLabel;
  if (props.modelValue.length === 1) return props.options.find((option) => option.value === props.modelValue[0])?.label || props.modelValue[0];
  return translate('{count} selected', { count: props.modelValue.length });
});

/** "All" clears the selection; it is inert while nothing is selected, since there is nothing to clear. */
function selectAll(checked: boolean) {
  if (checked) emit('update:modelValue', []);
}

function toggle(value: string, checked: boolean) {
  const next = new Set(props.modelValue);
  if (checked) next.add(value);
  else next.delete(value);
  emit('update:modelValue', [...next]);
}
</script>

<style scoped>
.multi-select-filter-trigger {
  cursor: pointer;
}
</style>
