<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title slot="start">{{ $t("Audit") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :scroll-events="true" @ionScroll="enableScrolling()">
      <div class="header">
        <div class="filters ion-padding-top">
          <ion-toolbar>
            <ion-searchbar :placeholder="$t('Search products')" v-model="queryString" @keyup.enter="queryString = $event.target.value; getCatalogProducts()" />
            <ion-item lines="none">
              <ion-chip :outline="prodCatalogCategoryTypeId !== filter.value" v-for="filter in filters" :key="filter.value" @click="applyFilter(filter.value)">
                <!-- Used v-show as v-if caused the ion-chip click animation to render weirdly -->
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
            <ion-item lines="none">
              <ion-label class="ion-text-wrap">
                <h5>{{ $t('Pre-sell computation') }}</h5>
                <p>{{ preordBckordComputationJob.lastRunTime && timeTillJob(preordBckordComputationJob.lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ preordBckordComputationJob.runTime ? timeTillJob(preordBckordComputationJob.runTime) : $t('disabled')}}</p>
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
        <ion-item button detail v-for="product in products" :key="product.productId" @click="viewProduct(product)">
          <ion-thumbnail slot="start">
            <DxpShopifyImg :src="product.mainImageUrl" size="small"/>
          </ion-thumbnail>
          <ion-label class="ion-text-wrap">
            {{ getProductIdentificationValue(productIdentificationPref.primaryId, product) ? getProductIdentificationValue(productIdentificationPref.primaryId, product) : product.productName }}
            <p>{{ getProductIdentificationValue(productIdentificationPref.secondaryId, product) }}</p>
          </ion-label>
          <ion-chip slot="end" v-if="hasPresellCategory(product)" class="tablet" outline>
            <ion-label>{{ product.prodCatalogCategoryTypeIds.includes('PCCT_PREORDR') ? $t('Pre-order') : product.prodCatalogCategoryTypeIds.includes('PCCT_BACKORDER') ? $t('Back-order') : '-' }}</ion-label>
          </ion-chip>
          <ion-chip slot="end" class="tablet" outline>
            <ion-label>{{ getInventoryChipLabel(product) }}</ion-label>
          </ion-chip>
        </ion-item>
        <ion-infinite-scroll @ionInfinite="loadMoreProducts($event)" threshold="1000px" v-show="isCatalogScrollable" ref="infiniteScrollRef">
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
import { computed, defineComponent } from 'vue';
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import { getProductIdentificationValue, DxpShopifyImg, useProductIdentificationStore } from '@hotwax/dxp-components';
import { mapGetters } from 'vuex';
import { DateTime } from 'luxon';
import { JobService } from '@/services/JobService';
import { hasError } from '@/utils';
import { StockService } from '@/services/StockService';

type InventoryDetail = {
  type: 'poAtp' | 'qoh',
  value?: number
}

export default defineComponent({
  name: 'Audit',
  components: {
    DxpShopifyImg,
    IonButtons,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
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
      prodCatalogCategoryTypeId: '', // 'All' is selected by default
      filters: [{
        name: 'All',
        value: ''
      }, {
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
      productInventory: {} as Record<string, InventoryDetail>,
      queryString: '',
      preordBckordComputationJob: {} as any,
      isScrollingEnabled: false
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
  watch: {
    'currentEComStore.productStoreId': async function(newProductStoreId: string, oldProductStoreId: string) {
      if (newProductStoreId === oldProductStoreId) {
        return;
      }

      this.productInventory = {};
      this.prodCatalogCategoryTypeId = '';
      this.store.dispatch('product/resetCatalogProducts');

      if (newProductStoreId) {
        await this.getCatalogProducts();
        await this.preparePreordBckordComputationJob();
      } else {
        this.preordBckordComputationJob = {};
      }
    }
  },
  async ionViewWillEnter() {
    this.isScrollingEnabled = false;
    this.productInventory = {}
    await this.getCatalogProducts()
    await this.preparePreordBckordComputationJob()
  },
  methods: {
    async getCatalogProducts(vSize?: any, vIndex?: any) {
      if (!this.currentEComStore?.productStoreId) {
        this.store.dispatch('product/resetCatalogProducts');
        return;
      }

      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const startIndex = viewIndex > 0 ? this.products.length : 0;

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
        payload.json.filter += ` AND prodCatalogCategoryTypeIds: ${this.prodCatalogCategoryTypeId}`
      }

      if(this.queryString.trim().length) {
        payload.json.query = this.queryString + "*"
        payload.json.params['qf'] = "productId productName upc sku internalName brandName parentProductName search_goodIdentifications"
        payload.json.params['defType'] = "edismax"
      }

      await this.store.dispatch("product/findCatalogProducts", payload);
      await this.fetchProductInventoryDetails(this.products.slice(startIndex));
    },
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
    async loadMoreProducts(event: any){
      // Added this check here as if added on infinite-scroll component the Loading content does not gets displayed
      if(!(this.isScrollingEnabled && this.isCatalogScrollable)) {
        await event.target.complete();
      }
      this.getCatalogProducts(
        undefined,
        Math.ceil(this.products.length / process.env.VUE_APP_VIEW_SIZE).toString()
      ).then(async () => {
        await event.target.complete();
      });
    },
    async applyFilter(value: string) {
      if(value !== this.prodCatalogCategoryTypeId) {
        this.prodCatalogCategoryTypeId = value
        this.productInventory = {}
        this.getCatalogProducts()
      }
    },
    viewProduct(product: any) {
      this.router.push({ path: `/audit-product-details/${product.groupId}`, query: { variantId: product.productId } });
    },
    async preparePreordBckordComputationJob() {
      try {
        const params = {
          "inputFields": {
            // fetching only pending job here as there are no actions for 
            // draft jobs and so fetching draft job data is not of any use.
            "statusId": "SERVICE_PENDING",
            "statusId_op": "equals",
            "productStoreId": this.currentEComStore.productStoreId,
            'systemJobEnumId': 'JOB_REL_PREODR_CAT',
            'systemJobEnumId_op': 'equals'
          },
          "noConditionFind": "Y",
          "viewSize": 1
        } as any

        let resp = await JobService.fetchJobInformation(params)

        if (!hasError(resp)) {
          this.preordBckordComputationJob = resp.data.docs[0]
        }

        if (Object.keys(this.preordBckordComputationJob).length) {
          // fetching last run time
          resp = await JobService.fetchJobInformation({
            "inputFields": {
              ...params.inputFields,
              "statusId": ["SERVICE_CANCELLED", "SERVICE_CRASHED", "SERVICE_FAILED", "SERVICE_FINISHED"],
              "statusId_op": "in",
            },
            // fetching statusId as well as only one field cannot be sent
            "fieldList": ["runTime", "statusId"],
            "noConditionFind": "Y",
            "viewSize": 1,
            "orderBy": "runTime DESC"
          })

          if (!hasError(resp)) {
            this.preordBckordComputationJob.lastRunTime = resp.data.docs[0].runTime
          }
        }
      } catch (error) {
        console.error(error)
      }
    },
    getTime(time: number) {
      return DateTime.fromMillis(time).toLocaleString()
    },
    timeTillJob (time: any) {
      const timeDiff = DateTime.fromMillis(time).diff(DateTime.local());
      return DateTime.local().plus(timeDiff).toRelative();
    },
    hasPresellCategory(product: any) {
      return product.prodCatalogCategoryTypeIds?.includes('PCCT_PREORDR') || product.prodCatalogCategoryTypeIds?.includes('PCCT_BACKORDER');
    },
    getInventoryChipLabel(product: any) {
      const inventoryDetail = this.productInventory[product.productId];

      if (!inventoryDetail) {
        return '-';
      }

      if (inventoryDetail.type === 'poAtp') {
        return `${this.$t('PO ATP left')}: ${typeof inventoryDetail.value === 'number' ? inventoryDetail.value : '-'}`;
      }

      return `${this.$t('Quantity on hand')}: ${typeof inventoryDetail.value === 'number' ? inventoryDetail.value : '-'}`;
    },
    async fetchProductInventoryDetails(products: any[]) {
      const productsToFetch = products.filter((product: any) => !this.productInventory[product.productId]);

      if (!productsToFetch.length) {
        return;
      }

      const presellProductIds = productsToFetch
        .filter((product: any) => this.hasPresellCategory(product))
        .map((product: any) => product.productId);
      const inventoryProductIds = productsToFetch
        .filter((product: any) => !this.hasPresellCategory(product))
        .map((product: any) => product.productId);

      await Promise.all([
        this.fetchPoAtpDetails(presellProductIds),
        this.fetchOnHandInventoryDetails(inventoryProductIds)
      ]);
    },
    async fetchPoAtpDetails(productIds: string[]) {
      if (!productIds.length) {
        return;
      }

      await Promise.all(productIds.map(async(productId: string) => {
        try {
          const resp = await StockService.getProductFutureAtp({ productId });
          this.productInventory = {
            ...this.productInventory,
            [productId]: {
              type: 'poAtp',
              value: hasError(resp) ? 0 : resp.data?.futureAtp
            }
          };
        } catch (error) {
          console.error(error);
          this.productInventory = {
            ...this.productInventory,
            [productId]: {
              type: 'poAtp',
              value: 0
            }
          };
        }
      }));
    },
    async fetchOnHandInventoryDetails(productIds: string[]) {
      if (!productIds.length) {
        return;
      }

      try {
        const resp = await StockService.checkInventory({
          viewSize: productIds.length,
          filters: {
            productId: productIds,
            productId_op: 'in',
            productStoreId: this.currentEComStore.productStoreId
          },
          fieldsToSelect: ['productId', 'quantityOnHandTotal']
        });

        if (resp.status === 200 && !hasError(resp)) {
          const productInventory = { ...this.productInventory };

          productIds.forEach((productId: string) => {
            productInventory[productId] = { type: 'qoh', value: 0 };
          });

          (resp.data?.docs || []).forEach((product: any) => {
            productInventory[product.productId] = { type: 'qoh', value: product.quantityOnHandTotal };
          });

          this.productInventory = productInventory;
          return;
        }
      } catch (error) {
        console.error(error);
      }

      await Promise.all(productIds.map(async(productId: string) => {
        try {
          const resp = await StockService.getProductInventoryAvailable({ productId });
          this.productInventory = {
            ...this.productInventory,
            [productId]: {
              type: 'qoh',
              value: hasError(resp) ? 0 : resp.data?.quantityOnHandTotal
            }
          };
        } catch (error) {
          console.error(error);
          this.productInventory = {
            ...this.productInventory,
            [productId]: {
              type: 'qoh',
              value: 0
            }
          };
        }
      }));
    },
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const productIdentificationStore = useProductIdentificationStore();
    let productIdentificationPref = computed(() => productIdentificationStore.getProductIdentificationPref)

    return {
      getProductIdentificationValue,
      productIdentificationPref,
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
  cursor: pointer;
}


/* Added width property as after updating to ionic7 min-width is getting applied on ion-label inside ion-item
  which results in distorted label text and thus reduced ion-item width */
.list-item > ion-item {
  width: 100%;
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
