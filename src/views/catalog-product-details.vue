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
          <ion-card v-if="pOAndATPDetails.isLoaded && pOSummary.isLoaded">
            <ion-item v-if="pOSummary.header" lines="none">
              <ion-label class="ion-text-wrap">{{ pOSummary.header }}</ion-label>
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Eligible") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.isActivePO ? $t("Yes") : $t("No") }}</ion-label>
              <ion-icon v-if="pOSummary.isActivePO" slot="end" color="success" :icon="checkmarkCircleOutline" />
              <ion-icon v-else slot="end" color="warning" :icon="alertCircleOutline" />
            </ion-item>
            <ion-item>
              <ion-label>{{ $t("Category") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.categoryId === 'PREORDER_CAT' ? 'Pre-order' : pOSummary.categoryId === 'BACKORDER_CAT' ? 'Back-order' : 'None' }}</ion-label>
              <ion-icon v-if="pOSummary.categoryId === 'PREORDER_CAT' || pOSummary.categoryId === 'BACKORDER_CAT'" slot="end" color="success" :icon="checkmarkCircleOutline" />
              <ion-icon v-else slot="end" color="warning" :icon="alertCircleOutline" />
            </ion-item>
            <!-- <ion-item>
              <ion-label>{{ $t("Shopify") }}</ion-label>
              <ion-label slot="end">{{ $t("List on all stores") }}</ion-label>
              <ion-icon slot="end" color="success" :icon="checkmarkCircleOutline" />
            </ion-item> -->
            <ion-item v-if="pOSummary.isActivePO">
              <ion-label>{{ $t("Promise date") }}</ion-label>
              <ion-label slot="end">{{ pOSummary.promiseDate }}</ion-label>
            </ion-item>
          </ion-card>
          <ion-card v-else>
            <ion-item>
              <ion-skeleton-text animated style="height: 80%; width: 90%;" />
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
        </div>
      </div>

      <hr />

      <div v-if="pOAndATPDetails.isLoaded" class="ion-padding-start">
        <h3>{{ $t("Presell eligibility") }}</h3>
      </div>
      <div v-else>
        <ion-item lines="none">
          <ion-skeleton-text animated style="width: 50%; height: 50%;" />
        </ion-item>
      </div>

      <section>
        <ion-card v-if="pOAndATPDetails.isLoaded">
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
        <ion-card v-else>
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

        <ion-card v-if="inventoryConfig.isLoaded">
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
        <ion-card v-else>
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
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Presell computation') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT'), 'Presell computation')">
                <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
              </ion-button>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Order brokering') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_BKR_ORD'), 'Order brokering')">
                <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
              </ion-button>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Auto releasing') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end">
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE'), 'Auto releasing')">
                <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
              </ion-button>
            </ion-item>
          </div>
        </ion-card>

        <!-- <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Shop listing status') }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Store 1') }}</h5>
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('Listed') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Store 1') }}</h5>
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('Listed') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Store 1') }}</h5>
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('Listed') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
        </ion-card> -->
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
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

export default defineComponent({
  name: "catalog-product-details",
  components: {
    Image,
    IonButton,
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
      pOSummary: {} as any
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
  ionViewWillEnter() {
    this.getVariantDetails()
    this.getPODetails()
    this.getATPCalcDetails()
    this.getCtgryAndBrkrngJobs()
  },
  methods: {
    async getVariantDetails() {
      await this.store.dispatch('product/setCurrentCatalogProduct', { productId: this.$route.params.productId })
      if (this.product.variants) {
        this.getFeatures()
        this.updateVariant()
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
          this.pOAndATPDetails.totalPOItems = resp[1].data.count
          this.pOAndATPDetails.crspndgSalesOrdr = resp[2].data.response.numFound
        } else {
          return
        }

        payload = {
          "inputFields": {
            "orderId": this.pOAndATPDetails.activePO.orderId,
            "productId": this.$route.params.variantId,
            "orderStatusId": ["ORDER_CREATED", "ORDER_APPROVED"],
            "orderStatusId_op": "in",
            "orderTypeId": "PURCHASE_ORDER",
            "orderTypeId_op": "equals"
          },
          "entityName": "PurchaseOrderItemAtpSum",
          "fieldList": ["orderId", "totalAtp"],
          "viewSize": 1
        }

        resp = await OrderService.getPOItemATPSum(payload)
        if (!hasError(resp)) {
          this.pOAndATPDetails.totalPOATP = resp.data.docs[0].totalAtp
        } else {
          return
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
      // Handled initial programmatical update
      if ((config.reserveInventory === "Y" && value) 
        || (config.settingValue === value)
        || (typeof value === 'boolean' && (config.settingValue == 'true') === value)
        || (config.reserveInventory === "N" && !value)) {
        return;
      }

      type === 'preOrdPhyInvHold'
      ? await this.store.dispatch('user/updatePreOrdPhyInvHoldStatus', { value, config })
      : await this.store.dispatch('user/updateReserveInvStatus', { value, config })
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
      this.inventoryConfig.isLoaded = true
    },
    async preparePOSummary() {
      this.pOSummary.isActivePO = this.pOAndATPDetails.activePO && Object.keys(this.pOAndATPDetails?.activePO).length
      this.pOSummary.categoryId = this.currentVariant.productCategories?.includes("PREORDER_CAT") ? "PREORDER_CAT" : this.currentVariant.productCategories?.includes("BACKORDER_CAT") ? "BACKORDER_CAT" : ""
      this.pOSummary.promiseDate = this.pOSummary.isActivePO && this.getTime(this.pOAndATPDetails.activePO.estimatedDeliveryDate)

      try {
        // fetch fromDate only for active POs in pre-order/back-order category
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

          this.pOSummary.header = ''
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
        // This product cannot be pre-sold because it doesn’t have active purchase orders.
        // With Hold Pre-order Queue Physical Inventory disabled, the excess inventory is now available for sale online after deducting the queues.
      } catch (error) {
        console.error(error)
      } finally {
        this.pOSummary.isLoaded = true
      }
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
  grid-template-columns: 300px 1fr 300px;
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

.job-action {
  margin-left: 4px;
  color: #555;
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
