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
    <div class="email-setting-form">
      <ion-input v-model="form.subject" :label="translate('Subject')" label-placement="stacked" fill="outline" />
      <ion-input
        v-model="form.fromAddress"
        :label="translate('From address')"
        label-placement="stacked"
        fill="outline"
        type="email"
        :error-text="translate('Enter an email address')"
        :class="{ 'ion-invalid ion-touched': !validAddresses(form.fromAddress, false) }"
      />
      <ion-input
        v-model="form.ccAddress"
        :label="translate('CC')"
        label-placement="stacked"
        fill="outline"
        :helper-text="translate('Separate addresses with commas')"
        :error-text="translate('Enter email addresses separated by commas')"
        :class="{ 'ion-invalid ion-touched': !validAddresses(form.ccAddress, true) }"
      />
      <ion-input
        v-model="form.bccAddress"
        :label="translate('BCC')"
        label-placement="stacked"
        fill="outline"
        :helper-text="translate('Separate addresses with commas')"
        :error-text="translate('Enter email addresses separated by commas')"
        :class="{ 'ion-invalid ion-touched': !validAddresses(form.bccAddress, true) }"
      />
      <ion-select v-model="form.systemMessageRemoteId" :label="translate('Gateway')" label-placement="stacked" fill="outline" interface="popover">
        <ion-select-option value="">{{ translate('None') }}</ion-select-option>
        <ion-select-option v-for="gateway in gatewayOptions" :key="gateway.systemMessageRemoteId" :value="gateway.systemMessageRemoteId">
          {{ gateway.description }}
        </ion-select-option>
      </ion-select>
      <ion-input
        v-model="form.gatewayAuthId"
        :label="translate('Gateway auth ID')"
        label-placement="stacked"
        fill="outline"
        :helper-text="translate('The credentials Unigate holds for this store\'s email provider')"
      />
    </div>
  </ion-content>

  <ion-footer>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button fill="solid" :disabled="!changed || !valid" @click="save">{{ translate('Save') }}</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">
import {
  IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonSelect, IonSelectOption, IonTitle,
  IonToolbar, modalController,
} from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { computed, reactive } from 'vue';
import { translate } from '@common';
import type { EmailGateway, EmailSettingChanges, PreorderEmailSetting } from '@/types';

/** Edits one email type's setting for the store; dismisses with only the fields that changed. */
const props = defineProps<{ header: string; setting: PreorderEmailSetting; gateways: EmailGateway[] }>();

const FIELDS = ['subject', 'fromAddress', 'ccAddress', 'bccAddress', 'systemMessageRemoteId', 'gatewayAuthId'] as const;
const initial = Object.fromEntries(FIELDS.map((field) => [field, props.setting[field] || ''])) as Record<(typeof FIELDS)[number], string>;
const form = reactive({ ...initial });

/** The store's current gateway stays selectable even when no other setting uses it. */
const gatewayOptions = computed(() => {
  const options = [...props.gateways];
  const current = props.setting.systemMessageRemoteId;
  if (current && !options.some((gateway) => gateway.systemMessageRemoteId === current)) {
    options.push({ systemMessageRemoteId: current, description: current });
  }
  return options;
});

const ADDRESS = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const validAddresses = (value: string, many: boolean) => {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return true;
  return (many || parts.length === 1) && parts.every((part) => ADDRESS.test(part));
};

const changes = computed<EmailSettingChanges>(() => Object.fromEntries(
  FIELDS.filter((field) => form[field].trim() !== initial[field].trim()).map((field) => [field, form[field].trim()]),
));
const changed = computed(() => Object.keys(changes.value).length > 0);
const valid = computed(() => validAddresses(form.fromAddress, false) && validAddresses(form.ccAddress, true) && validAddresses(form.bccAddress, true));

function save() {
  modalController.dismiss(changes.value, 'confirm');
}
</script>

<style scoped>
.email-setting-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}
</style>
