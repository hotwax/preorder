<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Edit shipping date") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-radio-group>
      <ion-item lines="none">
        <ion-radio justify="start" label-placement="end">{{ translate("Custom") }}</ion-radio>
      </ion-item>
    </ion-radio-group>

    <ion-item>
      <ion-input :label="translate('Ships from date')" label-placement="stacked" type="date"></ion-input>
    </ion-item>

    <ion-radio-group>
      <ion-item lines="none">
        <ion-radio label-placement="end" justify="start">{{ translate("Auto") }}</ion-radio>
      </ion-item>
    </ion-radio-group>

    <ion-list>
      <ion-list-header>{{ translate("Purchase orders") }}</ion-list-header>

      <ion-item>
        <ion-label>
          12345
          <p>{{ translate("ATP") }}: 30</p>
        </ion-label>
        <ion-note slot="end">12 Feb 2021</ion-note>
      </ion-item>

      <ion-item>
        <ion-label>
          67890
          <p>{{ translate("ATP") }}: 50</p>
        </ion-label>
        <ion-note slot="end">12 Feb 2021</ion-note>
      </ion-item>
    </ion-list>

    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button>
        <ion-icon :icon="saveOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script lang="ts">
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { closeOutline, saveOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';

export default defineComponent({
  name: 'EditShippingModal',
  components: {
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonRadio,
    IonRadioGroup,
    IonTitle,
    IonToolbar,
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
  },
  setup() {
    return {
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>