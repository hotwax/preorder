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

    <ion-content :fullscreen="true">
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
            <Image :src="getProduct(product.groupValue).mainImageUrl"></Image>
          </ion-thumbnail>
          <ion-label>
            <h2>{{ getProduct(product.groupValue).productName}}</h2>
            <p v-for="(attribute, index) in ($filters.groupFeatures(getProduct(product.groupValue).featureHierarchy))" :key="attribute" ><span class="features">{{ index }}</span>: {{ attribute }}</p>
          </ion-label>
          <ion-badge slot="end" color="success">{{ product.doclist.numFound }} {{ $t("pieces preordered") }}</ion-badge>
        </ion-item>
       
        <ion-infinite-scroll @ionInfinite="loadMoreProducts($event)" threshold="100px" id="infinite-scroll" :disabled="!isScrolleable">
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
import { defineComponent } from "vue";
import { hourglass } from "ionicons/icons";
import { useRouter } from "vue-router";
import BackgroundJobModal from "./background-job-modal.vue";
import { useStore } from "@/store";
import { mapGetters } from "vuex";
import Image from '@/components/Image.vue';

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
    Image
  },
  data() {
    return {
      queryString: '',
      orderIdentificationTypeId: process.env.VUE_APP_ORD_IDENT_TYPE_ID,
      orderedAfter: '',
      orderedBefore: '',
      selectedItems: [] as any,
      hasQuery:  false
    }
  },
  computed: {
    ...mapGetters({
      products: 'product/getList',
      isScrolleable: 'product/isScrolleable',
      getProductStock: 'stock/getProductStock',
      getProduct: 'product/getProduct',
      isJobPending: 'job/isJobPending',
      selectedBrand: 'user/getSelectedBrand'
    })
  },
  methods: {
    async loadMoreProducts(event: any) {
      this.getProducts(
        undefined,
        Math.ceil(this.products.length / process.env.VUE_APP_VIEW_SIZE).toString()
      ).then(() => {
        event.target.complete();
      })
    },
    async getProducts( vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex,
        queryString: '*' + this.queryString + '*',
        groupByField: 'parentProductId',
        groupLimit: 0,
        filters: JSON.parse(process.env.VUE_APP_ORDER_FILTERS)
      }
      if (this.selectedBrand) {
        payload.filters.push('productStoreId: ' + this.selectedBrand);
      }
      return this.store.dispatch("product/findProducts", payload).finally(() => {
        this.hasQuery = true;
      })

    },
    async openActiveJobs() {
      const bgjobmodal = await modalController.create({
        component: BackgroundJobModal,
        cssClass: "my-custom-class",
      });
      return bgjobmodal.present();
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
    return {
      router,
      store,
      hourglass,
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

.features{
  text-transform: lowercase;
  display: inline-block;
}

.features::first-letter{
  text-transform: capitalize;
}

</style> 
