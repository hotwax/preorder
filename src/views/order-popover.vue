<template>
  <ion-content>
    <ion-list>
      <ion-item button @click="releaseAlert">{{ $t("Release") }}</ion-item>
      <ion-item button @click="openWarehouseList"> {{ $t("Release to a warehouse") }}</ion-item>
      <ion-item button @click="editPromiseDate"> {{ $t("Edit promise date") }}</ion-item>
      <ion-item button lines="none" @click="cancelAlert">{{ $t("Cancel") }}</ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  popoverController,
  alertController,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import WarehouseModal from "@/views/warehouse-modal.vue";
import { useStore } from "@/store";
import PromiseDateModal from "@/views/promise-date-modal.vue";

export default defineComponent({
  name: "OrderPopover",
  props: ['item'],
  methods: {
    async releaseItem (item: any) {
      return this.store.dispatch("order/releaseItem", {
          orderId: item.orderId,
          orderItemSeqId: item.orderItemSeqId,
          changeReasonEnumId: "RELEASED",
          toFacilityId: "_NA_" // TODO Make it configurable
        })
    },
    async cancelItem (item: any) {
      return this.store.dispatch("order/cancelItem", {
          orderId: item.orderId,
          orderItemSeqId: item.orderItemSeqId
        })
    },
    closePopover() {
      popoverController.dismiss({ dismissed: true });
    },
    releaseAlert: async function () {
      const alert = await alertController.create({
        header: this.$t("Release item"),
        cssClass: "alert-message",

        message: this.$t(
          'This item will be automatically brokered and assigned for fulfillment.'
        ),
        buttons: [
            {
              text: this.$t("Cancel"),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: this.$t("Release"),
              handler: () => {
                this.releaseItem(this.item).then(() => {
                  this.store.dispatch("order/removeItem", { item: this.item });
                })
              },
            }
          ]
      });
      this.closePopover();
      return alert.present();
    },
    async openWarehouseList() {
      const warehouseModal = await modalController.create({
        component: WarehouseModal,
        componentProps: {
          item: this.item,
        },
      });
      warehouseModal.onDidDismiss().finally(() => {
        this.closePopover();
      });
      return warehouseModal.present();
    },
     async editPromiseDate() {
      const dateModal = await modalController.create({
        component: PromiseDateModal,
        componentProps: {
          item: this.item
        },
      });
      dateModal.onDidDismiss().finally(() => {
        this.closePopover();
      });
      return dateModal.present();
    },
    async cancelAlert() {
      const alert = await alertController.create({
        header: this.$t("Cancel item"),
        message: this.$t(
          'This item will be cancelled. This action cannot be undone.'
        ),
        buttons: [
            {
              text: this.$t("Don't cancel"),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: this.$t( "Confirm"),
              handler: () => {
                this.cancelItem(this.item).then(() => {
                  this.store.dispatch("order/removeItem", { item: this.item })
                  this.closePopover()
                })
              },
            },
          ],
      });
      this.closePopover();
      return alert.present();
    },
  },
  setup() {
    const store = useStore();
    return {
      store
    }
  },
  components: { 
    IonContent,
    IonItem,
    IonList,
  },
});
</script>