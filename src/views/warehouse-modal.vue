<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ $t("Release preorder to a warehouse") }}</ion-title>
    </ion-toolbar>
    <ion-toolbar>
      <ion-searchbar  @ionFocus="selectSearchBarText($event)" :placeholder="$t('Search warehouses')"  v-model="queryString" v-on:keyup.enter="findFacility()"></ion-searchbar>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <!-- Empty state -->
    <div class="empty-state" v-if="facilities.length === 0">
      <p>{{ $t("No warehouses found")}}</p>
    </div>

    <!-- Warehouse -->
    <div v-else>
      <ion-list>
        <ion-radio-group value="rd" v-model="facilityId">
          <ion-item  v-bind:key="facility.facilityId" v-for="facility in facilities">
            <ion-radio :value="facility.facilityId" label-placement="end" justify="start">{{ facility.facilityName }}</ion-radio>
          </ion-item>
        </ion-radio-group>
      </ion-list>
    </div>
    
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!facilityId" @click="saveAlert">
        <ion-icon :icon="send" />
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
  IonItem,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  modalController,
  alertController } from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, send } from "ionicons/icons";
import { FacilityService } from '@/services/FacilityService'
import { useStore } from "@/store";
import { ProductService } from '@/services/ProductService'
import { mapGetters } from "vuex";
import emitter from "@/event-bus";

export default defineComponent({
  name: "WarehouseModal",
  props: [ 'item' , 'items', 'selectedVariants'],
  data() {
    return {
      queryString: '',
      facilities: [],
      facilityId: '',
      variantItems: [] as any
    }
  },
  computed: {
    ...mapGetters({
      jobTotal: 'job/getTotal',
      getSelectedItemsToRelease: 'order/getSelectedItemsToRelease',
      currentEComStore: 'user/getCurrentEComStore',
      currentOrderParking: 'user/getCurrentOrderParking'
    }),
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    async saveAlert() {
      const message = this.item ? this.$t(
          'This item will be released to the warehouse you have selected.'
        )  : (this.jobTotal > 0 ? (this.jobTotal === 1 ? this.$t("There is a job already pending.")  : this.$t("There are jobs already pending.",  { count: this.jobTotal })) + " " : "") +  this.$t(
          'preorder items will be released to the warehouse you have selected.', { count: (this.selectedVariants ? this.variantItems : this.items).length }
        );
      const alert = await alertController.create({
        header: this.$t("Release orders"),
        message,
        buttons: [
            {
              text: this.$t("Cancel"),
            },
            {
              text: this.$t("Confirm"),
              handler: () => {
                (this.item ? this.releaseItemToWarehouse() : this.releaseItemsToWarehouse()).then(() => {
                    this.closeModal()
                  })
                }
              }
            ],
      });
      return alert.present();
    },
    findFacility() {
      const payload = {
        "filters":{
          "facilityName": '%' + this.queryString + '%',
          "facilityName_op": "like",
          "facilityTypeId": "WAREHOUSE",
        },
        "fieldsToSelect": ["facilityId", "facilityName"],
        "sortBy" : "facilityName ASC",
        "sortOrder" : "facilityName ASC" // TODO Remove it
      }
      this.facilityId = '';
      FacilityService.findFacility(payload).then((resp: any) => {
        if(resp.data.error) {
          this.facilities = [];
        } else {
          this.facilities = resp.data.docs;
        }
      })
    },
    releaseItemsToWarehouse: async function() {
      emitter.emit("presentLoader")
      const items = this.selectedVariants ? this.variantItems.map((item: any) => {
        item.toFacilityId = this.facilityId
        item.changeReasonEnumId = "BROKERED";
        return item;
      }) : this.getSelectedItemsToRelease(this.facilityId, "BROKERED");
      this.selectedVariants && emitter.emit('backgroundJobsInProgress');
      const json = JSON.stringify(items);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "ReleaseItemsToWarehouse_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_REL_ORD_ITM_JSON");
      formData.append("param_productStoreId", this.currentEComStore.productStoreId);
      return this.store.dispatch("order/releaseItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      }).then(() => {
        this.store.dispatch("order/removeItems", { items: this.items });
      }).finally(() => emitter.emit("dismissLoader"))
    },
    async releaseItemToWarehouse () {
      return this.store.dispatch("order/releaseItem", {
          orderId: this.item.orderId,
          orderItemSeqId: this.item.orderItemSeqId,
          toFacilityId: this.facilityId,
          changeReasonEnumId: "BROKERED"
        }).then(() => {
          this.store.dispatch("order/removeItem", { item: this.item });
        })
    },
    async processSelectedVariants() {
      const variantRequests: any = [];
      Object.keys(this.selectedVariants).forEach((productId: any) => {
        //TODO Find a better way
        // When using clear input the value is reset to empty string, skip the values if empty
        if (!this.selectedVariants[productId]) {
          return;
        }
        const payload = {
          groupByField: 'productId',
          groupLimit: this.selectedVariants[productId],
          filters: [ "productId: " + productId , ...JSON.parse(process.env.VUE_APP_ORDER_FILTERS) ] as any,
          sortBy: "orderDate ASC"
        }
        if (this.currentEComStore) {
          payload.filters.push('productStoreId: ' + this.currentEComStore.productStoreId);
        }

        if(this.currentOrderParking.length) {
          payload.filters.push(`facilityId: (${this.currentOrderParking.join(' OR ')})`)
        } else {
          payload.filters.push(`facilityId: (PRE_ORDER_PARKING OR BACKORDER_PARKING)`)
        }

        variantRequests.push(ProductService.fetchCurrentList(payload));
      });
      Promise.all(variantRequests).then(async([...responses]) => {
        responses.forEach((response: any) => {
          const items = response.data.grouped.productId.groups[0].doclist.docs.map((item: any) => {
            return {
              orderId: item.orderId,
              orderItemSeqId: item.orderItemSeqId,
              toFacilityId: this.facilityId
            }
          })
          this.variantItems = [...this.variantItems, ...items];
        })
      })
    },
    selectSearchBarText(event: any) {
      event.target.getInputElement().then((element: any) => {
        element.select();
      })
    }
  },
  beforeMount () {
    this.findFacility();
    if (this.selectedVariants) {
      this.processSelectedVariants();
    }
  },
  setup() {
    const store = useStore();
    return {
      closeOutline,
      send,
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
    IonItem,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonSearchbar,
    IonTitle,
    IonToolbar 
    },
});
</script>
