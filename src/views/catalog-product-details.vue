<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/catalog"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t("Product details") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="header">
        <div class="product-image">
          <ion-skeleton-text v-if="!Object.keys(currentVariant).length" animated />
          <Image v-else :src="currentVariant.mainImageUrl" />
        </div>

        <div class="product-info" v-if="Object.keys(currentVariant).length">
          <div class="ion-padding">
            <h4>{{ currentVariant.productName }}</h4>
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
            <ion-skeleton-text animated style="width: 40%; height: 80%;" />
            <ion-skeleton-text animated style="width: 60%;" />
          </div>

          <div class="product-features">
            <ion-list>
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 70%;" />
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 70%;" />
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div>
          <ion-card v-if="!poSummary.listingCountStatusMessage">
            <ion-item>
              <ion-skeleton-text animated style="height: 60%; width: 90%;" />
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 40%; width: 70%;" />
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 40%; width: 60%;" />
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 40%; width: 70%;" />
            </ion-item>
            <ion-item>
              <ion-skeleton-text animated style="height: 40%; width: 60%;" />
            </ion-item>
          </ion-card>
          <ion-card v-else>
            <ion-item lines="none">
              <!-- internationalized while preparaion -->
              <ion-label class="ion-text-wrap">{{ poSummary.header }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Eligible") }}</ion-label>
              <ion-label slot="end">{{ poSummary.isActivePo ? $t("Yes") : $t("No") }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Category") }}</ion-label>
              <ion-label slot="end">{{ poSummary.categoryId === 'PREORDER_CAT' ? $t('Pre-order') : poSummary.categoryId === 'BACKORDER_CAT' ? $t('Back-order') : $t('None') }}</ion-label>
              <ion-icon slot="end" :icon="optCategoryStatusIndicator(poSummary) ? checkmarkCircleOutline : alertCircleOutline" :color="optCategoryStatusIndicator(poSummary) ? 'success' : 'warning'" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Shopify listing") }}</ion-label>
              <ion-label slot="end">{{ poSummary.listingCountStatusMessage }}</ion-label>
              <ion-icon slot="end" :icon="optListingStatusIndicator(poSummary) ? checkmarkCircleOutline : alertCircleOutline" :color="optListingStatusIndicator(poSummary) ? 'success' : 'warning'" />
            </ion-item>
            <ion-item v-if="shopListings.length">
              <ion-label class="ion-text-wrap">{{ $t("Promise date") }}</ion-label>
              <ion-label slot="end">{{ poSummary.promiseDate }}</ion-label>
            </ion-item>
          </ion-card>
        </div>
      </div>

      <hr />

      <div v-if="!Object.keys(poAndAtpDetails).length">
        <ion-item lines="none">
          <ion-skeleton-text animated style="width: 50%; height: 50%;" />
        </ion-item>
      </div>
      <div class="ion-padding-start" v-else>
        <h3 v-if="!poAndAtpDetails.lastActivePoId">{{ $t("Presell eligibility") }}</h3>
        <h3 v-else>{{ $t("Purchase order and online ATP calculation") }}</h3>
      </div>

      <section>
        <ion-card v-if="!Object.keys(poAndAtpDetails).length">
          <ion-item>
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
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>
              <h3 v-if="!poAndAtpDetails.lastActivePoId">{{ $t("Active purchase order") }}</h3>
              <h3 v-else>{{ $t("Last active purchase order")  }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item>
            <ion-label>{{ $t('PO #', { pOId: poAndAtpDetails.activePoId ? poAndAtpDetails.activePoId : poAndAtpDetails.lastActivePoId }) }}</ion-label>
            <ion-label slot="end">{{ poAndAtpDetails.activePo?.estimatedDeliveryDate ? getTime(poAndAtpDetails.activePo.estimatedDeliveryDate) : '-' }}</ion-label>
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

        <ion-card v-if="!Object.keys(inventoryConfig).length">
          <ion-item>
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
        </ion-card>
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Online ATP calculation") }}</h3>
            </ion-card-title>
          </ion-card-header>
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
            <ion-toggle slot="end" :disabled="!Object.keys(getInventoryConfig('reserveInv')).length" :checked="inventoryConfig.reserveInvStatus === 'Y'" @ionChange="updateReserveInvConfig(getInventoryConfig('reserveInv'), $event.detail.checked)"/>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Hold pre-order physical inventory") }}</ion-label>
            <ion-toggle slot="end" :disabled="!Object.keys(getInventoryConfig('preOrdPhyInvHold')).length" :checked="inventoryConfig.preOrdPhyInvHoldStatus" @ionChange="updatePreOrdPhyInvHoldConfig(getInventoryConfig('preOrdPhyInvHold'), $event.detail.checked)"/>
          </ion-item>
        </ion-card>
      </section>

      <hr />

      <section>
        <ion-card v-if="!Object.keys(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT')).length
          || !Object.keys(getCtgryAndBrkrngJob('JOB_BKR_ORD')).length
          || !Object.keys(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE')).length">
          <ion-item>
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
        </ion-card>
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Category and brokering jobs') }}</h3>
            </ion-card-title>
          </ion-card-header>

          <!-- in case jobs are not available -->
          <div v-if="!Object.keys(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT')).length
            && !Object.keys(getCtgryAndBrkrngJob('JOB_BKR_ORD')).length 
            && !Object.keys(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE')).length">
            <ion-item>{{ $t("No jobs found") }}</ion-item>
          </div>

          <div v-else>
            <ion-item detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT'), 'Presell computation')">
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Presell computation') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime) : $t('disabled')}}</p>
              </ion-label>
            </ion-item>

            <ion-item detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_BKR_ORD'), 'Order brokering')">
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Order brokering') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime) : $t('disabled')}}</p>
              </ion-label>
            </ion-item>

            <ion-item detail button @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE'), 'Auto releasing')">
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

        <ion-card v-if="!poSummary.listingCountStatusMessage">
          <ion-item>
            <ion-skeleton-text animated style="height: 40%; width: 60%;" />
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
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Shop listing status') }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item v-if="!Object.keys(shopListings).length">
            {{ $t('No shop listings found') }}
          </ion-item>
          <ion-item v-else v-for="(listData, index) in shopListings" :key="index">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Shop', { index: index + 1 }) }}</h5>
              <!-- internationalized while preparation -->
              <p>{{ listData.listingTimeAndStatus }}</p>
            </ion-label>
            <ion-label :color="listData.containsError ? 'danger' : (listData.status === 'inactive' ? 'warning' : 'success')" slot="end">
              <h5>{{ $t(listData.listingStatus) }}</h5>
            </ion-label>
          </ion-item>
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
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
  chevronForwardOutline
} from "ionicons/icons";
import { useStore } from "@/store";
import Image from '@/components/Image.vue';
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

export default defineComponent({
  name: "catalog-product-details",
  components: {
    Image,
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
      listingJobRunTime: 0
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
    await this.getShopifyConfigsByStore()
    await this.getVariantDetails()
    await this.getCtgryAndBrkrngJobs()
  },
  methods: {
    async getVariantDetails() {
      await this.store.dispatch('product/setCurrentCatalogProduct', { productId: this.$route.params.productId })
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

      const openedVariant = this.product.variants.find((variant: any) => variant.productId === this.$route.params.variantId)
      this.selectedColor = getFeature(openedVariant.featureHierarchy, '1/COLOR/')
      this.selectedSize = getFeature(openedVariant.featureHierarchy, '1/SIZE/')
    },
    async updateVariant() {
      let variant
      if (this.selectedColor || this.selectedSize) {
        variant = this.product.variants.find((variant: any) => {
          const hasSize = getFeature(variant.featureHierarchy, '1/SIZE/') === this.selectedSize
          const hasColor = getFeature(variant.featureHierarchy, '1/COLOR/') === this.selectedColor
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
      await this.getPoDetails()
      await this.prepareShopListings()
      await this.getAtpCalcDetails()
      await this.preparePoSummary()
    },
    async getCtgryAndBrkrngJobs() {
      const systemJobEnumIds = JSON.parse(process.env.VUE_APP_CTGRY_AND_BRKRNG_JOB)
      await this.store.dispatch('job/fetchCtgryAndBrkrngJobs', { systemJobEnumIds })
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
      return DateTime.fromMillis(time).toLocaleString()
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
      this.atpCalcDetails = {}
      this.poAndAtpDetails = {}

      try {
        const requests = []
        let resp: any
        const variantId = this.$route.params.variantId

        let payload = {
          "inputFields": {
            "productId": variantId,
            "productCategoryId": this.currentVariant.productCategories?.includes("PREORDER_CAT") ? "PREORDER_CAT" : this.currentVariant.productCategories?.includes("BACKORDER_CAT") ? "BACKORDER_CAT" : "",
            "productCategoryId_op": "equals"
          },
          "entityName": "ProductCategoryDcsnRsn",
          "fieldList": ["productId", "purchaseOrderId"],
          "viewSize": 1,
          "orderBy": "createdDate DESC"
        } as any

        resp = await OrderService.getActivePoId(payload)

        if (!hasError(resp)) {
          this.poAndAtpDetails.activePoId = resp.data?.docs[0].purchaseOrderId
        }

        if (!this.poAndAtpDetails.activePoId) {
          // get last active PO ID if active PO ID is not found
          payload = {
            "inputFields": {
              "productId": variantId,
            },
            "entityName": "PurchaseOrderItemChangeHistory",
            "sortBy": "entryDate DESC",
            "fieldList": ["poId", "changeDatetime", "changeTypeEnumId"],
            "viewSize": 1
          } as any
          resp = await OrderService.getPoItemChangeHistory(payload)
          if (!hasError(resp)) {
            this.poAndAtpDetails.lastActivePoId = resp.data?.docs[0].poId,
            this.poAndAtpDetails.changeDatetime = resp.data?.docs[0].changeDatetime
          } else if (hasError(resp) && resp.data.error !== "No record found") {
            showToast(this.$t("Something went wrong, could not fetch", { data: 'active PO details' }))
          }
        }

        payload = {
          "inputFields": {
            "productId": variantId,
            ...(this.poAndAtpDetails.activePoId && {
              "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
              "orderStatusId_op": "in"
            }),
            "orderTypeId": "PURCHASE_ORDER",
            "orderTypeId_op": "equals"
          },
          "entityName": "PreOrderPOItem",
          "sortBy": "entryDate DESC",
          "fieldList": ["estimatedDeliveryDate", "isNewProduct", "quantity", "availableToPromise"],
          "viewSize": 1
        }

        requests.push(OrderService.getActivePoDetails(payload).catch((error: any) => error))

        payload = {
          "inputFields": {
            "productId": variantId,
            "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
            "orderStatusId_op": "in",
            "itemStatusId": ["ITEM_CREATED", "ITEM_APPROVED"],
            "itemStatusId_op": "in",
            "estimatedDeliveryDate_op": "greaterThanFromDayStart"
          },
          "entityName": "OrderHeaderAndItems",
          "viewSize": 1
        }

        requests.push(OrderService.getPoItemCount(payload).catch((error: any) => error))

        if (this.poAndAtpDetails.activePoId || this.poAndAtpDetails.lastActivePoId) {
          payload = {
            "json": {
              "params": {
                "rows": 0,
              },
              "filter": `docType: ORDER AND orderTypeId: SALES_ORDER AND productStoreId: ${this.currentEComStore.productStoreId} AND correspondingPoId: ${this.poAndAtpDetails.activePoId ? this.poAndAtpDetails.activePoId : this.poAndAtpDetails.lastActivePoId}`,
              "query": "*:*",
            }
          }
          requests.push(OrderService.getCrspndgSalesOrdr(payload).catch((error: any) => error))
        }
        
        const promiseResult = await Promise.allSettled(requests)
        // promise.allSettled returns an array of result with status and value fields
        resp = promiseResult.map((respone: any) => respone.value)
        this.poAndAtpDetails.activePo = {}
        if (!hasError(resp[0]) || !hasError(resp[1]) || (resp[2] && !hasError(resp[2]))) {
          if (hasError(resp[0]) && resp[0]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'active PO details' }))
          else this.poAndAtpDetails.activePo = resp[0]?.error ? {}: resp[0]?.data?.docs[0]
          
          if (hasError(resp[1]) && resp[1]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'total PO items' }))
          else this.poAndAtpDetails.totalPoItems = resp[1].data?.count

          if (resp[2] && hasError(resp[2])) showToast(this.$t("Something went wrong, could not fetch", { data: 'corresponding sales order count' }))
          else this.poAndAtpDetails.crspndgSalesOrdr = resp[2].data?.response.numFound
        }

        resp = await StockService.getProductFutureAtp({ "productId": variantId })
        if (!hasError(resp)) {
          this.poAndAtpDetails.totalPoAtp = resp.data?.poAtp
        } else if (hasError(resp) && resp?.data?.error !== "No record found") {
          showToast(this.$t("Something went wrong, could not fetch", { data: 'total ATP' }))
        }
      } catch (error) {
        showToast(translate('Something went wrong'))
        console.error(error)
      }
    },
    async getAtpCalcDetails() {
      try {
        const requests = []
        let payload = { "productId": this.$route.params.variantId } as any
        requests.push(StockService.getProductInventoryAvailable(payload).catch((error: any) => error))

        payload = { 
          ...payload,
          "productStoreId": this.currentEComStore.productStoreId
        }
        requests.push(StockService.getProductOnlineAtp(payload).catch((error: any) => error))
        
        const promiseResult = await Promise.allSettled(requests)
        // promise.allSettled returns an array of result with status and value fields
        let resp = promiseResult.map((respone: any) => respone.value) as any
        if (!hasError(resp[0]) || !hasError(resp[1])) {
          if (hasError(resp[0]) && resp[0]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'quantity on hand' }))
          else this.atpCalcDetails.totalQOH = resp[0].data?.quantityOnHandTotal

          if (hasError(resp[1]) && resp[1]?.data?.error !== "No record found") showToast(this.$t("Something went wrong, could not fetch", { data: 'online ATP' }))
          else this.atpCalcDetails.onlineAtp = resp[1].data?.onlineAtp

          if (typeof this.atpCalcDetails.totalQOH === 'number' && typeof this.atpCalcDetails.onlineAtp === 'number') {
            this.atpCalcDetails.excludedAtp = resp[0].data?.quantityOnHandTotal - resp[1].data?.onlineAtp
          }
        }
      } catch (error) {
        showToast(translate('Something went wrong'))
        console.error(error)
      } finally {
        await this.prepareInvConfig()
      }
    },
    async updateReserveInvConfig(config: any, value: boolean) {
      // Handled initial programmatical update
      if ((config.reserveInventory === "Y" && value) || (config.reserveInventory === "N" && !value)) {
        return
      }
      try {
        const resp = await UtilService.updateReserveInvConfig({ value, config })
        if (!hasError(resp)) {
          showToast(translate('Configuration updated'))
          await this.store.dispatch('util/getReserveInvConfig', this.currentEComStore.productStoreId)
        } else {
          showToast(translate('Failed to update configuration'))
        }
      } catch (err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }
    },
    async updatePreOrdPhyInvHoldConfig(config: any, value: boolean) {
      // Handled initial programmatical update
      // TODO - update the usage from true/false to Y/N
      if ((config.settingValue === value) || (typeof value === 'boolean' && (config.settingValue == 'true') === value)) {
        return
      }

      try {
        // fetching to handle case when config wasn't initially found on the serve
        // but has been created meanwhile by some other user
        await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', this.currentEComStore.productStoreId)

        // if fromDate is not present, it has not been created on the server
        if (!this.getInventoryConfig('preOrdPhyInvHold').fromDate) {
          const resp = await UtilService.createPreOrdPhyInvHoldConfig()
          if (hasError(resp)) {
            showToast(translate('Failed to update configuration'))
            return
          }
        }
        const resp = await UtilService.updatePreOrdPhyInvHoldConfig({ value, config })
        if (!hasError(resp)) {
          showToast(translate('Configuration updated'))
          await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', this.currentEComStore.productStoreId)
        } else {
          showToast(translate('Failed to update configuration'))
        }
      } catch (err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }
    },
    async prepareInvConfig() {
      await this.store.dispatch('util/getReserveInvConfig', this.currentEComStore.productStoreId)
      await this.store.dispatch('util/getPreOrdPhyInvHoldConfig', this.currentEComStore.productStoreId)

      this.inventoryConfig.reserveInvStatus = this.getInventoryConfig('reserveInv')?.reserveInventory
      this.inventoryConfig.preOrdPhyInvHoldStatus = this.getInventoryConfig('preOrdPhyInvHold')?.settingValue
    },
    async preparePoSummary() {
      this.poSummary.isActivePo = (this.poAndAtpDetails.activePo && Object.keys(this.poAndAtpDetails?.activePo).length) && this.poAndAtpDetails.onlineAtp > 0
      this.poSummary.isLastActivePo = this.poAndAtpDetails.lastActivePoId && Object.keys(this.poAndAtpDetails?.activePo).length
      this.poSummary.categoryId = this.currentVariant.productCategories?.includes("PREORDER_CAT") ? "PREORDER_CAT" : this.currentVariant.productCategories?.includes("BACKORDER_CAT") ? "BACKORDER_CAT" : ""
      const category = this.poSummary.categoryId === 'PREORDER_CAT' ? 'pre-order' : 'back-order'
      // Currently we are only having one shop listing condition
      // will improve the logic as the listing conditions increase
      this.poSummary.listedCount = this.shopListings.reduce((count: number, listData: any) =>
        (listData.status === 'active' && !listData.containsError) ? count + 1 : count
      , 0)

      const poSummaryConditions = {
        isActiveAndCategorized: this.poSummary.isActivePo && this.poSummary.categoryId,
        isActiveAndNotCategorized: this.poSummary.isActivePo && !this.poSummary.categoryId,
        isLastActiveAndCategorized: this.poSummary.isLastActivePo && this.poSummary.categoryId,
        isLastActiveAndNotCategorized: this.poSummary.isLastActivePo && !this.poSummary.categoryId,
        isOnlyCategorized: (!this.poSummary.isActivePo && !this.poSummary.isLastActivePo) && this.poSummary.categoryId,
      }

      try {
        // fetch fromDate only for active POs in pre-order/back-order category
        if (poSummaryConditions.isActiveAndCategorized) {
          let resp: any = await OrderService.getPoFromDate({
            "inputFields": {
              "productId": this.$route.params.variantId,
              "productCategoryId": this.poSummary.categoryId,
              "productCategoryId_op": "equals"
            },
            "entityName": "PreOrderCategoryProducts",
            "fieldList": ["productId", "fromDate"],
            "viewSize": 1
          })

          if (!hasError(resp)) {
            const fromDate = resp.data.docs[0].fromDate
            if (this.configsByStores.length > this.poSummary.listedCount) {
              this.poSummary.listingCountStatusMessage = this.$t("Not listed on store(s)", { count: this.configsByStores.length - this.poSummary.listedCount })
              this.poSummary.header = this.$t("Added to pre-order category on, against PO # but not listed on all stores", { fromDate: this.getTime(fromDate), POID: this.poAndAtpDetails.activePoId })
            } else if (this.configsByStores.length === this.poSummary.listedCount) {
              this.poSummary.listingCountStatusMessage = this.$t("Listed on all stores")
              this.poSummary.header = this.$t("Product has been accepting from against PO #", { category, fromDate: this.getTime(fromDate), POID: this.poAndAtpDetails.activePoId })
            }
          }
          this.poSummary.promiseDate = this.getTime(this.poAndAtpDetails.activePo.estimatedDeliveryDate)
        } else if (poSummaryConditions.isActiveAndNotCategorized) {
          const eligibleCategory = this.poAndAtpDetails.activePo.isNewProduct === 'Y' ? 'pre-order' : 'back-order'
          this.poSummary.header = this.$t("Product is eligible for but not added to the category", { category: eligibleCategory })
          // as it is not added to any category it is assumed that it won't be listed
          !this.shopListings.length
            ? this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
            : this.poSummary.listingCountStatusMessage = this.$t("Not listed on any stores")
        } else if (poSummaryConditions.isLastActiveAndNotCategorized) {
          if (!this.poSummary.listedCount) {
            this.poSummary.header = this.$t("Stopped accepting from as there is no active PO", { category, changeDatetime: this.getTime(this.poAndAtpDetails.changeDatetime) })
            !this.shopListings.length
              ? this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
              : this.poSummary.listingCountStatusMessage = this.$t("Not listed on any stores")
          } else {
            if (this.configsByStores.length > this.poSummary.listedCount) {
              this.poSummary.listingCountStatusMessage = this.$t("Listed on store(s)", { count: this.configsByStores.length - this.poSummary.listedCount })
              this.poSummary.header = this.$t("Removed from category on because there is no active PO but still listed on stores", { listedCount: this.poSummary.listedCount, changeDatetime: this.getTime(this.poAndAtpDetails.changeDatetime) })
              this.poSummary.promiseDate = DateTime.fromISO(this.shopListings[0].listingTime).toLocaleString({ month: '2-digit', day: '2-digit', year: '2-digit' })
            } else {
              this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
            }
          }
        } else if (poSummaryConditions.isLastActiveAndCategorized) {
          this.poSummary.header = this.$t("Not eligible for accepting but currently added in category", { category })
          this.prepareListingCountStatusMsg()
        } else if (poSummaryConditions.isOnlyCategorized) {
          if (typeof this.atpCalcDetails.onlineAtp === 'number' && this.atpCalcDetails.onlineAtp > 0) {
            this.poSummary.header = this.$t("Product is currently in stock and cannot accept", { category })
          } else {
            this.poSummary.header = this.$t("Product has no active purchase order to be eligible for accepting", { category })
          }
          this.prepareListingCountStatusMsg()
        } else {
          if (this.inventoryConfig.preOrdPhyInvHoldStatus === 'false' && typeof this.atpCalcDetails.onlineAtp === 'number' && this.atpCalcDetails.onlineAtp > 0) {
            this.poSummary.header = this.$t("With Hold Pre-order Queue Physical Inventory disabled, the excess inventory is now available for sale online after deducting the queues")
          } else {
            this.poSummary.header = this.$t("Product cannot be pre-sold because it does not have active purchase orders")
          }
          !this.shopListings.length
            ? this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
            : this.poSummary.listingCountStatusMessage = this.$t("Not listed on any stores")
        }
      } catch (error) {
        console.error(error)
      }
    },
    prepareListingCountStatusMsg() {
      if (!this.shopListings.length) {
        this.poSummary.listingCountStatusMessage = this.$t("Listing data not available")
      } else if (!this.poSummary.listedCount) {
        this.poSummary.listingCountStatusMessage = this.$t("Not listed on any stores")
      } else if (this.configsByStores.length === this.poSummary.listedCount) {
        this.poSummary.listingCountStatusMessage = this.$t("Listed on all stores")
        this.poSummary.promiseDate = DateTime.fromISO(this.shopListings[0].listingTime).toLocaleString({ month: '2-digit', day: '2-digit', year: '2-digit' })
      } else if (this.configsByStores.length > this.poSummary.listedCount) {
        this.poSummary.isActivePo 
          ? this.poSummary.listingCountStatusMessage = this.$t("Not listed on store(s)", { count: this.configsByStores.length - this.poSummary.listedCount })
          : this.poSummary.listingCountStatusMessage = this.$t("Listed on store(s)", { count: this.configsByStores.length - this.poSummary.listedCount })
        this.poSummary.promiseDate = DateTime.fromISO(this.shopListings[0].listingTime).toLocaleString({ month: '2-digit', day: '2-digit', year: '2-digit' })
      }
    },
    async getShopifyConfigsByStore() {
      try {
        let payload = {
          "inputFields": {
            "productStoreId": this.currentEComStore.productStoreId
          },
          "entityName": "ShopifyShopAndConfig",
          "fieldList": ["shopifyConfigId", "shopId"],
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

        const shopifyConfigsAndProductIds = this.configsByStores.reduce((shopifyConfigsAndProductIds: any, config: any) => {
          const shopifyShop = shopifyConfigsAndProductIds[config.shopId] || {}
          !shopifyShop.variantProductId && (shopifyShop.variantProductId = this.getProductIdentificationId(this.currentVariant.goodIdentifications, 'ShopifyShopProduct/' + config.shopId))
          shopifyConfigsAndProductIds[config.shopId] = shopifyShop;
          return shopifyConfigsAndProductIds
        }, {})

        await Promise.allSettled(Object.values(shopifyConfigsAndProductIds).map(async (configAndIdData: any) => {
          payload = {
            "json": {
              "params": {
                "rows": 1,
                "sort": "_timestamp_ desc",
              } as any,
              "filter": `docType: BULKOPERATION
                  AND operation: 'SHOP_PREORDER_SYNC'
                  AND data_productVariantUpdate_productVariant_id: "gid://shopify/ProductVariant/${configAndIdData.variantProductId}"
                  AND data_productVariantUpdate_productVariant_metafields_edges_node_namespace: "HC_PREORDER"`,
              "query": "*:*",
            },
            "coreName": "shopifyCore"
          }

          resp = await ShopifyService.getShopifyConfigDetails(payload)
          if (!hasError(resp)) {
            let listData = JSON.parse(JSON.stringify(resp.data.response.docs[0]))
            listData = {
              containsError: listData.contains_error[0],
              listingTime: listData._timestamp_,
              status: JSON.parse(listData.data_productVariantUpdate_productVariant_metafields_edges_node_value[0]).status
            }
            if (!listData.containsError) {
              if (listData.status === 'inactive') {
                // showing the job's runTime as listing time
                listData.listingTimeAndStatus = this.$t("Listing at", { listingTime: DateTime.fromMillis(this.listingJobRunTime).toLocaleString(DateTime.DATETIME_MED) })
                listData.listingStatus = 'Not listed'
              } else {
                listData.listingTimeAndStatus = this.$t("Listed at", { listingTime: DateTime.fromISO(listData.listingTime).toLocaleString(DateTime.DATETIME_MED) })
                listData.listingStatus = 'Listed'
              }
            } else {
              listData.listingTimeAndStatus = this.$t("Listing failed at", { listingTime: DateTime.fromISO(listData.listingTime).toLocaleString(DateTime.DATETIME_MED) })
              listData.listingStatus = 'Not listed'
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
    optCategoryStatusIndicator(poSummary: any) {
      return (poSummary.isActivePo && poSummary.categoryId)
        || (poSummary.isLastActivePo && !poSummary.categoryId) 
    },
    optListingStatusIndicator(poSummary: any) {
      return (poSummary.isActivePo && poSummary.categoryId && poSummary.listedCount === this.configsByStores.length)
        || (poSummary.isLastActivePo && !poSummary.categoryId && !poSummary.listedCount) 
    }
  },
  setup() {
    const store = useStore();
    return {
      alertCircleOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      store
    };
  },
});
</script>
<style scoped>
.header {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
