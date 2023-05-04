<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title slot="start">{{ $t("Catalog") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding-top">
        <ion-toolbar>
          <ion-searchbar :placeholder="$t('Search products')" v-model="queryString" @keyup.enter="queryString = $event.target.value; getCatalogProducts()" />
          <ion-item lines="none">
            <ion-chip v-for="filter in filters" :key="filter.value" @click="applyFilter(filter.value)">
              <!-- Used v-show as v-if caused the ion-chip click animation to render weirdly -->
              <ion-icon v-show="prodCatalogCategoryTypeId === filter.value" :icon="checkmarkOutline" />
              <ion-label>{{ $t(filter.name) }}</ion-label>
            </ion-chip>
          </ion-item>
        </ion-toolbar>
      </div>

      <hr />

      <div class="ion-text-center ion-padding" v-if="!products.length">
        {{ $t('No products found') }}
      </div>
      <div v-else>
        <div class="list-item" v-for="product in products" :key="product.productId">
          <ion-item lines="none" class="tablet">
            <ion-thumbnail slot="start">
              <Image :src="product.mainImageUrl" />
            </ion-thumbnail>
            <ion-label class="ion-text-wrap">
              <h5>{{ product.productName }}</h5>
              <p>{{ product.sku }}</p>
            </ion-label>
          </ion-item>

          <ion-chip class="tablet" outline>
            <ion-label>{{ product.prodCatalogCategoryTypeIds.includes('PCCT_PREORDR') ? $t('Pre-order') : $t('Back-order') }}</ion-label>
          </ion-chip>

          <ion-item lines="none" class="tablet">
            <ion-label class="ion-text-center">
              <h5>{{ product.fromDate ? getTime(product.fromDate) : '-' }}</h5>
              <p>{{ $t('from date') }}</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="tablet">
            <ion-label class="ion-text-center">
              <h5>{{ product.thruDate ? getTime(product.thruDate) : '-' }}</h5>
              <p>{{ $t('thru date') }}</p>
            </ion-label>
          </ion-item>
        </div>

        <ion-infinite-scroll @ionInfinite="loadMoreProducts($event)" threshold="100px" :disabled="!isCatalogScrollable">
          <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="$t('Loading')" />
        </ion-infinite-scroll>
      </div>
    </ion-content>

  </ion-page>
</template>

<script lang="ts">
import {
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import {
  checkmarkOutline,
  ellipsisVerticalOutline,
  lockClosedOutline,
  sendOutline,
  shirtOutline,
} from 'ionicons/icons';
import Image from '@/components/Image.vue';
import { mapGetters } from 'vuex';
import { DateTime } from 'luxon';

export default defineComponent({
  name: 'Catalog',
  components: {
    Image,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonPage,
    IonSearchbar,
    IonThumbnail,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      prodCatalogCategoryTypeId: 'PCCT_PREORDR', // selected filter
      filters: [{
        name: 'Pre-order',
        value: 'PCCT_PREORDR'
      }, {
        name: 'Back-order',
        value: 'PCCT_BACKORDER'
      }, /*{
        name: 'Never in any category',
        value: 'NEVER'
      }, {
        name: 'Removed from category',
        value: 'REMOVED'
      }*/],
      queryString: ''
    }
  },
  computed: {
    ...mapGetters({
      currentEComStore: 'user/getCurrentEComStore',
      products: 'product/getCatalogProducts',
      getProduct: 'product/getProduct',
      isCatalogScrollable: 'product/isCatalogScrollable'
    })
  },
  mounted() {
    this.getCatalogProducts()
  },
  methods: {
    async getCatalogProducts(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;

      const payload = {
        "json": {
          "params": {
            "rows": viewSize,
            "start": viewIndex * viewSize,
          } as any,
          "query": "*:*",
          "filter": `docType: PRODUCT AND productStoreIds: ${this.currentEComStore.productStoreId} AND isVariant: true`
        }
      }

      if (this.prodCatalogCategoryTypeId) {
        payload.json.filter += `AND prodCatalogCategoryTypeIds: ${this.prodCatalogCategoryTypeId}`
      }

      if(this.queryString.trim().length) {
        payload.json.query = this.queryString
        payload.json.params['qf'] = "productId productName sku"
        payload.json.params['defType'] = "edismax"
      }

      this.store.dispatch("product/findCatalogProducts", payload);
    },
    async loadMoreProducts(event: any){
      this.getCatalogProducts(
        undefined,
        Math.ceil(this.products.length / process.env.VUE_APP_VIEW_SIZE).toString()
      ).then(() => {
        event.target.complete();
      })
    },
    async applyFilter(value: string) {
      if(value === this.prodCatalogCategoryTypeId) this.prodCatalogCategoryTypeId = ''
      else this.prodCatalogCategoryTypeId = value
      this.getCatalogProducts()
    },
    getTime(time: number) {
      return DateTime.fromMillis(time).toLocaleString()
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      checkmarkOutline,
      ellipsisVerticalOutline,
      lockClosedOutline,
      sendOutline,
      shirtOutline,
      router,
      store,
    };
  },
});
</script>

<style scoped>
.list-item {
  --columns-tablet: 4;
  --columns-desktop: 4;
  border-bottom: 1px solid var(--ion-color-medium);
}
</style>
