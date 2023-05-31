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
                <ion-skeleton-text animated style="width: 70%;"/>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 70%;"/>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div>
          <ion-card v-if="!Object.keys(pOSummary).length">
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
              <ion-label class="ion-text-wrap">{{ pOSummary.header }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Eligible") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.isActivePO ? $t("Yes") : $t("No") }}</ion-label>
              <ion-icon v-if="pOSummary.isActivePO" slot="end" color="success" :icon="checkmarkCircleOutline" />
              <ion-icon v-else slot="end" color="warning" :icon="alertCircleOutline" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Category") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.categoryId === 'PREORDER_CAT' ? $t('Pre-order') : pOSummary.categoryId === 'BACKORDER_CAT' ? $t('Back-order') : $t('None') }}</ion-label>
              <ion-icon v-if="pOSummary.categoryId === 'PREORDER_CAT' || pOSummary.categoryId === 'BACKORDER_CAT'" slot="end" color="success" :icon="checkmarkCircleOutline" />
              <ion-icon v-else slot="end" color="warning" :icon="alertCircleOutline" />
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">{{ $t("Shopify listing") }}</ion-label>
              <ion-label class="ion-text-wrap" slot="end">{{ pOSummary.listingCountStatus }}</ion-label>
            </ion-item>
            <ion-item v-if="pOSummary.isActivePO">
              <ion-label class="ion-text-wrap">{{ $t("Promise date") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.promiseDate }}</ion-label>
            </ion-item>
          </ion-card>
        </div>
      </div>

      <hr />

      <div v-if="!Object.keys(pOAndATPDetails).length">
        <ion-item lines="none"> 
          <ion-skeleton-text animated style="width: 50%; height: 50%;" />
        </ion-item>
      </div>
      <div class="ion-padding-start" v-else>
        <h3>{{ $t("Presell eligibility") }}</h3>
      </div>

      <section>
        <ion-card v-if="!Object.keys(pOAndATPDetails).length">
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
              <h3>{{ $t("Active purchase order") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item>
            <ion-label>{{ $t('PO #') }} {{ pOAndATPDetails.purchaseOrderId ? pOAndATPDetails.purchaseOrderId : '' }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.activePO?.estimatedDeliveryDate ? getTime(pOAndATPDetails.activePO.estimatedDeliveryDate) : "-" }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Ordered") }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.activePO?.quantity ? pOAndATPDetails.activePO?.quantity : "-" }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Available") }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.activePO?.availableToPromise ? pOAndATPDetails.activePO?.availableToPromise : "-" }}</ion-label>
          </ion-item>

          <ion-item lines="full">
            <ion-label>{{ $t("Corresponding sales order") }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.crspndgSalesOrdr ? pOAndATPDetails.crspndgSalesOrdr : "-" }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO items") }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.totalPOItems ? pOAndATPDetails.totalPOItems : "-" }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO ATP") }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.totalPOATP ? pOAndATPDetails.totalPOATP : "-" }}</ion-label>
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
          <!-- <ion-item>
            <ion-label>{{ $t("Online ATP") }}</ion-label>
            <ion-label slot="end">{{ 0 }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Quantity on hand") }}</ion-label>
            <ion-label slot="end">{{ "0" }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Excluded ATP") }}</ion-label>
            <ion-label slot="end">{{ "100" }}</ion-label>
          </ion-item> -->
          <ion-item>
            <ion-label>{{ $t("Reserve inventory") }}</ion-label>
            <ion-toggle slot="end" :disabled="!Object.keys(getInventoryConfig('reserveInv')).length" :checked="inventoryConfig.reserveInvStatus === 'Y'" @ionChange="updateInvConfig('reserveInv', getInventoryConfig('reserveInv'), $event.detail.checked)"/>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Hold pre-order reset inventory") }}</ion-label>
            <ion-toggle slot="end" :disabled="!Object.keys(getInventoryConfig('preOrdPhyInvHold')).length" :checked="inventoryConfig.preOrdPhyInvHoldStatus" @ionChange="updateInvConfig('preOrdPhyInvHold', getInventoryConfig('preOrdPhyInvHold'), $event.detail.checked)"/>
          </ion-item>
        </ion-card>
        
      </section>

      <hr />

      <section>
        <ion-card v-if="!isCtgryAndBrkrngJobLoaded">
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

        <ion-card v-if="!shopListings.isLoaded">
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
          <ion-item v-if="Object.keys(shopListings).length === 1">
            {{ $t('No shop listings found') }}
          </ion-item>
          <ion-item v-else v-for="(listData, index) in shopListings" :key="index">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Shop', {index: index + 1}) }}</h5>
              <!-- internationalized while preparation -->
              <p>{{ listData.listingTimeAndStatus }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t(listData.listingStatus) }}</p>
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
      pOAndATPDetails: {} as any,
      aTPcalcDetails : {} as any,
      inventoryConfig: {} as any,
      pOSummary: {} as any,
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
      isCtgryAndBrkrngJobLoaded: "job/isCtgryAndBrkrngJobLoaded",
      getInventoryConfig: "user/getInventoryConfig"
    })
  },
  async ionViewWillEnter() {
    await this.getShopifyConfigsByStore()
    await this.getVariantDetails()
    await this.getATPCalcDetails()
    await this.getCtgryAndBrkrngJobs()
  },
  methods: {
    async getVariantDetails() {
      await this.store.dispatch('product/setCurrentCatalogProduct', { productId: this.$route.params.productId })
      if (this.product.variants) {
        this.getFeatures()
        this.updateVariant()
        await this.getPODetails()
        await this.prepareShopListings()
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
    updateVariant() {
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
    timeTillJob (time: any) {
      const timeDiff = DateTime.fromMillis(time).diff(DateTime.local());
      return DateTime.local().plus(timeDiff).toRelative();
    },
    async getPODetails() {
      try {
        const requests = []
        let resp: any

        let payload = {
          "inputFields": {
            "productId": this.$route.params.variantId,
            "productCategoryId": this.currentVariant.productCategories?.includes("PREORDER_CAT") ? "PREORDER_CAT" : this.currentVariant.productCategories?.includes("BACKORDER_CAT") ? "BACKORDER_CAT" : "",
            "productCategoryId_op": "equals"
          },
          "entityName": "ProductCategoryDcsnRsn",
          "fieldList": ["productId", "purchaseOrderId"],
          "viewSize": 1
        } as any

        requests.push(OrderService.getPOID(payload).catch((error: any) => error))

        payload = {
          "inputFields": {
            "productId": this.$route.params.variantId,
            "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
            "orderStatusId_op": "in",
            "orderTypeId": "PURCHASE_ORDER",
            "orderTypeId_op": "equals"
          },
          "entityName": "PreOrderPOItem",
          "sortBy": "entryDate DESC",
          "fieldList": ["orderId", "estimatedDeliveryDate", "isNewProduct", "quantity", "availableToPromise"],
          "viewSize": 1
        }

        requests.push(OrderService.getPOItemAndATPDetails(payload).catch((error: any) => error))

        payload = {
          "json": {
            "params": {
              "rows": 0,
            },
            "filter": `docType: ORDER AND orderTypeId: SALES_ORDER AND productStoreId: ${this.currentEComStore.productStoreId} AND correspondingPoId: ${this.pOAndATPDetails.purchaseOrderId}`,
            "query": "*:*",
          }
        }

        requests.push(OrderService.getCrspndgSalesOrdr(payload).catch((error: any) => error))

        const promiseResult = await Promise.allSettled(requests)
        // promise.allSettled returns an array of result with status and value fields
        resp = promiseResult.map((respone: any) => respone.value)

        this.pOAndATPDetails.activePO = {}
        if (!hasError(resp[0]) && !hasError(resp[1]) && !hasError(resp[2])) {
          this.pOAndATPDetails.purchaseOrderId = resp[0].data.docs[0].purchaseOrderId
          this.pOAndATPDetails.activePO = resp[1].data.docs[0]
          this.pOAndATPDetails.crspndgSalesOrdr = resp[2].data.response.numFound
        }

        payload = {
          "inputFields": {
            "productId": this.$route.params.variantId,
            "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
            "orderStatusId_op": "in",
            "orderTypeId": "PURCHASE_ORDER",
            "orderTypeId_op": "equals"
          },
          "entityName": "PurchaseOrderItemAtpSum",
          "fieldList": ["productId", "totalAtp", "orderId"],
          "viewSize": 50
        }

        // seperate API call for getting total items and ATP as they are 
        // not included with the active PO data
        resp = await OrderService.getPOItemATPSum(payload)

        if (!hasError(resp)) {
          this.pOAndATPDetails.totalPOATP = resp.data.docs.reduce((total: number, poData: any) => poData.totalAtp + total, 0)
          this.pOAndATPDetails.totalPOItems = resp.data.count
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.pOAndATPDetails.isLoaded = true
        // preparePOSummary needs PO details to be fetched first
        await this.preparePOSummary()
      }
    },
    async getATPCalcDetails() {
      await this.prepareInvConfig()
    },
    async updateInvConfig(type: string, config: any, value: boolean) {
      if (type === 'reserveInv') {
        // Handled initial programmatical update
        if ((config.reserveInventory === "Y" && value) || (config.reserveInventory === "N" && !value)) {
          return
        }
        await this.store.dispatch('user/updateReserveInvConfig', { value, config })
      } else {
        // Handled initial programmatical update
        if ((config.settingValue === value) || (typeof value === 'boolean' && (config.settingValue == 'true') === value)) {
          return
        }
        await this.store.dispatch('user/updatePreOrdPhyInvHoldConfig', { value, config })
      }
    },
    async prepareInvConfig() {
      const reserInvConfig = this.getInventoryConfig('reserveInv')
      const preOrdPhyInvHoldConfig = this.getInventoryConfig('preOrdPhyInvHold')

      if (!Object.keys(reserInvConfig).length) {
        await this.store.dispatch('user/getReserveInvConfig', this.currentEComStore.productStoreId)
      }

      if (!Object.keys(preOrdPhyInvHoldConfig).length) {
        await this.store.dispatch('user/getPreOrdPhyInvHoldConfig', this.currentEComStore.productStoreId)
      }

      this.inventoryConfig.reserveInvStatus = reserInvConfig.reserveInventory
      this.inventoryConfig.preOrdPhyInvHoldStatus = preOrdPhyInvHoldConfig.settingValue
    },
    async preparePOSummary() {
      this.pOSummary.isActivePO = this.pOAndATPDetails.activePO && Object.keys(this.pOAndATPDetails?.activePO).length
      this.pOSummary.categoryId = this.currentVariant.productCategories?.includes("PREORDER_CAT") ? "PREORDER_CAT" : this.currentVariant.productCategories?.includes("BACKORDER_CAT") ? "BACKORDER_CAT" : ""
      this.pOSummary.promiseDate = this.pOSummary.isActivePO && this.getTime(this.pOAndATPDetails.activePO.estimatedDeliveryDate)

      try {
        // fetch fromDate only for active POs in pre-order/back-order category
        this.pOSummary.header = ''
        if (this.pOSummary.isActivePO && this.pOSummary.categoryId) {
          let resp: any = await OrderService.getPOFromDate({
            "inputFields": {
              "productId": this.$route.params.variantId,
              "productCategoryId": this.pOSummary.categoryId,
              "productCategoryId_op": "equals"
            },
            "entityName": "PreOrderCategoryProducts",
            "fieldList": ["productId", "fromDate"],
            "viewSize": 1
          })

          // TODO - internationalize header after getting generic strings
          if (!hasError(resp)) {
            const fromDate = resp.data.docs[0].fromDate
            const category = this.pOSummary.categoryId === 'PREORDER_CAT' ? 'pre-order' : 'back-order'
            this.pOSummary.header = `Product has been accepting ${category}s from ${this.getTime(fromDate)} against PO #${this.pOAndATPDetails.purchaseOrderId}`
          }
        } else if (!this.pOSummary.categoryId) {
          if (this.pOSummary.isActivePO) {
            const eligibleCategory = this.pOAndATPDetails.activePO.isNewProduct === 'Y' ? 'pre-order' : 'back-order'
            this.pOSummary.header = `Product is eligible for ${eligibleCategory}s but not added to the ${eligibleCategory} category`
          } else {
            this.pOSummary.header = "This product cannot be pre-sold because it doesn’t have active purchase orders"
          }
        }
        // TODO handle the two left cases for -
        // Added to pre-order category at 10:00 am 20 March 2023, against PO #1234 but not listed on all stores
        // With Hold Pre-order Queue Physical Inventory disabled, the excess inventory is now available for sale online after deducting the queues.
      } catch (error) {
        console.error(error)
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
          // console.log(resp)
          // console.log(this.configsByStores)
          // console.log(shopifyConfigsAndProductIds)
          if (!hasError(resp)) {
            let listData = JSON.parse(JSON.stringify(resp.data.response.docs[0]))
            listData = {
              containsError: listData.contains_error[0],
              listingTime: DateTime.fromISO(listData._timestamp_).toLocaleString(DateTime.DATETIME_MED),
              status: JSON.parse(listData.data_productVariantUpdate_productVariant_metafields_edges_node_value[0]).status
            }
            if (!listData.containsError) {
              if (listData.status === 'inactive') {
                // showing the job's runTime as listing time
                listData.listingTimeAndStatus = this.$t("Listing at", { listingTime: DateTime.fromMillis(this.listingJobRunTime).toLocaleString(DateTime.DATETIME_MED) })
                listData.listingStatus = 'Not listed'
              } else {
                listData.listingTimeAndStatus = this.$t("Listed at", { listingTime: listData.listingTime })
                listData.listingStatus = 'Listed'
              }
            } else {
              listData.listingTimeAndStatus = this.$t("Listing failed at", { listingTime: listData.listingTime })
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
      } finally {
        this.shopListings.isLoaded = true
        // Currently we are only having one shop listing condition
        // will improve the logic as the listing conditions increase
        const activeListingsCount = this.shopListings.reduce((count: number, listData: any) =>
          (listData.status === 'active' && !listData.containsError) ? count + 1 : count
        , 0)
        if (!activeListingsCount) {
          this.pOSummary.listingCountStatus = this.$t("Not listed on any stores")
        } else if (activeListingsCount === this.configsByStores.length) {
          this.pOSummary.listingCountStatus = this.$t("Listed on all stores")
        } else {
          this.pOSummary.listingCountStatus = this.$t("Not listed on store(s)", { count: this.configsByStores.length - activeListingsCount })
        }
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
  grid-template-columns: 270px 1fr 350px;
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
