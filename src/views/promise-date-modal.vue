<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> <ion-icon slot="icon-only" :icon="closeOutline" /></ion-button>
      </ion-buttons>
      <ion-title>{{ $t("Edit promise date") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <p>{{ $t("Select a new promise date for these orders. This new date will be used for allocating inventory and fulfilling these orders.")}}</p>
      
    <ion-item>
      <ion-icon slot="start" :icon="calendar" />
      <ion-input :label="$t('Promised date')" v-model="promisedDatetime" type="date" :placeholder="$t('Select date')" />
    </ion-item>
    
    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <!-- TODO FIX the disable condition -->
      <ion-fab-button :disabled="disableUpdate" @click="saveAlert">
        <ion-icon :icon="save" />
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
  IonTitle,
  IonToolbar,
  modalController,
  alertController } from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, calendar, save} from "ionicons/icons";
import { useStore } from "@/store";
import { DateTime } from 'luxon'
import { mapGetters } from "vuex";

export default defineComponent({
  name: "PromiseDateModal",
  props: [ 'item' , 'items'],
  computed: {
    ...mapGetters({
      jobTotal: 'job/getTotal',
      getSelectedItemsToUpdatePromiseDate: 'order/getSelectedItemsToUpdatePromiseDate',
      currentEComStore: 'user/getCurrentEComStore',
    }),
    disableUpdate(): boolean {
      return this.promisedDatetime === '' || (this.item && this.item.promisedDatetime && DateTime.fromFormat(this.item.promisedDatetime, "yyyy-MM-dd hh:mm:ss.SSS").toFormat("yyyy-MM-dd") === this.promisedDatetime);
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    async saveAlert() {
      const alert = await alertController.create({
        header: this.$t("Update promise date"),
        message: this.$t(
          "Are you sure you want to update the promise date for these orders?"
        ),
        buttons: [
            {
              text: this.$t("Cancel"),
            },
            {
              text: this.$t("Confirm"),
              handler: () => {
                (this.item ? this.updatePromisedDateItem() : this.updatePromiseDateItems()).then(() => {
                    this.closeModal()
                  })
                }
              }
            ],
      });
      return alert.present();
    },
    async updatePromiseDateItems() {
      // TODO Handle timezone
      const promisedDatetime = DateTime.fromFormat(this.promisedDatetime, "yyyy-MM-dd").endOf("day").toFormat("yyyy-MM-dd HH:mm:ss.SSS")
      const items = this.getSelectedItemsToUpdatePromiseDate(promisedDatetime);
      const json = JSON.stringify(items);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "UpdatePromiseDateItems_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_UPD_ORD_ITM_JSON");
      formData.append("param_productStoreId", this.currentEComStore.productStoreId);
      return this.store.dispatch("order/updatePromiseDateItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      })
    },
    async updatePromisedDateItem () {
      const promisedDatetime = DateTime.fromFormat(this.promisedDatetime, "yyyy-MM-dd").endOf("day").toFormat("yyyy-MM-dd HH:mm:ss.SSS")
      return this.store.dispatch("order/updatePromiseDateItem", {
          orderId: this.item.orderId,
          orderItemSeqId: this.item.orderItemSeqId,
          promisedDatetime: promisedDatetime
        })
    },

  },
  beforeMount() {
    // TODO Set current date
    if (this.item && this.item.promisedDatetime) this.promisedDatetime = DateTime.fromISO(this.item.promisedDatetime).toFormat("yyyy-MM-dd")
  },
  setup() {
   const store = useStore();
    return {
      closeOutline,
      calendar,
      save,
      store
    };
  },
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
    IonTitle,
    IonToolbar 
    },
    data () {
      return {
        promisedDatetime : ''
      }
    }
});
</script>

<style scoped>
p {
    padding: 16px;
    line-height: 160%;
}
</style>
