<template>
  <ion-content>
    <ion-list>
      <ion-list-header>SKU</ion-list-header>
      <ion-item button @click="editShippingDate()" lines="none">Edit shipping date</ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  modalController,
  popoverController,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import ShippingModal from '@/views/edit-shipping-modal.vue';

export default defineComponent({
  name: 'ShippingPopover',
  methods: {
    async editShippingDate() {
      const shippingmodal = await modalController.create({
        component: ShippingModal,
      });
      return shippingmodal.present();
    },

    closePopover() {
      popoverController.dismiss({ dismissed: true });
    },
  },
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader,
  },
});
</script>