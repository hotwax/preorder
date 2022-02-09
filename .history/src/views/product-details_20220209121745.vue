<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/products"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t("Product details") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="infoAlert">
            <ion-icon :icon="informationCircle" slot="icon-only" />
          </ion-button>
          <ion-button @click="openActiveJobs">
            <ion-icon :color='isJobPending ? "warning" : ""' :icon="hourglass" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="header">
        <div class="product-image">
          <!-- TODO Create a separate component to handled default image -->
          <Image :src="current.product.mainImageUrl"></Image>
        </div>

        <div class="product-info">
          <ion-item lines="none" class="product-title">
            <h1>{{ current.product.productName }}</h1>
          </ion-item>
          <div class="product-features">
            <ion-list v-if="$filters.getFeaturesList(current.product.featureHierarchy, '1/COLOR/').length">
              <ion-list-header>{{ $t("Colors") }}</ion-list-header>
              <ion-item lines="none">
                  <ion-row>
                    <ion-chip v-bind:key="colorFeature" v-for="colorFeature in $filters.getFeaturesList(current.product.featureHierarchy, '1/COLOR/')" @click="filter(colorFeature, 'color')"> <ion-label>{{ colorFeature }}</ion-label></ion-chip>
                  </ion-row>
              </ion-item>
            </ion-list>
            <ion-list v-if="$filters.getFeaturesList(current.product.featureHierarchy, '1/SIZE/').length">
              <ion-list-header>{{ $t("Sizes") }} </ion-list-header>
              <ion-item lines="none">
                  <ion-row>
                    <ion-chip v-bind:key="sizeFeature" v-for="sizeFeature in $filters.getFeaturesList(current.product.featureHierarchy, '1/SIZE/')" @click="filter(sizeFeature, 'size')"> <ion-label>{{ sizeFeature }}</ion-label></ion-chip>
                  </ion-row>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div class="filters">
          <ion-item>
            <ion-label>{{ $t("Ordered after") }} </ion-label>
            <ion-chip slot="end">
              <ion-input v-model="orderedAfter" @ionChange="getVariantProducts()" type="date" />
              <ion-icon @click='orderedAfter = ""' v-if="orderedAfter" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Ordered before") }}</ion-label>
            <ion-chip slot="end">
              <ion-input v-model="orderedBefore" @ionChange="getVariantProducts()" type="date" />
              <ion-icon @click='orderedBefore = ""' v-if="orderedBefore" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Promised after") }}</ion-label>
            <ion-chip slot="end">
              <ion-input v-model="promisedAfter" @ionChange="getVariantProducts()" type="date" />
              <ion-icon @click='promisedAfter = ""' v-if="promisedAfter" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Promised before") }}</ion-label>
            <ion-chip slot="end">
              <ion-input v-model="promisedBefore" @ionChange="getVariantProducts()" type="date" />
              <ion-icon @click='promisedBefore = ""' v-if="promisedBefore" :icon="close"/>
            </ion-chip>
          </ion-item>
          <!-- TODO -->
          <!-- <ion-item>
            <ion-label> {{ $t("Sort by") }}</ion-label>
            <ion-chip slot="end">
              <ion-icon :icon="list" />
              <ion-label>none</ion-label>
            </ion-chip>   
          </ion-item> -->
          <ion-item>
            <ion-label>{{ $t("Loyalty status") }}</ion-label>
            <ion-chip slot="end">  
              <ion-icon :icon="ribbon"  />
              <ion-select :placeholder="$t('select')" @ionChange="getVariantProducts()" v-model="cusotmerLoyalty" interface="popover" interface-options="{showBackdrop:false}">
                <ion-select-option v-for=" (key, value) in cusotmerLoyaltyOptions" v-bind:key="key" :value="value">{{key}}</ion-select-option>
              </ion-select> 
              <ion-icon @click='cusotmerLoyalty = ""' v-if="cusotmerLoyalty" :icon="close"/>
           </ion-chip>
          </ion-item>
          <ion-item lines="none">
            <ion-label>{{ $t("Only orders without promise date") }}</ion-label>
            <ion-toggle slot="end" @ionChange="hasPromisedDate = !hasPromisedDate; getVariantProducts()" :checked="!hasPromisedDate"></ion-toggle>
          </ion-item>
        </div>
      </div>

      <hr />

      <div class="results">
        <ion-badge color="success"> {{ current.totalPreOrders }} {{ $t("pieces preordered") }}</ion-badge>
        <ion-badge color="secondary"> {{ current.list.items.length ? current.list.items.length : 0 }} {{ current.list.items.length > 1 ? $t("variants") : $t("variant") }}</ion-badge>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="current.list.items.length === 0">
        <p>{{ $t("There are no preorders for the filters you have applied and variants you have selected.")}}</p>
      </div>

      <!-- Variant -->
      <div v-else>
        <ion-card  v-bind:key="item.groupValue" v-for="item in filteredProducts.list.items">
          <div class="variant-info">
            <ion-item lines="none">
              <ion-thumbnail slot="start">
                <Image :src="getProduct(item.groupValue).mainImageUrl" ></Image>
              </ion-thumbnail>
              <ion-label>
                <h2> {{ getProduct(item.groupValue).productName }}</h2>
                <p v-if="$filters.getFeature(getProduct(item.groupValue).featureHierarchy, '1/COLOR/')">{{ $t("Color") }}: {{ $filters.getFeature(getProduct(item.groupValue).featureHierarchy, '1/COLOR/') }}</p>
                <p v-if="$filters.getFeature(getProduct(item.groupValue).featureHierarchy, '1/SIZE/')">{{ $t("Size") }}: {{ $filters.getFeature(getProduct(item.groupValue).featureHierarchy, '1/SIZE/') }}</p>
              </ion-label>
            </ion-item>
          </div>
          <div class="order-info">
            <ion-badge color="success" @click="inputPieces(item)">{{ item.doclist && item.doclist.numFound ? item.doclist.numFound : 0 }} {{ $t("pieces preordered") }}</ion-badge>
            <ion-badge color="medium"> {{ getProductStock(item.groupValue) }} {{ $t("in stock") }}</ion-badge>
          </div>
          <div class="order-select">
            <ion-item>
              <ion-label position="floating">{{ $t("Pieces") }}</ion-label>
              <p>{{item}}</p>
              <ion-input type="number" min="1" @ionChange="selectVariant(item.groupValue, $event.target.value)" clear-input="true" :value="item.inputValue"></ion-input>
            </ion-item>
          </div>
        </ion-card>
      </div>
    </ion-content>
    
    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button :disabled="!Object.keys(selectedVariants).length" @click="releaseAlert" fill="outline" color="primary" size="small">
            <ion-icon slot="start" :icon="send" />{{ $t("Release") }}
          </ion-button>
          <ion-button :disabled="!Object.keys(selectedVariants).length" @click="openWarehouseList" fill="outline" color="dark" size="small">
            <ion-icon slot="start" :icon="business" />{{ $t("Release to a warehouse") }}
          </ion-button>
          <ion-button :disabled="!Object.keys(selectedVariants).length" @click="cancelAlert" fill="outline" color="danger" size="small">
            <ion-icon slot="start" :icon="closeCircle" />{{ $t("Cancel") }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonBackButton,
  IonCard,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonLabel,
  IonList,
  IonListHeader,
  IonIcon,
  IonItem,
  IonInput,
  IonPage,
  IonRow,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonToolbar,
  alertController,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  informationCircle,
  send,
  business,
  closeCircle,
  hourglass,
  calendar,
  close,
  list,
  ribbon
} from "ionicons/icons";
import WarehouseModal from "./warehouse-modal.vue";
import BackgroundJobModal from "./background-job-modal.vue";
import { useStore } from "@/store";
import { mapGetters } from "vuex";
import { ProductService } from '@/services/ProductService'
import moment from 'moment';
import Image from '@/components/Image.vue';
export default defineComponent({
  name: "product-details",
  components: {
    IonBadge,
    IonButton,
    IonButtons,
    IonBackButton,
    IonCard,
    IonChip,
    IonContent,
    IonFooter,
    IonHeader,
    IonLabel,
    IonList,
    IonListHeader,
    IonIcon,
    IonItem,
    IonInput,
    IonPage,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonThumbnail,
    IonTitle,
    IonToggle,
    IonToolbar,
    Image
  },
  beforeMount () {
    // TODO Handle if product id is invalid
    this.store.dispatch('product/loadCurrent', { productId: this.$route.params.id }).then(() => {
      this.getVariantProducts();
    })
  },
  data() {
    return {
      orderedAfter: '',
      orderedBefore: '',
      promisedAfter: '',
      promisedBefore: '',
      selectedItems: [] as any,
      selectedVariants: {} as any,
      cusotmerLoyaltyOptions : JSON.parse(process.env?.VUE_APP_CUST_LOYALTY_OPTIONS),
      cusotmerLoyalty: '',
      hasPromisedDate: true,
      filters:{
        color: [] as any,
        size: [] as any
      } as any
    }
  },
  computed: {
    ...mapGetters({
      getProductStock: 'stock/getProductStock',
      current: 'product/getCurrent',
      getProduct: 'product/getProduct',
      isJobPending: 'job/isJobPending',
      jobTotal: 'job/getTotal',
      userProfile: 'user/getUserProfile',
      selectedBrand: 'user/getSelectedBrand',
    }),
    filteredProducts () {
      const filteredProducts = JSON.parse(JSON.stringify(this.current));
      if(this.filters.size.length || this.filters.color.length){
        filteredProducts.list.items = this.current.list.items.map((item: any)=>{
          const product = this.getProduct(item.groupValue);
          const hasSize = this.filters.size.some((sizeFeature: any) => {
            return product.productFeatures.includes("Size/" + sizeFeature)
          })
          const hasColor = this.filters.color.some((colorFeature: any) => {
            return product.productFeatures.includes("Color/" + colorFeature)
          })
          if (hasSize || hasColor) return item;
          else return null
        }).filter((product: any) => product);
      }
      return filteredProducts;
    }
  },
  methods: {
    inputPieces (item: any) {
      item.inputValue = item.doclist.numFound;
      console.log(item);
      this.$forceUpdate();    }, 
    filter (featureValue: any, type: any) {
      if (this.filters[type].includes(featureValue)) {
        const index = this.filters[type].indexOf(featureValue);
        this.filters[type].splice(index,1);
      }
      else {
        this.filters[type].push(featureValue);
      }
    },
    async getVariantProducts() {
      const payload = {
        groupByField: 'productId',
        groupLimit: 0,
        filters: [ "parentProductId: " + this.$route.params.id, ...JSON.parse(process.env.VUE_APP_ORDER_FILTERS) ] as any
      }
      if (this.orderedBefore || this.orderedAfter) {
        const orderedBefore = (this.orderedBefore ? moment.tz(this.orderedBefore, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz(moment(), this.userProfile.userTimeZone)).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const orderedAfter = (this.orderedAfter ? moment.tz(this.orderedAfter, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz("0001-01-01", 'YYYY-MM-DD', this.userProfile.userTimeZone)).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const dateQuery: any = 'orderDate: [' + orderedAfter + ' TO ' + orderedBefore + ']';
        payload.filters.push(dateQuery);
      }
      if (this.promisedBefore || this.promisedAfter) {
        const promisedBefore = (this.promisedBefore ? moment.tz(this.promisedBefore, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz(moment(), this.userProfile.userTimeZone)).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const promisedAfter = (this.promisedAfter ? moment.tz(this.promisedAfter, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz("0001-01-01", 'YYYY-MM-DD', this.userProfile.userTimeZone)).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const promisedDateQuery: any = 'promisedDatetime: [' + promisedAfter + ' TO ' + promisedBefore + ']';
        payload.filters.push(promisedDateQuery);
      }
      if (this.cusotmerLoyalty) {
        payload.filters.push('orderNotes: ' +this.cusotmerLoyalty);
      }
      if (!this.hasPromisedDate) {
        payload.filters.push("-promisedDatetime: *");
      }
      if (this.selectedBrand) {
        payload.filters.push('productStoreId: ' + this.selectedBrand);
      }
      return this.store.dispatch("product/fetchCurrentList", payload)
    },
    async infoAlert() {
      const alert = await alertController.create({
        header: this.$t("How are orders released?"),
        message: this.$t(
          "Orders are released from oldest to newest. Use the Date filter to identify orders taken before a certain date.")+"<p>"+ this.$t("The order count in product cards will be updated based on the filters you select.")+"</p>"
        ,
        buttons: [this.$t("Dismiss")],

      });
      return alert.present();
    },
    async releaseAlert() {
      const itemCount = Object.keys(this.selectedVariants).reduce( (count: number, productId: any) => {
        return count + parseInt(this.selectedVariants[productId]);
      }, 0)
      const message = (this.jobTotal > 0 ? (this.jobTotal === 1 ? this.$t("There is a job already pending.")  : this.$t("There are jobs already pending.",  { count: this.jobTotal })) + " " : "") + this.$t(
          'preorders will be automatically brokered and assigned for fulfillment.',{ count: itemCount }
        )
      const alert = await alertController.create({
        header: this.$t("Release orders"),
        cssClass: "alert-message",
        message,
        buttons: [
          {
            text: this.$t('Cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text:this.$t('Release'),
            handler: () => {
              this.releaseItems();           
            },
          },
        ],
      });
      return alert.present();
    },
    async cancelAlert() {
      const itemCount = Object.keys(this.selectedVariants).reduce( (count: number, productId: any) => {
        return count + parseInt(this.selectedVariants[productId]);
      }, 0);
      const message = (this.jobTotal > 0 ? (this.jobTotal === 1 ? this.$t("There is a job already pending.")  : this.$t("There are jobs already pending.",  { count: this.jobTotal })) + " " : "") + this.$t(
          'preorders will be cancelled. This action cannot be undone.',{ count: itemCount }
        )
      const alert = await alertController.create({
        header: this.$t("Cancel orders"),
        message,
        buttons: [
            {
              text: this.$t("Don't cancel"),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: this.$t("Confirm"),
              handler: () => {
                this.cancelItems();
              },
            },
          ],

      });
      return alert.present();
    },
    async openWarehouseList() {
      const warehousemodal = await modalController.create({
        component: WarehouseModal,
        cssClass: "my-custom-class",
        componentProps: {
          items: [],
          selectedVariants: this.selectedVariants
        },
      });
      return warehousemodal.present();
    },
    async openActiveJobs() {
      const bgjobmodal = await modalController.create({
        component: BackgroundJobModal,
        cssClass: "my-custom-class",
      });
      return bgjobmodal.present();
    },
    selectVariant(productId: string, quantity: string) {
      if (quantity) {
        this.selectedVariants[productId] = quantity;
      } else {
        delete this.selectedVariants[productId]
      }
    },
    async releaseItems() {
      const selectedItemsResponse = await this.processSelectedVaiants("orderDate ASC");
      let selectedItems = [] as any;
      selectedItemsResponse.forEach((response: any) => {
          const items = response.data.grouped.productId.groups[0].doclist.docs.map((item: any) => {
            return {
              orderId: item.orderId,
              orderItemSeqId: item.orderItemSeqId,
              changeReasonEnumId: "RELEASED",
              toFacilityId: "_NA_" // TODO Make it configurable
            }
          })
          selectedItems = [...selectedItems, ...items];
      })
      const json = JSON.stringify(selectedItems);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "ReleaseItems_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_REL_ORD_ITM_JSON");
      return this.store.dispatch("order/releaseItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      }).then(() => {
        this.store.dispatch("order/removeItems", { items: selectedItems });
      })
    },
    async cancelItems() {
      const selectedItemsResponse = await this.processSelectedVaiants("orderDate DESC");
      let selectedItems = [] as any;
      selectedItemsResponse.forEach((response: any) => {
          const items = response.data.grouped.productId.groups[0].doclist.docs.map((item: any) => {
            return {
              orderId: item.orderId,
              orderItemSeqId: item.orderItemSeqId
            }
          })
          selectedItems = [...selectedItems, ...items];
      })
      const json = JSON.stringify(selectedItems);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "CancelItems_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_CAN_ORD_ITM_JSON");
      return this.store.dispatch("order/cancelItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      }).then(() => {
        this.store.dispatch("order/removeItems", { items: selectedItems });
      })
    },
    async processSelectedVaiants(sortBy: string) {
      const variantRequests: any = [];
      Object.keys(this.selectedVariants).forEach((productId: any) => {
        const payload = {
          groupByField: 'productId',
          groupLimit: this.selectedVariants[productId],
          filters: [ "productId:" + productId, ...JSON.parse(process.env.VUE_APP_ORDER_FILTERS) ] as any,
          sortBy: sortBy
        }
        if (this.orderedBefore || this.orderedAfter) {
          const orderedBefore = (this.orderedBefore ? moment.tz(this.orderedBefore, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz(moment(), this.userProfile.userTimeZone)).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
          const orderedAfter = (this.orderedAfter ? moment.tz(this.orderedAfter, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz("0001-01-01", 'YYYY-MM-DD', this.userProfile.userTimeZone)).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
          const dateQuery: any = 'orderDate: [' + orderedAfter + ' TO ' + orderedBefore + ']';
          payload.filters.push(dateQuery);
        }
        if (this.promisedBefore || this.promisedAfter) {
          const promisedBefore = (this.promisedBefore ? moment.tz(this.promisedBefore, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz(moment(), this.userProfile.userTimeZone)).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
          const promisedAfter = (this.promisedAfter ? moment.tz(this.promisedAfter, 'YYYY-MM-DD', this.userProfile.userTimeZone) : moment.tz("0001-01-01", 'YYYY-MM-DD', this.userProfile.userTimeZone)).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
          const promisedDateQuery: any = 'promisedDatetime: [' + promisedAfter + ' TO ' + promisedBefore + ']';
          payload.filters.push(promisedDateQuery);
        }
        if (this.cusotmerLoyalty) {
          payload.filters.push('orderNotes: ' +this.cusotmerLoyalty);
        }
        if (!this.hasPromisedDate) {
          payload.filters.push("-promisedDatetime: *");
        }
        if (this.selectedBrand) {
          payload.filters.push('productStoreId: ' +this.selectedBrand);
        }
        variantRequests.push(ProductService.fetchCurrentList(payload));
      });
      return Promise.all(variantRequests);
    },
  },
  setup() {
    const store = useStore();
    return {
      informationCircle,
      send,
      business,
      closeCircle,
      hourglass,
      calendar,
      close,
      list,
      ribbon,
      store
    };
  },
});
</script>

<style scoped>

/* Table of contents

  1. Desktop Header
     - Product Info
     - Product Features

  2. Desktop Results 
     - Result Info
     - Result Card

  3. Mobile Header
     - Product Image 
     - Product Info
     - Product Features

  4. Mobile Results 
     - Result Info
     - Result Card 
*/

/* ==============
  1. Desktop Header
   ============== */

.header {
  display: grid;
  grid-template-columns: 200px 1fr 375px;
  grid-gap: 16px;
  padding: 16px 16px 48px;
}

.product-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-info > h1 {
  margin: 0px;
}

.product-features ion-item > ion-label {
  padding-bottom: 0px;
  margin: 0px;
}

.product-features > ion-list-header {
  min-height: 16px;
}

/* ==============
 2. Desktop Results 
   ============== */

hr {
  border-width: 1px;
  color: var(--ion-color-medium);
}

.results {
  display: flex;
  padding: 8px 16px 24px;
}

ion-card {
  display: grid;
  grid-template-columns: max-content 1fr 200px;
  align-items: center;
  padding: 16px;
}

.order-info {
  display: flex;
  justify-content: center;
}

@media (max-width: 991px) {

  /* ==============
    3. Mobile Header
     ============== */

  .header {
    grid: 1fr max-content max-content / auto;
    padding: 0;
  }

  .product-image {
    grid-row: 1 / 3;
    grid-column: 1 / 2;
  }

  .product-image > img {
    width: 100%;
    height: 50vh;
    object-fit: cover;
  }

  .product-info {
    grid-row: 2 / 3;
    grid-column: 1 / 2;

    backdrop-filter: blur(20px);
    background: linear-gradient(to bottom, #ffffff7d, white);
    padding: 16px 0;
  }

  ion-item {
    --background: transparent;
  }
  
  ion-list {
    background: transparent;
  }


  .product-title{
    margin-bottom: 16px;
  }

 /* ==============
  4. Mobile Results
    ============== */

  hr {
  margin-top: 16px;
 }

  ion-card {
  grid-template-columns: auto;
 }

 ion-chip {
  background: #E0E0E0;
}

}
</style>
