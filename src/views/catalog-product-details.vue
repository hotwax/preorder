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

        <div class="product-info">
          <div v-if="!Object.keys(currentVariant).length" class="ion-padding">
            <ion-skeleton-text animated style="width: 60%;" />
            <ion-skeleton-text animated style="width: 80%;" />
          </div>
          <div v-else class="ion-padding">
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
            <ion-list v-else-if="!Object.keys(currentVariant).length" >
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated />
              </ion-item>
            </ion-list>

            <ion-list v-if="selectedSize">
              <ion-list-header>{{ $t("Sizes") }} </ion-list-header>
              <ion-item lines="none">
                <ion-row>
                  <ion-chip :outline="selectedSize !== sizeFeature" :key="sizeFeature" v-for="sizeFeature in features[selectedColor]" @click="selectedSize !== sizeFeature && applyFeature(sizeFeature, 'size')">
                    <ion-label class="ion-text-wrap">{{ sizeFeature }}</ion-label>
                  </ion-chip>
                </ion-row>
              </ion-item>
            </ion-list>
            <ion-list v-else-if="!Object.keys(currentVariant).length">
              <ion-skeleton-text class="ion-margin" animated style="width: 30%" />
              <ion-item lines="none">
                <ion-skeleton-text animated />
              </ion-item>
            </ion-list>
          </div>
        </div>

        <!-- <div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ $t("Product has been accepting pre-orders from 20 March 2023 against PO #1234") }}
              </ion-card-title>
            </ion-card-header>
            <ion-item lines="none">
              <ion-label>{{ $t("Eligible") }}</ion-label>
              <ion-label slot="end">{{ $t("Yes") }}</ion-label>
              <ion-icon slot="end" color="success" :icon="checkmarkCircleOutline" />
            </ion-item>
            <ion-item lines="none">
              <ion-label>{{ $t("Category") }}</ion-label>
              <ion-label slot="end">{{ $t("Pre-order") }}</ion-label>
              <ion-icon slot="end" color="success" :icon="checkmarkCircleOutline" />
            </ion-item>
            <ion-item lines="none">
              <ion-label>{{ $t("Shopify") }}</ion-label>
              <ion-label slot="end">{{ $t("List on all stores") }}</ion-label>
              <ion-icon slot="end" color="success" :icon="checkmarkCircleOutline" />
            </ion-item>
            <ion-item lines="none">
              <ion-label>{{ $t("Promise date") }}</ion-label>
              <ion-label slot="end">{{ $t("20 May 2023") }}</ion-label>
            </ion-item>
          </ion-card>
        </div> -->
      </div>

      <!-- <hr />

      <div class="ion-padding-start" lines="none">
        <h3>{{ $t("Purchase order and Online ATP calculation") }}</h3>
      </div>

      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Active purchase order") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item v-if="!pOAndATPDetails.purchaseOrderId && !pOAndATPDetails.estimatedDeliveryDate">
            <ion-skeleton-text animated style="width: 70%; height: 20%;" />
          </ion-item>
          <ion-item v-else>
            <ion-label>{{ pOAndATPDetails.purchaseOrderId }}</ion-label>
            <ion-label slot="end">{{ pOAndATPDetails.estimatedDeliveryDate && getTime(pOAndATPDetails.estimatedDeliveryDate) }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Ordered") }}</ion-label>
            <ion-label slot="end">{{ $t("10") }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Available") }}</ion-label>
            <ion-label slot="end">{{ $t("100") }}</ion-label>
          </ion-item>

          <ion-item lines="full">
            <ion-label>{{ $t("Corresponding sales order") }}</ion-label>
            <ion-label slot="end">{{ $t("100") }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO items") }}</ion-label>
            <ion-label slot="end">{{ $t("50") }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>{{ $t("Total PO ATP") }}</ion-label>
            <ion-label slot="end">{{ $t("200") }}</ion-label>
          </ion-item>
        </ion-card> 

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Online ATP calculation") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item>
            <ion-label>{{ $t("Online ATP") }}</ion-label>
            <ion-label slot="end">{{ $t("0") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Quantity on hand") }}</ion-label>
            <ion-label slot="end">{{ $t("0") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Excluded ATP") }}</ion-label>
            <ion-label slot="end">{{ $t("100") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Reserve inventory") }}</ion-label>
            <ion-label slot="end">{{ $t("100") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Hold pre-order reset inventory") }}</ion-label>
            <ion-toggle slot="end" />
          </ion-item>
        </ion-card>
      </section> -->

      <hr />

      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t('Category and brokering jobs') }}</h3>
            </ion-card-title>
          </ion-card-header>

          <div>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Presell computation') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end" :color="!getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime ? 'medium' : ''">
                <p>{{ getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button v-if="Object.keys(getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT')).length" class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_REL_PREODR_CAT'), 'Presell computation')">
                <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
              </ion-button>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Order brokering') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end" :color="!getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime ? 'medium' : ''">
                <p>{{ getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_BKR_ORD').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button v-if="Object.keys(getCtgryAndBrkrngJob('JOB_BKR_ORD')).length" class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_BKR_ORD'), 'Order brokering')">
                <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
              </ion-button>
            </ion-item>

            <ion-item>
              <ion-label class="ion-text-wrap">
                <h3>{{ $t('Auto releasing') }}</h3>
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime && timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').lastRunTime) }}</p>
              </ion-label>
              <ion-label slot="end" :color="!getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime ? 'medium' : ''">
                <p>{{ getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime ? timeTillJob(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE').runTime) : $t('disabled')}}</p>
              </ion-label>
              <ion-button v-if="Object.keys(getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE')).length" class="job-action" fill="clear" slot="end" @click="openJobActionsPopover($event, getCtgryAndBrkrngJob('JOB_RLS_ORD_DTE'), 'Auto releasing')">
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
  IonToolbar,
  IonTitle,
  IonRow,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
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
      pOAndATPDetails: {} as any
    }
  },
  computed: {
    ...mapGetters({
      product: "product/getCurrentCatalogProduct",
      currentEComStore: 'user/getCurrentEComStore',
      getCtgryAndBrkrngJob: "job/getCtgryAndBrkrngJob"
    })
  },
  async ionViewWillEnter() {
    await this.store.dispatch('product/setCurrentCatalogProduct', { productId: this.$route.params.productId })
    if (this.product.variants) {
      this.getFeatures()
      this.updateVariant()
    }
    await this.getCtgryAndBrkrngJobs()
  },
  methods: {
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
    }
  },
  setup() {
    const store = useStore();
    return {
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
