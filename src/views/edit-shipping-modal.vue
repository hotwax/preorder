<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon :icon="close" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ $t("Edit shipping date") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-radio-group>
      <ion-item lines="none">
        <ion-radio slot="start"></ion-radio>
        <ion-label>Custom</ion-label>
      </ion-item>
    </ion-radio-group>

    <ion-item>
      <ion-label position="stacked">Ships from date</ion-label>
      <ion-input type="date"></ion-input>
    </ion-item>

    <ion-radio-group>
      <ion-item lines="none">
        <ion-radio slot="start"></ion-radio>
        <ion-label>Auto</ion-label>
      </ion-item>
    </ion-radio-group>

    <ion-list>
      <ion-list-header>Purchase orders</ion-list-header>

      <ion-item>
        <ion-label>
          12345
          <p>ATP: 30</p>
        </ion-label>
        <ion-note slot="end">12 Feb 2021</ion-note>
      </ion-item>

      <ion-item>
        <ion-label>
          67890
          <p>ATP: 50</p>
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
import { close, saveOutline } from 'ionicons/icons';

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
      close,
      saveOutline,
    };
  },
});
</script>