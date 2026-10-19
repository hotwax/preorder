<template>
  <div
    class="date-filter-select"
    :id="triggerId"
    role="button"
    tabindex="0"
    :aria-label="`${label}: ${selectedDateLabel || translate('Select date')}`"
    @keydown.enter="activateTrigger"
    @keydown.space.prevent="activateTrigger"
  >
    <ion-input
      class="date-filter-trigger"
      :value="selectedDateLabel"
      :label="label"
      label-placement="stacked"
      fill="outline"
      :placeholder="translate('Select date')"
      readonly
    >
      <ion-icon slot="end" :icon="chevronDownOutline" color="medium" aria-hidden="true" />
    </ion-input>

    <ion-popover :trigger="triggerId" trigger-action="click" :show-backdrop="false" @willPresent="refreshToday">
      <ion-datetime
        presentation="date"
        :show-default-buttons="true"
        :locale="locale"
        :cancel-text="translate('Cancel')"
        :done-text="translate('Done')"
        :value="modelValue || undefined"
        :min="min || undefined"
        :max="latestSelectable"
        @ionChange="emit('update:modelValue', normalizeDate($event.detail.value))"
      />
    </ion-popover>
  </div>
</template>

<script lang="ts">
let dateFilterSelectCounter = 0;
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonDatetime, IonIcon, IonInput, IonPopover } from '@ionic/vue';
import { chevronDownOutline } from 'ionicons/icons';
import { locale as appLocale, dayBound, formatDate, todayValue } from '@/utils/format';
import { translate } from '@common';

const locale = computed(() => appLocale());

const props = withDefaults(defineProps<{
  modelValue: string;
  label: string;
  min?: string;
  max?: string;
  /** Arrival and promise dates lie ahead, so those filters may pick a day after today. */
  allowFuture?: boolean;
}>(), {
  modelValue: '',
  min: '',
  max: '',
  allowFuture: false,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const triggerId = `date-filter-select-${(dateFilterSelectCounter += 1)}`;

// A filter on something that already happened (an order date) cannot pick a day after today in the user's time zone;
// `allowFuture` lifts that for arrival and promise dates. Today is re-read when the calendar opens, so a page left open overnight moves on.
const today = ref(todayValue());
const refreshToday = () => { today.value = todayValue(); };

/** The caller's upper bound (e.g. the paired "through" date), but never later than today. */
const latestSelectable = computed(() => {
  if (props.allowFuture) return props.max || undefined;
  return props.max && props.max < today.value ? props.max : today.value;
});

const selectedDateLabel = computed(() => {
  if (!props.modelValue) return '';

  return formatDate(props.modelValue) || props.modelValue;
});

/** The picked day as the 'yyyy-MM-dd' every date filter holds: the calendar's value carries no zone, so its date part is the day. */
function normalizeDate(value: string | string[] | null | undefined): string {
  if (!value) return '';
  const selectedValue = Array.isArray(value) ? value[0] : value;
  return selectedValue ? dayBound(String(selectedValue).slice(0, 10), 'start', 'date') : '';
}

function activateTrigger(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement)?.click();
}
</script>

<style scoped>
.date-filter-select {
  flex: 0 0 11rem;
  max-width: 11rem;
  min-width: 11rem;
}

.date-filter-select .date-filter-trigger {
  cursor: pointer;
  width: 100%;
}

@media (max-width: 640px) {
  .date-filter-select {
    flex: 1 1 auto;
    max-width: none;
    min-width: 0;
    width: 100%;
  }
}
</style>
