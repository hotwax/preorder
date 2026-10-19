<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button :aria-label="translate('Close')" @click="modalController.dismiss(null, 'cancel')">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ header }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <p>{{ message }}</p>
    <ion-datetime
      presentation="date"
      :locale="locale()"
      :value="selected || undefined"
      :min="earliest"
      @ionChange="selected = normalize($event.detail.value)"
    />
  </ion-content>

  <ion-footer>
    <ion-toolbar>
      <ion-title size="small">{{ selected ? formatDate(selected) : translate('Pick a date') }}</ion-title>
      <ion-buttons slot="end">
        <ion-button fill="solid" :disabled="!selected" @click="modalController.dismiss(selected, 'confirm')">{{ confirmText }}</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonDatetime, IonFooter, IonHeader, IonIcon, IonTitle, IonToolbar, modalController } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { translate } from '@common';
import { formatDate, locale, todayValue } from '@/utils/format';

/**
 * Asks for one date ('yyyy-MM-dd'), as a modal with the calendar the date filters use. The dates it asks for (a
 * promise or arrival date) lie ahead, so the earliest it offers is today in the user's time zone unless `min` says
 * otherwise, and a current date already past starts unselected.
 */
const props = defineProps<{ header: string; message: string; confirmText: string; value?: string; min?: string }>();
const earliest = props.min || todayValue();
const selected = ref(props.value && props.value >= earliest ? props.value : '');

const normalize = (value: string | string[] | null | undefined) => {
  const date = Array.isArray(value) ? value[0] : value;
  return date ? String(date).slice(0, 10) : '';
};
</script>
