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
      :min="min || undefined"
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
import { formatDate, locale } from '@/utils/format';

/** Asks for one date ('yyyy-MM-dd'), as a modal with the calendar the date filters use. */
const props = defineProps<{ header: string; message: string; confirmText: string; value?: string; min?: string }>();
const selected = ref(props.value || '');

const normalize = (value: string | string[] | null | undefined) => {
  const date = Array.isArray(value) ? value[0] : value;
  return date ? String(date).slice(0, 10) : '';
};
</script>
