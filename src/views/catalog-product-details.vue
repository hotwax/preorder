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
          <Image />
        </div>

        <div class="product-info">
          <div class="ion-padding">
            <h3>Product name</h3>
            <p>SKU</p>
          </div>

          <div class="product-features">
            <ion-list>
              <ion-list-header>{{ $t("Colors") }}</ion-list-header>
              <ion-item lines="none">
                <ion-row>
                  <ion-chip>
                    <ion-label>Blue</ion-label>
                  </ion-chip>
                  <ion-chip>
                    <ion-label>Black</ion-label>
                  </ion-chip>
                  <ion-chip>
                    <ion-label>Gray</ion-label>
                  </ion-chip>
                </ion-row>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>{{ $t("Sizes") }} </ion-list-header>
              <ion-item lines="none">
                <ion-row>
                  <ion-chip>
                    <ion-label>XS</ion-label>
                  </ion-chip>
                  <ion-chip>
                    <ion-label>S</ion-label>
                  </ion-chip>
                  <ion-chip>
                    <ion-label>M</ion-label>
                  </ion-chip>
                  <ion-chip>
                    <ion-label>XL</ion-label>
                  </ion-chip>
                </ion-row>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div>
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
        </div>
      </div>

      <hr />

      <div class="ion-padding-start" lines="none">
        <h3>{{ $t("Presell Eligibility") }}</h3>
      </div>

      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <h3>{{ $t("Active purchase order") }}</h3>
            </ion-card-title>
          </ion-card-header>
          <ion-item>
            <ion-label>{{ $t("#PO134") }}</ion-label>
            <ion-label slot="end">{{ $t("<arrival-date>") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Ordered") }}</ion-label>
            <ion-label slot="end">{{ $t("10") }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Availabke") }}</ion-label>
            <ion-label slot="end">{{ $t("100") }}</ion-label>
          </ion-item>
          <ion-item>
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
          <ion-button fill="clear">
            {{ $t('View purchase orders') }}
          </ion-button>
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
          <ion-button fill="clear">
            {{ $t('View inventory') }}
          </ion-button>
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
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Pre-order/back-order computation') }}</h5>
              <p>{{ $t('in 10 minutes') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Order brokering') }}</h5>
              <p>{{ $t('in 10 minutes') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h5>{{ $t('Auto releasing') }}</h5>
              <p>{{ $t('in 10 minutes') }}</p>
            </ion-label>
            <ion-label slot="end">
              <p>{{ $t('12 minutes ago') }}</p>
            </ion-label>
            <ion-icon slot="end" :icon="chevronForwardOutline" />
          </ion-item>
        </ion-card>

        <ion-card>
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
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonPage,
  IonButtons,
  IonBackButton,
  IonContent,
  IonLabel,
  IonChip,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonListHeader,
  IonList,
  IonToggle,
  IonRow,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  checkmarkCircleOutline,
  chevronForwardOutline,
  send,
  business,
  closeCircle,
  hourglass,
  calendar,
  close,
  list,
  refresh,
  ribbon
} from "ionicons/icons";
import { useStore } from "@/store";
import Image from '@/components/Image.vue';
import { DateTime } from 'luxon';

export default defineComponent({
  name: "catalog-product-details",
  components: {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonRow,
    Image,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonContent,
    IonToggle,
    IonChip,
    IonTitle,
    IonHeader,
    IonPage,
    IonItem,
    IonList,
    IonToolbar,
    IonListHeader,
  },
  data() {
    return {
      //
    }
  },
  methods: {
    //
  },
  setup() {
    const store = useStore();
    return {
      checkmarkCircleOutline,
      chevronForwardOutline,
      Image,
      store
    };
  },
});
</script>
<style scoped>
.header {
  display: grid;
  grid-template-columns: 450px 1fr 450px;
  padding: 16px 16px;
}

.product-info {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  align-items: start;
}

ion-card-title > h3 {
  margin: 0;
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
  }
}
</style>
