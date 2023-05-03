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
      <div class="header">
        <div class="filters">
          <ion-toolbar>
            <!-- TODO - make searchbar functional -->
            <ion-searchbar />
            <ion-item lines="none">
              <ion-chip v-for="filter in filters" :key="filter.value" @click="applyFilter(filter.value)">
                <!-- Used v-show as v-if caused the ion-chip click animation to render weirdly -->
                <ion-icon v-show="prodCatalogCategoryTypeId === filter.value" :icon="checkmarkOutline" />
                <ion-label>{{ $t(filter.name) }}</ion-label>
              </ion-chip>
            </ion-item>
          </ion-toolbar>
        </div>

        <div class="jobs">
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ $t('Jobs') }}</ion-card-title>
            </ion-card-header>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h5>Pre-order computation</h5>
                <p>13 minutes ago</p>
              </ion-label>
              <ion-label slot="end">
                <p>in 3 mins</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h5>Back-order computation</h5>
                <p>12 minutes ago</p>
              </ion-label>
              <ion-label slot="end">
                <p>in 3 mins</p>
              </ion-label>
            </ion-item>
          </ion-card>
        </div>
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
            <ion-label>{{ prodCatalogCategoryTypeId === 'PCCT_PREORDR' ? $t('Pre-order') : $t('Back-order') }}</ion-label>
          </ion-chip>

          <ion-item lines="none" class="tablet">
            <ion-label class="ion-text-center">
              <h5>{{ product.fromDate ? getTime(product.fromDate) : '-' }}</h5>
              <p>from date</p>
            </ion-label>
          </ion-item>

          <ion-item lines="none" class="tablet">
            <ion-label class="ion-text-center">
              <h5>{{ product.thruDate ? getTime(product.thruDate) : '-' }}</h5>
              <p>thru date</p>
            </ion-label>
          </ion-item>
        </div>

        <ion-infinite-scroll @ionInfinite="loadMoreProducts($event)" threshold="100px" :disabled="!isCatalogScrolleable">
          <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="$t('Loading')" />
        </ion-infinite-scroll>
      </div>
    </ion-content>

  </ion-page>
</template>

<script lang="ts">
import {
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
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
      }*/]
    }
  },
  computed: {
    ...mapGetters({
      currentEComStore: 'user/getCurrentEComStore',
      products: 'product/getCatalogProducts',
      getProduct: 'product/getProduct',
      isCatalogScrolleable: 'product/isCatalogScrolleable'
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
          "filter": `docType: PRODUCT
                    AND productStoreIds: ${this.currentEComStore.productStoreId}
                    AND isVariant: true
                    AND prodCatalogCategoryTypeIds: ${this.prodCatalogCategoryTypeId}`
        }
      }
      this.store.dispatch("product/getCatalogProducts", payload);
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
      this.prodCatalogCategoryTypeId = value
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

.header {
  display: grid;
  grid: "filters jobs"
        /3fr 2fr;
}

.filters {
  grid-area: filters;
  padding: 8px 0;
}

.jobs {
  grid-area: jobs;
}

.list-item {
  --columns-tablet: 4;
  --columns-desktop: 4;
  border-bottom: 1px solid var(--ion-color-medium);
}

@media (max-width: 991px) {

  /* ==============
   3. Mobile Header
     ============== */

  .header {
    grid: "filters"
          "jobs"
          / auto;
    padding: 0;
}
}
</style>
