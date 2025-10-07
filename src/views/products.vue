<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("Products") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openActiveJobs">
            <ion-icon :color='isJobPending ? "warning" : ""' :icon="hourglass" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :scroll-events="true" @ionScroll="enableScrolling()">
      <ion-searchbar @ionFocus="selectSearchBarText($event)" :placeholder="$t('Search products')" v-model="queryString" v-on:keyup.enter="getProducts()"></ion-searchbar>

      <!-- Empty state -->
      <div class="empty-state" v-if="products.length === 0">
        <!-- No result -->
        <p v-if="hasQuery">{{ $t("No results found")}}</p>
        <img src="../assets/images/Productsemptystate.png"/> 
        <p>{{ $t("Enter a product name, style name, SKU, UPCA or external ID.")}}</p>
      </div>
    
      <!-- Products -->
      <div v-else>
        <ion-item  v-bind:key="product.groupValue" v-for="product in products" lines="none" @click="() => router.push({ name: 'Product-details', params: { id: product.groupValue }})">
          <ion-thumbnail slot="start">
            <DxpShopifyImg :src="getProduct(product.groupValue).mainImageUrl" size="small"></DxpShopifyImg>
          </ion-thumbnail>
          <ion-label>
            <h2>{{ getProductIdentificationValue(productIdentificationPref.primaryId, getProduct(product.groupValue)) ? getProductIdentificationValue(productIdentificationPref.primaryId, getProduct(product.groupValue)) : getProduct(product.groupValue).productName }}</h2>
            <p v-for="(attribute, feature) in ($filters.groupFeatures(getProduct(product.groupValue).featureHierarchy))" :key="attribute" ><span class="sentence-case">{{ feature }}</span>: {{ attribute }}</p>
          </ion-label>
          <ion-badge slot="end" color="success">{{ product.doclist.numFound }} {{ $t("pieces preordered") }}</ion-badge>
        </ion-item>
       
        <ion-infinite-scroll @ionInfinite="loadMoreProducts($event)" threshold="100px" id="infinite-scroll"  v-show="isScrolleable" ref="infiniteScrollRef">
          <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="$t('Loading')"></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonMenuButton,
  IonPage,
  IonThumbnail,
  IonTitle,
  IonSearchbar,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { computed, defineComponent } from "vue";
import { hourglass } from "ionicons/icons";
import { useRouter } from "vue-router";
import BackgroundJobModal from "./background-job-modal.vue";
import { useStore } from "@/store";
import { mapGetters } from "vuex";
import { getProductIdentificationValue, DxpShopifyImg, useProductIdentificationStore } from "@hotwax/dxp-components";

export default defineComponent({
  name: "settings",
  components: {
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonMenuButton,
    IonPage,
    IonThumbnail,
    IonTitle,
    IonSearchbar,
    IonToolbar,
    DxpShopifyImg
  },
  data() {
    return {
      queryString: '',
      orderedAfter: '',
      orderedBefore: '',
      selectedItems: [] as any,
      hasQuery:  false,
      isScrollingEnabled: false
    }
  },
  computed: {
    ...mapGetters({
      products: 'product/getList',
      isScrolleable: 'product/isScrolleable',
      getProductStock: 'stock/getProductStock',
      getProduct: 'product/getProduct',
      isJobPending: 'job/isJobPending',
      currentEComStore: 'user/getCurrentEComStore',
      currentOrderParking: 'user/getCurrentOrderParking'
    })
  },
  async ionViewWillEnter() {
    this.isScrollingEnabled = false;
  },
  methods: {
    enableScrolling() {
      const parentElement = (this as any).$refs.contentRef.$el
      const scrollEl = parentElement.shadowRoot.querySelector("div[part='scroll']")
      let scrollHeight = scrollEl.scrollHeight, infiniteHeight = (this as any).$refs.infiniteScrollRef.$el.offsetHeight, scrollTop = scrollEl.scrollTop, threshold = 100, height = scrollEl.offsetHeight
      const distanceFromInfinite = scrollHeight - infiniteHeight - scrollTop - threshold - height
      if(distanceFromInfinite < 0) {
        this.isScrollingEnabled = false;
      } else {
        this.isScrollingEnabled = true;
      }
    },
    async loadMoreProducts(event: any) {
       // Added this check here as if added on infinite-scroll component the Loading content does not gets displayed
       if(!(this.isScrollingEnabled && this.isScrolleable)) {
        await event.target.complete();
      }
      this.getProducts(
        undefined,
        Math.ceil(this.products.length / process.env.VUE_APP_VIEW_SIZE).toString()
      ).then(async () => {
        await event.target.complete();
      });
    },
    async getProducts( vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex,
        queryString: this.queryString,
        queryFields: 'parentProductId productId parentProductName productName search_goodIdentifications internalName',
        groupByField: 'parentProductId',
        groupLimit: 0,
        filters: JSON.parse(process.env.VUE_APP_ORDER_FILTERS)
      }
      if (this.currentEComStore) {
        payload.filters.push('productStoreId: ' + this.currentEComStore.productStoreId);
      }

      if(this.currentOrderParking.length) {
        payload.filters.push(`facilityId: (${this.currentOrderParking.join(' OR ')})`)
      } else {
        payload.filters.push(`facilityId: (PRE_ORDER_PARKING OR BACKORDER_PARKING)`)
      }

      return this.store.dispatch("product/findProducts", payload).finally(() => {
        this.hasQuery = true;
      })

    },
    async openActiveJobs() {
      const bgjobModal = await modalController.create({
        component: BackgroundJobModal,
        cssClass: "my-custom-class",
      });
      return bgjobModal.present();
    },
    selectSearchBarText(event: any) {
      event.target.getInputElement().then((element: any) => {
        element.select();
      })
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const productIdentificationStore = useProductIdentificationStore();
    let productIdentificationPref = computed(() => productIdentificationStore.getProductIdentificationPref)
    return {
      getProductIdentificationValue,
      hourglass,
      productIdentificationPref,
      router,
      store
    };
  },
});
</script>

 <style scoped>

.empty-state {
  height: calc(100vh - 150px);
}

.empty-state > img {
  width: 100%;
  max-height: 450px;
}

</style> 
