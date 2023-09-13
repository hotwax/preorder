<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/catalog"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t("Product summary") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="header">
        <div class="product-image">
          <ion-skeleton-text v-if="!Object.keys(currentVariant).length" animated />
          <ShopifyImg v-else :src="currentVariant.mainImageUrl" />
        </div>

        <div class="product-info" v-if="Object.keys(currentVariant).length">
          <div class="ion-padding">
            <h4>{{ currentVariant.parentProductName }}</h4>
            <p>{{ currentVariant.sku }}</p>
          </div>

          <div class="product-features">
            <ion-list v-if="selectedColor">
              <ion-list-header>{{ $t("Colors") }}</ion-list-header>
              <ion-item lines="none">
                <ion-row>
                  <ion-chip :outline="selectedColor !== colorFeature" :key="colorFeature" v-for="colorFeature in Object.keys(features)" @click="selectedColor !== colorFeature && applyFeature(colorFeature, 'color')">
                    <ion-label class="ion-text-wrap">{{ colorFeature }}</ion-label>
                  </ion-chip>
                </ion-row>
              </ion-item>
            </ion-list>

            <ion-list v-if="selectedSize">
              <ion-list-header>{{ $t("Sizes") }}</ion-list-header>
              <ion-item lines="none">
                <ion-row>
                  <ion-chip :outline="selectedSize !== sizeFeature" :key="sizeFeature" v-for="sizeFeature in features[selectedColor]" @click="selectedSize !== sizeFeature && applyFeature(sizeFeature, 'size')">
                    <ion-label class="ion-text-wrap">{{ sizeFeature }}</ion-label>
                  </ion-chip>
                </ion-row>
              </ion-item>
            </ion-list>
          </div>
        </div>
        <div class="product-info" v-else>
          <div class="ion-padding">
            <ion-skeleton-text animated style="width: 60%; height: 80%;" />
            <ion-skeleton-text animated style="width: 40%; height: 40%;" />
          </div>

          <div class="product-features">
            <ion-list>
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 60%;" />
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 60%;" />
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div>
          <ion-card v-if="!poSummary.listingCountStatusMessage">
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Eligible") }}</ion-label>
              <ion-skeleton-text slot="end" animated style="height: 30%; width: 20%;" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Category") }}</ion-label>
              <ion-skeleton-text slot="end" animated style="height: 30%; width: 40%;" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Shopify listing") }}</ion-label>
              <ion-skeleton-text slot="end" animated style="height: 30%; width: 50%;" />
            </ion-item>
            <ion-item-divider color="light">
              <ion-label color="medium">{{ $t("Timeline") }}</ion-label>
            </ion-item-divider>
            <ion-item>
              <ion-icon slot="start" :icon="shirtOutline" />
              <ion-label>
                <ion-item lines="none">
                  <ion-skeleton-text animated style="width: 90%; height: 30%;" />
                </ion-item>
                <ion-item lines="none">
                  <ion-skeleton-text animated style="width: 100%; height: 60%;" />
                </ion-item>
              </ion-label> 
            </ion-item>
          </ion-card>
          <ion-card v-else>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Eligible") }}</ion-label>
              <ion-label slot="end">{{ poSummary.eligible ? $t("Yes") : $t("No") }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Category") }}</ion-label>
              <ion-label slot="end">{{ poSummary.categoryId === preOrderCategoryId ? $t('Pre-order') : poSummary.categoryId === backorderCategoryId ? $t('Back-order') : $t('None') }}</ion-label>
              <ion-icon slot="end" :icon="isCategoryValid() ? checkmarkCircleOutline : alertCircleOutline" :color="isCategoryValid() ? 'success' : 'warning'" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Shopify listing") }}</ion-label>
              <ion-label slot="end">{{ poSummary.listingCountStatusMessage }}</ion-label>
              <ion-icon slot="end" :icon="isShopifyListingValid() ? checkmarkCircleOutline : alertCircleOutline" :color="isShopifyListingValid() ? 'success' : 'warning'" />
            </ion-item>
            <ion-item v-if="poSummary.promiseDate">
              <ion-label class="ion-text-wrap">{{ $t("Promise date") }}</ion-label>
              <ion-label slot="end">{{ poSummary.promiseDate }}</ion-label>
            </ion-item>
            <ion-item-divider color="light">
              <ion-label color="medium">{{ $t("Timeline") }}</ion-label>
            </ion-item-divider>
            <!-- internationalized while preparaion -->
            <ion-item v-if="poSummary.header || poSummary.body">
              <ion-icon slot="start" :icon="shirtOutline" />
              <ion-label class="ion-text-wrap">
                <h2 v-if="poSummary.header">{{ poSummary.header }}</h2>
                <p v-if="poSummary.body">{{ poSummary.body }}</p>
              </ion-label>
            </ion-item>
          </ion-card>
        </div>
      </div>

      <hr />

      <section>
        <ion-card v-if="!Object.keys(poAndAtpDetails).length">
          <ion-item lines="none">
            <ion-skeleton-text animated style="height: 40%; width: 70%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 40%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 50%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 40%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 50%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 40%;" />
          </ion-item>
          <ion-item>
            <ion-skeleton-text animated style="height: 30%; width: 50%;" />
          </ion-item>
        </ion-card>
        <ion-card v-else-if="Object.keys(poAndAtpDetails.activePo).length">
          <ion-card-header>
            <ion-card-title>
              <h3 v-if="hasCategory()">{{ $t("Active purchase order") }}</h3>
              <h3 v-else>{{ $t("Available purchase order") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <!-- TODO Show orderName -->
          <ion-item>
            <ion-label>{{ poAndAtpDetails.activePo.orderExternalId ? poAndAtpDetails.activePo?.orderExternalId :  poAndAtpDetails.activePoId }}</ion-label>
            <ion-label slot="end">{{ poAndAtpDetails.activePo?.estimatedDeliveryDate ? getTime(poAndAtpDetails.activePo.estimatedDeliveryDate) : '-' }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t('Pre-selling category') }}</ion-label>
            <ion-label slot="end">{{ poAndAtpDetails.activePo?.isNewProduct === "Y" ? $t('Pre-order') : $t('Back-order') }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Ordered") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.activePo?.quantity >= 0) ? poAndAtpDetails.activePo?.quantity : '-' }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Available") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.activePo?.availableToPromise >= 0) ? poAndAtpDetails.activePo?.availableToPromise : '-' }}</ion-label>
          </ion-item>

          <ion-item lines="full">
            <ion-label>{{ $t("Corresponding sales orders") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.crspndgSalesOrdr >= 0) ? poAndAtpDetails.crspndgSalesOrdr : '-' }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO items") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.totalPoItems >= 0) ? poAndAtpDetails.totalPoItems : '-' }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO ATP") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.totalPoAtp >= 0) ? poAndAtpDetails.totalPoAtp : '-' }}</ion-label>
          </ion-item>
        </ion-card>
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Purchase orders")  }}</h3>
            </ion-card-title>
          </ion-card-header>

          <ion-item>
            <ion-label>{{ $t("Total PO items") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.totalPoItems >= 0) ? poAndAtpDetails.totalPoItems : '-' }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO ATP") }}</ion-label>
            <ion-label slot="end">{{ (poAndAtpDetails.totalPoAtp >= 0) ? poAndAtpDetails.totalPoAtp : '-' }}</ion-label>
          </ion-item>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Online ATP calculation") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <div v-if="!Object.keys(inventoryConfig).length">
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 50%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 50%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
          </div>
          <div v-else>
            <ion-item>
              <ion-label>{{ $t("Online ATP") }}</ion-label>
              <ion-label slot="end">{{ (atpCalcDetails.onlineAtp >= 0) ? atpCalcDetails.onlineAtp : '-' }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Quantity on hand") }}</ion-label>
              <ion-label slot="end">{{ (atpCalcDetails.totalQOH >= 0) ? atpCalcDetails.totalQOH : '-' }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Excluded ATP") }}</ion-label>
              <ion-label slot="end">{{ (atpCalcDetails.excludedAtp || atpCalcDetails.excludedAtp === 0) ? atpCalcDetails.excludedAtp : '-' }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Reserve inventory") }}</ion-label>
              <ion-toggle slot="end" :disabled="!inventoryConfig.reserveInvStatus || !hasPermission(Actions.APP_INV_CNFG_UPDT)" :checked="inventoryConfig.reserveInvStatus === 'Y'" @click="updateReserveInvConfig($event)"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Hold pre-order physical inventory") }}</ion-label>
              <ion-toggle slot="end" :disabled="!inventoryConfig.preOrdPhyInvHoldStatus || !hasPermission(Actions.APP_INV_CNFG_UPDT)" :checked="inventoryConfig.preOrdPhyInvHoldStatus != 'false'" @click="updatePreOrdPhyInvHoldConfig($event)"/>
            </ion-item>
          </div>
        </ion-card>
      </section>

      <hr />

      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Category and brokering jobs') }}</h3>
            </ion-card-title>
          </ion-card-header>
          <div v-if="!isCtgryAndBrkrngJobsLoaded">
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 50%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
          </div>
          <div v-else>
            <ion-item v-if="Object.keys(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT')).length" detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT'), 'Pre-sell computation')">
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Pre-sell computation') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime) : $t('disabled')}}</p>
              </ion-label>
            </ion-item>

            <ion-item v-if="Object.keys(getCtgryAndBrkrngJob('JOB_BKR_ORD')).length " detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_BKR_ORD'), 'Order brokering')">
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Order brokering') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime) : $t('disabled')}}</p>
              </ion-label>
            </ion-item>

            <ion-item v-if="Object.keys(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE')).length" detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE'), 'Auto releasing')">
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Auto releasing') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime) : $t('disabled')}}</p>
              </ion-label>
            </ion-item>
          </div>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Shop listing status') }}</h3>
            </ion-card-title>
          </ion-card-header>
          <div v-if="!poSummary.listingCountStatusMessage">
            <ion-item>
              <ion-skeleton-text animated style="height: 40%; width: 60%;" />
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 40%;" /> 
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 30%; width: 50%;" /> 
            </ion-item>
          </div>
          <div v-else>
            <ion-item v-if="!Object.keys(shopListings).length">
              {{ $t('No shop listings found') }}
            </ion-item>
            <ion-item v-else v-for="(listData, index) in shopListings" :key="index">
              <ion-label class="ion-text-wrap">
                <h5>{{ listData.name }}</h5>
                <!-- internationalized while preparation -->
                <p>{{ listData.listingTimeAndStatus }}</p>
              </ion-label>
              <ion-label v-if="listData.shopifyShopProductId && listData.status" :color="listData.containsError ? 'danger' : (listData.status === 'inactive' ? 'warning' : 'success')" slot="end">
                <h5>{{ $t(listData.listingStatus) }}</h5>
              </ion-label>
              <ion-label v-else-if="listData.shopifyShopProductId" color="medium" slot="end">
                <h5>{{ $t("No listing data") }}</h5>
              </ion-label>
              <ion-label v-else color="medium" slot="end">
                <h5>{{ $t("Not linked") }}</h5>
              </ion-label>
            </ion-item>
          </div>
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  alertController,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonListHeader,
  IonList,
  IonPage,
  IonSkeletonText,
  IonToggle,
  IonToolbar,
  IonTitle,
  IonRow,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  copyOutline,
  shirtOutline
} from "ionicons/icons";
import { useStore } from "@/store";
import { ShopifyImg } from "@hotwax/dxp-components";
import { mapGetters } from "vuex";
import { showToast, getFeature, hasError } from "@/utils";
import { translate } from "@/i18n";
import { sortSizes } from '@/apparel-sorter';
import { DateTime } from "luxon";
import JobActionsPopover from "./job-actions-popover.vue";
import { OrderService } from "@/services/OrderService";
import { ShopifyService } from "@/services/ShopifyService";
import { JobService } from "@/services/JobService";
import { StockService } from "@/services/StockService";
import { UtilService } from "@/services/UtilService";
import { useRouter } from "vue-router";
import { Plugins } from "@capacitor/core";
import { Actions, hasPermission } from '@/authorization'

export default defineComponent({
  name: "catalog-product-details",
  components: {
    ShopifyImg,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonListHeader,
    IonList,
    IonPage,
    IonSkeletonText,
    IonToggle,
    IonToolbar,
    IonTitle,
    IonRow,
  },
  data() {
    return {
      variantId: '',
      productId: '',
      selectedColor: '',
      selectedSize: '',
      features: [] as any,
      currentVariant: {} as any,
      poAndAtpDetails: {} as any,
      atpCalcDetails: {} as any,
      inventoryConfig: {} as any,
      poSummary: {} as any,
      shopListings: [] as any,
      configsByStores: [] as any,
      listingJobRunTime: 0,
      backorderCategoryId: '',
      preOrderCategoryId: '',
      isCtgryAndBrkrngJobsLoaded: false
    }
  },
  computed: {
    ...mapGetters({
      product: "product/getCurrentCatalogProduct",
      currentEComStore: 'user/getCurrentEComStore',
      getCtgryAndBrkrngJob: "job/getCtgryAndBrkrngJob",
      getInventoryConfig: "util/getInventoryConfig"
    })
  },
  async ionViewWillEnter() {
    (this as any).productId = this.$route.params.productId;
    (this as any).variantId = this.$route.query.variantId;
    const productStoreId = this.currentEComStore.productStoreId;
    // TODO Handle it better
    if (!productStoreId) {
      showToast(translate("No selected store found."))
      return;
    }
    try {
      // TODO Handle error case
      const productStoreCategories = await this.store.dispatch('product/getPreOrderBackorderCategory', { productStoreId })
      this.preOrderCategoryId = productStoreCategories["PCCT_PREORDR"];
      this.backorderCategoryId = productStoreCategories["PCCT_BACKORDER"];
    } catch (error) {
      console.error("Failed to get pre-order/backorder categories")
    }
    await this.getShopifyConfigsByStore()
    await this.getCtgryAndBrkrngJobs()
    await this.getVariantDetails()
  },
  methods: {
    async getVariantDetails() {
      await this.store.dispatch('product/setCurrentCatalogProduct', { productId:  this.productId})
      if (this.product.variants) {
        this.getFeatures()
        await this.updateVariant()
      }
    },
    applyFeature(feature: string, type: string) {
      if (type === 'color') this.selectedColor = feature
      else if (type === 'size') this.selectedSize = feature
      this.updateVariant();
    },
    getFeatures() {
      const features = {} as any
      this.product.variants.map((variant: any) => {
        const size = getFeature(variant.featureHierarchy, '1/SIZE/')
        const color = getFeature(variant.featureHierarchy, '1/COLOR/')
        if (!features[color]) features[color] = [size]
        else if (!features[color].includes(size)) features[color].push(size)
      })

      Object.keys(features).forEach((color) => this.features[color] = sortSizes(features[color]))

      let selectedVariant = this.product.variants.find((variant: any) => variant.productId === this.variantId)

      if (!selectedVariant) {
          // if the variant does not have color or size as features
          selectedVariant = this.product.variants[0]
          showToast(translate("Selected variant not available. Reseting to first variant."))
        }

      if (selectedVariant) {
        this.selectedColor = getFeature(selectedVariant.featureHierarchy, '1/COLOR/')
        this.selectedSize = getFeature(selectedVariant.featureHierarchy, '1/SIZE/')
      }
    },
    async updateVariant() {
      let variant
      if (this.selectedColor || this.selectedSize) {
        variant = this.product.variants.find((variant: any) => {
          const hasSize = !this.selectedSize || (this.selectedSize && getFeature(variant.featureHierarchy, '1/SIZE/') === this.selectedSize)
          const hasColor = !this.selectedColor || (this.selectedColor && getFeature(variant.featureHierarchy, '1/COLOR/') === this.selectedColor)
          return hasSize && hasColor
        })

        // if the selected size is not available for that color, default it to the first size available
        if (!variant) {
          this.selectedSize = this.features[this.selectedColor][0];
          variant = this.product.variants.find((variant: any) => getFeature(variant.featureHierarchy, '1/SIZE/') === this.selectedSize)
          showToast(translate("Selected variant not available"))
        }
      }
      // if the variant does not have color or size as features
      this.currentVariant = variant || this.product.variants[0]
      this.variantId = this.currentVariant.variantId
      this.$route.query.variantId !==  this.currentVariant.productId && (this.router.replace({path: this.$route.path,  query: { variantId: this.currentVariant.productId } }));
      await this.getPoDetails()
      await this.getAtpCalcDetails()
      await this.prepareInvConfig()
      await this.prepareShopListings()
      await this.preparePoSummary()
    },
    async getCtgryAndBrkrngJobs() {
      const systemJobEnumIds = JSON.parse(process.env.VUE_APP_CTGRY_AND_BRKRNG_JOB)
      this.store.dispatch('job/fetchCtgryAndBrkrngJobs', { systemJobEnumIds }).then(() => {
        this.isCtgryAndBrkrngJobsLoaded = true
      })
    },
    async openJobActionsPopover(event: Event, job: any, jobTitle: string) {
      job.jobTitle = jobTitle
      const popover = await popoverController.create({
        component: JobActionsPopover,
        componentProps: { job },
        event,
        showBackdrop: false
      });

      await popover.present();
    },
    getTime(time: number) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATE_MED)
    },
    getDateTime(time: number) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED)
    },
    timeTillJob(time: number) {
      const timeDiff = DateTime.fromMillis(time).diff(DateTime.local());
      return DateTime.local().plus(timeDiff).toRelative();
    },
    async getPoDetails() {
      // For showing skeleton component, emptying it here as
      // if we empty it in the preparePoSummary function
      // the execution is too fast for the DOM to catch
      this.poSummary = {}

      // the section starts loading later hence emptying here
      this.inventoryConfig = {}
      this.atpCalcDetails = {}
      this.poAndAtpDetails = {}

      try {
        let resp: any
        let payload: any
        const variantId = this.currentVariant.productId
        this.poAndAtpDetails.activePo = {}

        const productCategories = this.currentVariant.productCategories;

        // Getting PO ATP
        resp = await StockService.getProductFutureAtp({ "productId": variantId })
        if (!hasError(resp)) {
          this.poAndAtpDetails.totalPoAtp = resp.data?.futureAtp
        } else if (hasError(resp) && resp?.data?.error !== "No record found") {
          showToast(this.$t("Something went wrong, could not fetch", { data: 'total ATP' }))
        }

        const hasPreOrderCategory = productCategories?.includes(this.preOrderCategoryId);
        const hasBackorderCategory = productCategories?.includes(this.backorderCategoryId);

        if (hasPreOrderCategory || hasBackorderCategory) {
          payload = {
            "inputFields": {
              "productId": variantId,
              "productCategoryId": hasPreOrderCategory ? this.preOrderCategoryId : this.backorderCategoryId,
              "productCategoryId_op": "equals"
            },
            "entityName": "ProductCategoryDcsnRsn",
            "fieldList": ["productId", "purchaseOrderId", "fromDate"],
            "viewSize": 1,
            "orderBy": "createdDate DESC"
          } as any;
          resp = await OrderService.getActivePoId(payload)
          if (!hasError(resp)) {
            const activePO = resp.data?.docs[0];
            this.poAndAtpDetails.activePoId = activePO.purchaseOrderId
            // TODO Check if it is still needed
            this.poAndAtpDetails.activePoFromDate = activePO.fromDate
          }
        }
        
        if (this.poAndAtpDetails.activePoId) {
          payload = {
            "inputFields": {
              "productId": variantId,
              "orderId": this.poAndAtpDetails.activePoId,
              "orderTypeId": "PURCHASE_ORDER",
              "orderTypeId_op": "equals"
            },
            "entityName": "PreOrderPOItem",
            "fieldList": ["orderId", "orderExternalId", "estimatedDeliveryDate", "isNewProduct", "quantity", "availableToPromise"],
            "viewSize": 1
          } as any;

          resp = await OrderService.getActivePoDetails(payload)

          if (hasError(resp) && resp?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'active PO details' }))
          else this.poAndAtpDetails.activePo = resp.data?.error ? {}: resp.data?.docs[0]

        } else if (this.poAndAtpDetails.totalPoAtp > 0) {
          // Need to get the active PO with oldest estimate delivery date
          payload = {
            "inputFields": {
              "productId": variantId,
              "orderTypeId": "PURCHASE_ORDER",
              "statusId": ["ITEM_CREATED", "ITEM_APPROVED"],
              "statusId_op": "in",
              "availableToPromise": 0,
              "availableToPromise_op": "greaterThan",
              "estimatedDeliveryDate_op": "greaterThanFromDayStart",
            },
            "entityName": "PreOrderPOItem",
            "sortBy": "estimatedDeliveryDate ASC",
            "fieldList": ["orderId", "orderExternalId", "estimatedDeliveryDate", "isNewProduct", "quantity", "availableToPromise"],
            "viewSize": 1
          } as any;

          resp = await OrderService.getActivePoDetails(payload)

          if (hasError(resp) && resp?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'active PO details' }))
          else {
            this.poAndAtpDetails.activePo = resp.data?.error ? {}: resp.data?.docs[0]
            this.poAndAtpDetails.activePoId = this.poAndAtpDetails.activePo.orderId
          }
        }

        if (this.poAndAtpDetails.activePoId) {
          payload = {
            "json": {
              "params": {
                "rows": 0,
              },
              "filter": `docType: ORDER AND orderTypeId: SALES_ORDER AND productId: ${variantId} AND productStoreId: ${this.currentEComStore.productStoreId} AND correspondingPoId: ${this.poAndAtpDetails.activePoId}`,
              "query": "*:*",
            }
          }
          resp = await OrderService.getCrspndgSalesOrdr(payload)
          if (resp && hasError(resp)) showToast(this.$t("Something went wrong, could not fetch", { data: 'corresponding sales order count' }))
          else this.poAndAtpDetails.crspndgSalesOrdr = resp?.data?.response.numFound
        }

        payload = {
          "inputFields": {
            "productId": variantId,
            "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
            "orderStatusId_op": "in",
            "itemStatusId": ["ITEM_CREATED", "ITEM_APPROVED"],
            "itemStatusId_op": "in",
            "estimatedDeliveryDate_op": "greaterThanFromDayStart",
            "orderTypeId": "PURCHASE_ORDER",
            "orderTypeId_op": "equals"
          },
          "entityName": "OrderHeaderAndItems",
          "viewSize": 1
        }
        resp = await OrderService.getPoItemCount(payload)
        if (hasError(resp) && resp?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'total PO items' }))
        else this.poAndAtpDetails.totalPoItems = resp.data?.error === "No record found" ? 0 : resp.data?.count // count is zero if not records are found

        
      } catch (error) {
        showToast(translate('Something went wrong'))
        console.error(error)
      }
    },
    async getAtpCalcDetails() {
      try {
        const requests = []
        let payload = { "productId": this.currentVariant.productId } as any
        requests.push(StockService.getProductInventoryAvailable(payload).catch((error: any) => error))

        payload = { 
          ...payload,
          "productStoreId": this.currentEComStore.productStoreId
        }
        requests.push(StockService.getProductOnlineAtp(payload).catch((error: any) => error))
        
        const promiseResult = await Promise.allSettled(requests)
        // promise.allSettled returns an array of result with status and value fields
        let resp = promiseResult.map((respone: any) => respone.value) as any
        if (hasError(resp[0]) && resp[0]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'quantity on hand' }))
        else this.atpCalcDetails.totalQOH = resp[0].data?.quantityOnHandTotal

        if (hasError(resp[1]) && resp[1]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'online ATP' }))
        else this.atpCalcDetails.onlineAtp = resp[1].data?.onlineAtp

        if (typeof this.atpCalcDetails.totalQOH === 'number' && typeof this.atpCalcDetails.onlineAtp === 'number') {
          this.atpCalcDetails.excludedAtp = resp[0].data?.quantityOnHandTotal - resp[1].data?.onlineAtp
        }
      } catch (error) {
        showToast(translate('Something went wrong'))
        console.error(error)
      }
    },
    async confirmInvConfigUpdate(header: string, message: string, successButtonLabel: string){
      const alert = await alertController.create({
        header: translate(header),
        message: translate(message),
        buttons: [{
          text: translate('Cancel'),
          role: 'cancel'
        },
        {
          text: translate(successButtonLabel),
          role: 'success',
        }]
      });

      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === 'success';
    },
    async updateReserveInvConfig(event: any) {
      // For preventing ion-toggle from toggling
      event.stopImmediatePropagation();

      const isChecked = event.target.checked;
      const successButtonLabel = isChecked ? 'disable' : 'enable';
      const header = isChecked ? 'Disable Reserve Inventory?' : 'Enable Reserve Inventory?';
      const message = isChecked ? 'Disabling inventory reservations prevents committed inventory from being reduced until it has been shipped. Orders that are pending allocation or haven’t been shipped will not be reduced from sellable inventory.' : 'Enabling inventory reservations reduces inventory counts for committed inventory before it has been shipped. Committed inventory includes orders waiting to be brokered or waiting to be shipped.';

      if (!(await this.confirmInvConfigUpdate(header, message, successButtonLabel))) {
        return;
      }

      const value = !isChecked;
      const config = this.getInventoryConfig('reserveInv', this.currentEComStore.productStoreId)
      // Handled initial programmatical update
      if ((config.reserveInventory === "Y" && value) || (config.reserveInventory === "N" && !value)) {
        return
      }
      try {
        const resp = await UtilService.updateReserveInvConfig({ value, config })
        if (!hasError(resp)) {
          event.target.checked = value;
          showToast(translate('Configuration updated'))
          await this.store.dispatch('util/getReserveInvConfig', { productStoreId: this.currentEComStore.productStoreId, forceUpdate: true })
        } else {
          showToast(translate('Failed to update configuration'))
        }
      } catch (err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }
    },
    async updatePreOrdPhyInvHoldConfig(event: any) {
      // For preventing ion-toggle from toggling
      event.stopImmediatePropagation();

      const isChecked = event.target.checked;
      const successButtonLabel = isChecked ? 'disable' : 'enable';
      const header = isChecked ? 'Disable Hold Pre-order Physical Inventory?' : 'Enable Hold Pre-order Physical Inventory?';
      const message = isChecked ? 'Disabling this setting will push excess physical inventory for pre-sell products online and start selling them as in-stock items.' : 'Enabling this setting will prevent pre-selling products from publishing physical inventory online until their pre-selling queue is cleared.';

      if (!(await this.confirmInvConfigUpdate(header, message, successButtonLabel))) {
        return;
      }

      const value = !isChecked;
      const config = this.getInventoryConfig('preOrdPhyInvHold', this.currentEComStore.productStoreId)
      // Handled initial programmatical update
      // TODO - update the usage from true/false to Y/N
      if ((config.settingValue === value) || (typeof value === 'boolean' && (config.settingValue == 'true') === value)) {
        return
      }

      try {
        // fetching to handle case when config wasn't initially found on the serve
        // but has been created meanwhile by some other user
        // TODO Find a better way
        await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', { productStoreId: this.currentEComStore.productStoreId, forceUpdate: true })

        // if fromDate is not present, it has not been created on the server
        if (!this.getInventoryConfig('preOrdPhyInvHold', this.currentEComStore.productStoreId).fromDate) {
          const resp = await UtilService.createPreOrdPhyInvHoldConfig()
          if (hasError(resp)) {
            showToast(translate('Failed to update configuration'))
            return
          }
          event.target.checked = value;
        } else {
          const resp = await UtilService.updatePreOrdPhyInvHoldConfig({ value, config })
          if (!hasError(resp)) {
            event.target.checked = value;
            showToast(translate('Configuration updated'))
          } else {
            showToast(translate('Failed to update configuration'))
          }
        }
        // TODO update value directly instead of get again
        await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', { productStoreId: this.currentEComStore.productStoreId, forceUpdate: true })
      } catch (err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }
    },
    async prepareInvConfig() {
      this.inventoryConfig = {}
      try {
        await this.store.dispatch('util/getReserveInvConfig', { productStoreId: this.currentEComStore.productStoreId, forceUpdate: false })
        this.inventoryConfig.reserveInvStatus = this.getInventoryConfig('reserveInv', this.currentEComStore.productStoreId)?.reserveInventory
      } catch(error) {
        console.error(error);
      }
      try {
        await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', { productStoreId: this.currentEComStore.productStoreId, forceUpdate: false })
        this.inventoryConfig.preOrdPhyInvHoldStatus = this.getInventoryConfig('preOrdPhyInvHold', this.currentEComStore.productStoreId)?.settingValue
      } catch(error) {
        console.error(error);
      }
    },
    hasCategory() {
      return this.currentVariant.productCategories?.includes(this.preOrderCategoryId) || this.currentVariant.productCategories?.includes(this.backorderCategoryId);
    },
    async preparePoSummary() {
      this.poSummary.eligible = this.poAndAtpDetails.totalPoAtp > 0 && this.atpCalcDetails.onlineAtp === 0;

      const productCategories = this.currentVariant.productCategories;
      const hasPreOrderCategory = productCategories?.includes(this.preOrderCategoryId);
      const hasBackorderCategory = productCategories?.includes(this.backorderCategoryId);

      const hasCategory = (hasPreOrderCategory || hasBackorderCategory);
      if (this.poSummary.eligible && hasCategory) {
        const categoryName = hasPreOrderCategory ? 'pre-order' : 'back-order';
        if (this.poAndAtpDetails.activePoFromDate) {
          this.poSummary.header = this.$t("Added to at", { categoryName, addedDateTime: this.getDateTime(this.poAndAtpDetails.activePoFromDate) });
        } else {
          this.poSummary.header = this.$t("Added to", { categoryName });
        }
        this.poSummary.body = this.$t("When this product entered there was no sellable inventory and was available in", { categoryName, poItemATP: this.poAndAtpDetails.activePo.quantity , poId: this.poAndAtpDetails.activePo.orderExternalId ? this.poAndAtpDetails.activePo.orderExternalId : this.poAndAtpDetails.activePo.orderId  });
      } else if (!this.poSummary.eligible && !hasCategory) {
        const presellingJob = this.getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT');
        if (Object.keys(presellingJob).length === 0 || !presellingJob.runTime) {
          this.poSummary.header = this.$t("Pre-sell processing disabled");
        } else {
          this.poSummary.header = this.$t("Preselling processed at", { processingDateTime: this.getDateTime(presellingJob.runTime) });
        }
        if (this.atpCalcDetails.onlineAtp > 0) {
          this.poSummary.body = this.$t("This product is not preselling because it is in stock.");
        } else {
          this.poSummary.body = this.$t("This product is not preselling because there is no active PO available for it.");
        }
      } else if (this.poSummary.eligible && !hasCategory) {
        const categoryName = this.poAndAtpDetails.activePo?.isNewProduct === "Y" ? 'pre-order' : 'back-order';      
        const presellingJob = this.getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT');
        if (Object.keys(presellingJob).length === 0 || !presellingJob.runTime) {
          this.poSummary.header = this.$t("Pre-sell processing disabled");
        } else {
          this.poSummary.header = this.$t("Adding to", { categoryName, addingTime: this.timeTillJob(presellingJob.runTime) });
        }
        this.poSummary.body = this.$t("This product will begin pre-selling because it is out of stock and purchase order is available.", { poId: this.poAndAtpDetails.activePo.orderExternalId ? this.poAndAtpDetails.activePo.orderExternalId : this.poAndAtpDetails.activePo.orderId });
      } else if (!this.poSummary.eligible && hasCategory) {
        const categoryName = hasPreOrderCategory ? 'pre-order' : 'back-order';
        const presellingJob = this.getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT');
        if (Object.keys(presellingJob).length === 0 || !presellingJob.runTime) {
          this.poSummary.header = this.$t("Pre-sell processing disabled");
        } else {
          const headerMessage = this.isPastTime(presellingJob.runTime) ? "Removed from" : "Removing from";
          this.poSummary.header = this.$t(headerMessage, { categoryName, removeTime: this.timeTillJob(presellingJob.runTime) });
        }
        if (this.atpCalcDetails.onlineAtp > 0) {
          this.poSummary.body = this.$t("This product will be removed from because it is in stock", { categoryName });
        } else {
          this.poSummary.body = this.$t("This product will be removed from because it doesn’t have active purchase orders", { categoryName });
        }
      }

      this.poSummary.categoryId = hasPreOrderCategory ? this.preOrderCategoryId : hasBackorderCategory ? this.backorderCategoryId : ""
      // Currently we are only having one shop listing condition
      // will improve the logic as the listing conditions increase
      this.poSummary.listedCount = this.shopListings.reduce((count: number, listData: any) =>
        (listData.status === 'active' && !listData.containsError) ? count + 1 : count
      , 0)

      try {
        this.prepareListingCountStatusMsg()
      } catch (error) {
        console.error(error)
      }
    },
    isCategoryValid() {
      const poCategoryId = this.poAndAtpDetails.activePo?.isNewProduct === "Y" ? this.preOrderCategoryId : this.backorderCategoryId;
      return (this.poSummary.eligible && this.poSummary.categoryId && (!this.poAndAtpDetails.activePo || poCategoryId === this.poSummary.categoryId) ) || (!this.poSummary.eligible && !this.poSummary.categoryId)
    },
    isShopifyListingValid() {
      // Checking if it is linked
      const shopListings = this.shopListings.filter((shopListing: any) => shopListing.shopifyShopProductId)
      // Checking if we have the data
      const shopListingsWithMissingData = shopListings.filter((shopifyListing: any) => !shopifyListing.status)
      return !(shopListingsWithMissingData.length > 0) && ((this.poSummary.eligible && shopListings.length === this.poSummary.listedCount) || (!this.poSummary.eligible && shopListings.length !== this.poSummary.listedCount))
    },
    prepareListingCountStatusMsg() {
      // Checking if it is linked
      const shopListings = this.shopListings.filter((shopListing: any) => shopListing.shopifyShopProductId)
      // Checking if we have the data
      const shopListingsWithMissingData = shopListings.filter((shopifyListing: any) => !shopifyListing.status)
      if (shopListingsWithMissingData.length === shopListings.length) {
        this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
      } else if (shopListingsWithMissingData.length > 0) {
        this.poSummary.listingCountStatusMessage = this.$t("Some listing data not available")
      } else if (!this.poSummary.listedCount) {
        this.poSummary.listingCountStatusMessage = this.$t("Not listed on any stores")
      } else if (shopListings.length === this.poSummary.listedCount) {
        this.poSummary.listingCountStatusMessage = this.$t("Listed on all stores")
      } else if (shopListings.length > this.poSummary.listedCount) {
        this.poSummary.eligible 
          ? this.poSummary.listingCountStatusMessage = this.$t("Not listed on store(s)", { count: this.configsByStores.length - this.poSummary.listedCount })
          : this.poSummary.listingCountStatusMessage = this.$t("Listed on store(s)", { count: this.poSummary.listedCount })
      }
      // Get the first record with promise date
      const shopListingWithPromiseDate = shopListings.find((shopifyListing: any) => shopifyListing.status === 'active' && shopifyListing.promiseDate)
      shopListingWithPromiseDate && (this.poSummary.promiseDate = DateTime.fromFormat(shopListingWithPromiseDate.promiseDate, "MM/dd/yyyy").toLocaleString(DateTime.DATE_MED))
    },
    async getShopifyConfigsByStore() {
      try {
        let payload = {
          "inputFields": {
            "productStoreId": this.currentEComStore.productStoreId,
            "accessScopeEnumId": "SHOP_NO_ACCESS",
            'accessScopeEnumId_op': 'notEqual'
          },
          "orderBy": "name ASC",
          "entityName": "ShopifyShopAndConfig",
          "fieldList": ["shopifyConfigId", "shopId", "name"],
          "viewSize": 20
        } as any

        const resp = await ShopifyService.getShopifyShopConfig(payload)
        if (!hasError(resp)) {
          this.configsByStores = resp.data.docs
        }
      } catch (error) {
        console.error(error)
      }
    },
    async prepareShopListings() {
      // TODO Use ShopifyShopProduct to check if product is associated
      this.shopListings = []
      try {
        if (!this.configsByStores.length) return

        let resp: any
        let payload = {
          "inputFields": {
            "statusId": "SERVICE_PENDING",
            "statusId_op": "equals",
            'systemJobEnumId': "JOB_PREORDER_CAT_SYC",
            'systemJobEnumId_op': 'equals'
          },
          "noConditionFind": "Y",
          "fieldList": ["runTime", "jobId"],
          "viewSize": 1
        } as any

        resp = await JobService.fetchJobInformation(payload)
        if (!hasError(resp)) {
          this.listingJobRunTime = resp.data.docs[0].runTime
        }
        const configs = {} as any;

        const shopifyConfigsAndProductIds = this.configsByStores.reduce((shopifyConfigsAndProductIds: any, config: any) => {
          const shopifyShop = shopifyConfigsAndProductIds[config.shopId] || {}
          !shopifyShop.variantProductId && (shopifyShop.variantProductId = this.getProductIdentificationId(this.currentVariant.goodIdentifications, 'ShopifyShopProduct/' + config.shopId))
          !shopifyShop.hcVariantProductId && (shopifyShop.hcVariantProductId = this.currentVariant.productId)
          shopifyConfigsAndProductIds[config.shopId] = shopifyShop;
          configs[config.shopId] = config;
          return shopifyConfigsAndProductIds
        }, {})

        await Promise.allSettled(Object.keys(configs).map(async (shopId: any) => {
          const configAndIdData = shopifyConfigsAndProductIds[shopId];
          let listData = {
            ...configs[shopId], // adding shopify shop information to be available for showing name
          } as any
          if (!configAndIdData.variantProductId && !configAndIdData.hcVariantProductId) {
            this.shopListings = [...this.shopListings, listData]
            // TODO Find a better way
            return Promise.resolve(this.shopListings)
          }
          listData.shopifyShopProductId = configAndIdData.variantProductId
          payload = {
            "json": {
              "params": {
                "rows": 1,
                "sort": "_timestamp_ desc",
              } as any,
              "filter": `docType: BULKOPERATION
                  AND operation: 'SHOP_PREORDER_SYNC'
                  AND data_productVariantUpdate_productVariant_id: ("gid://shopify/ProductVariant/${configAndIdData.variantProductId}" OR "gid://hotwax/ProductVariant/id/${configAndIdData.hcVariantProductId}")
                  AND data_productVariantUpdate_productVariant_metafields_edges_node_namespace: "HC_PREORDER"`,
              "query": "*:*",
            },
            "coreName": "shopifyCore"
          }

          resp = await ShopifyService.getShopifyConfigDetails(payload)
          if (!hasError(resp)) {
            if (resp.data.response.docs.length === 0) {
              this.shopListings = [...this.shopListings, listData]
              // TODO Find a better way
              return Promise.resolve(this.shopListings)
            }
            const listDataDoc = JSON.parse(JSON.stringify(resp.data.response.docs[0]))
            const metafieldValueList  = listDataDoc.data_productVariantUpdate_productVariant_metafields_edges_node_value;
            const metafieldValue = metafieldValueList.length > 0 ? JSON.parse(metafieldValueList[0]): {};
            listData = {
              ...listData,
              containsError: listDataDoc.contains_error[0],
              listingTime: metafieldValue["last_updated_at"],
              status: metafieldValue.status,
              promiseDate: metafieldValue["promise_date"]
            }
            let listingTime = ''
            if(listData.listingTime) {
              listingTime = DateTime.fromFormat(listData.listingTime, "MMM dd,yyyy HH:mm:ss").toLocaleString(DateTime.DATETIME_MED);
            }
            if (!listData.containsError) {
              if (listData.status === 'inactive') {
                // showing the job's runTime as listing time, and not showing listing time if not present
                listingTime && (listData.listingTimeAndStatus = this.$t("Delisted at", { listingTime }))
                listData.listingStatus = 'Not listed'
              } else {
                listingTime && (listData.listingTimeAndStatus = this.$t("Listed at", { listingTime }))
                listData.listingStatus = 'Listed'
              }
            } else {
              // If it failed to update, considered the status must old
              if (listData.status === 'inactive') {
                // showing the job's runTime as listing time
                listingTime && (listData.listingTimeAndStatus = this.$t("Delisting failed at", { listingTime }))
                listData.listingStatus = 'Listed'
              } else {
                listingTime && (listData.listingTimeAndStatus = this.$t("Listing failed at", { listingTime }))
                listData.listingStatus = 'Not listed'
              }
            }
            this.shopListings = [...this.shopListings, listData]
            return Promise.resolve(resp)
          } else {
            return Promise.reject(resp)
          }
        }))
      } catch (error) {
        console.error(error)
      }
    },
    getProductIdentificationId(identifications: any, id: string) {
      let externalId = ''
      if (identifications) {
        const externalIdentification = identifications.find((identification: any) => identification.startsWith(id))
        const externalIdentificationSplit = externalIdentification ? externalIdentification.split('/') : [];
        externalId = externalIdentificationSplit[2] ? externalIdentificationSplit[2] : '';
      }
      return externalId;
    },
    isPastTime(time: number) {
      const timeDiff: any = DateTime.fromMillis(time).diff(DateTime.local());
      return timeDiff.values.milliseconds <= 0;
    },
    async copyAuditMsg() {
      const { Clipboard } = Plugins;
      const auditMsg = this.poSummary.header + '\n' + this.poSummary.body

      await Clipboard.write({
        string: auditMsg
      }).then(() => {
        showToast(this.$t("Copied to clipboard"));
      })
    },
    getSortedShopListings(shopListings: any) {
      // using return based sorting instead of localeCompare
      // as localeCompare is slower
      return shopListings.sort((a: any, b: any) => a.name < b.name ? -1 : 1)
    }
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    return {
      alertCircleOutline,
      Actions,
      checkmarkCircleOutline,
      chevronForwardOutline,
      copyOutline,
      hasPermission,
      router,
      shirtOutline,
      store
    };
  },
});
</script>
<style scoped>
.header {
  display: grid;
  grid-template-columns: 200px 1fr 400px;
  grid-gap: 16px;
  padding: 16px 16px 48px;
}

.product-info {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(343px, 1fr));
  align-items: start;
}

ion-card-title > h3 {
  margin: 0;
}

ion-skeleton-text {
  height: 100%;
}

@media (max-width: 991px) {
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
}
</style>
