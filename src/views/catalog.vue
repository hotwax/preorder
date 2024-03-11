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
        <div class="list-item" v-for="product in products" :key="product.productId" @click="viewProduct(product)">
          <ion-item lines="none" class="tablet">
            <ion-thumbnail slot="start">
              <DxpShopifyImg :src="product.mainImageUrl" size="small"/>
            </ion-thumbnail>
            <ion-label class="ion-text-wrap">
              <h5>{{ product.parentProductName }}</h5>
              <p>{{ product.sku }}</p>
            </ion-label>
          </ion-item>

          <ion-chip v-if="product.prodCatalogCategoryTypeIds.includes('PCCT_PREORDR') || product.prodCatalogCategoryTypeIds.includes('PCCT_BACKORDER')" class="tablet" outline>
            <ion-label>{{ product.prodCatalogCategoryTypeIds.includes('PCCT_PREORDR') ? $t('Pre-order') : product.prodCatalogCategoryTypeIds.includes('PCCT_BACKORDER') ? $t('Back-order') : '-' }}</ion-label>
          </ion-chip>

          <!-- TODO -->
          <!-- <ion-item lines="none" class="tablet">
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
          </ion-item> -->
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
import { defineComponent } from 'vue';
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import { DxpShopifyImg } from '@hotwax/dxp-components';
import { mapGetters } from 'vuex';
import { DateTime } from 'luxon';
import { JobService } from '@/services/JobService';
import { hasError } from '@/utils';

export default defineComponent({
  name: 'Catalog',
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
      queryString: '',
      preordBckordComputationJob: {} as any
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
  async ionViewWillEnter() {
    await this.getCatalogProducts()
    await this.preparePreordBckordComputationJob()
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
        payload.json.filter += ` AND prodCatalogCategoryTypeIds: ${this.prodCatalogCategoryTypeId}`
      }

      if(this.queryString.trim().length) {
        payload.json.query = this.queryString + "*"
        payload.json.params['qf'] = "productId productName upc sku internalName brandName parentProductName search_goodIdentifications"
        payload.json.params['defType'] = "edismax"
      }

      await this.store.dispatch("product/findCatalogProducts", payload);
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
      if(value !== this.prodCatalogCategoryTypeId) {
        this.prodCatalogCategoryTypeId = value
        this.getCatalogProducts()
      }
    },
    viewProduct(product: any) {
      this.router.push({ path: `/catalog-product-details/${product.groupId}`, query: { variantId: product.productId } });
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
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
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
