<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title slot="start">{{ $t("Catalog") }}</ion-title>
        <ion-segment @ionChange="segmentChanged($event)" v-model="segment">
          <ion-segment-button value="all">
            <ion-label>{{ $t("All") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="purchase-orders">
            <ion-label>{{ $t("Purchase orders") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="out-of-stock">
            <ion-label>{{ $t("Out of stock") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="segment == 'all'">
        <div class="search-filter">
          <ion-searchbar />
          <div class="filter-chips">  
            <ion-chip>
              <ion-icon :icon="checkmarkOutline" />
              <ion-label>All</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Pre-order</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Back-order</ion-label>
            </ion-chip>
          </div>
        </div>

        <div class="list-item">
          <ion-item lines="none">
            <ion-icon :icon="shirtOutline" slot="start" />
            <ion-label>1 sku selected</ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div />

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>

        <hr />

        <div class="list-item">
          <ion-item lines="none">
            <ion-thumbnail slot="start">
              <img src="https://cdn.shopify.com/s/files/1/0069/7384/9727/products/test-track.jpg?v=1626255137" />
            </ion-thumbnail>
            <ion-label>
              <p class="overline">Brand</p>
              Virtual
              <p>Shopify SKU</p>
            </ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div class="ion-text-center">
            <ion-chip outline>
              <ion-icon :icon="sendOutline" />
              <ion-label>12 Jan 2021</ion-label>
            </ion-chip>
            <ion-label>PO: #19222</ion-label>
          </div>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>
      </div>

      <div v-if="segment == 'purchase-orders'">
        <div class="search-filter">
          <ion-searchbar />

          <div class="filter-chips">
            <ion-chip>
              <ion-icon :icon="checkmarkOutline" />
              <ion-label>All</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Pre-order</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Back-order</ion-label>
            </ion-chip>
          </div>
        </div>

        <div class="list-item">
          <ion-item lines="none">
            <ion-icon :icon="shirtOutline" slot="start" />
            <ion-label>1 sku selected</ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div />

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>

        <hr />

        <div class="list-item">
          <ion-item lines="none">
            <ion-thumbnail slot="start">
              <img src="https://cdn.shopify.com/s/files/1/0069/7384/9727/products/test-track.jpg?v=1626255137" />
            </ion-thumbnail>
            <ion-label>
              <p class="overline">Brand</p>
              Virtual
              <p>Shopify SKU</p>
            </ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div class="ion-text-center">
            <ion-chip outline>
              <ion-icon :icon="sendOutline" />
              <ion-label>12 Jan 2021</ion-label>
            </ion-chip>
            <ion-label>PO: #19222</ion-label>
          </div>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>
      </div>

      <div v-if="segment == 'out-of-stock'">
        <div class="search-filter">
          <ion-searchbar />

          <div class="filter-chips">
            <ion-chip>
              <ion-icon :icon="checkmarkOutline" />
              <ion-label>All</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Pre-order</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-label>Back-order</ion-label>
            </ion-chip>
          </div>
        </div>

        <div class="list-item">
          <ion-item lines="none">
            <ion-icon :icon="shirtOutline" slot="start" />
            <ion-label>1 sku selected</ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div />

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>

        <hr />

        <div class="list-item">
          <ion-item lines="none">
            <ion-thumbnail slot="start">
              <img src="https://cdn.shopify.com/s/files/1/0069/7384/9727/products/test-track.jpg?v=1626255137" />
            </ion-thumbnail>
            <ion-label>
              <p class="overline">Brand</p>
              Virtual
              <p>Shopify SKU</p>
            </ion-label>
          </ion-item>

          <ion-label class="tablet">
            300
            <p>{{ $t("on PO") }}</p>
          </ion-label>

          <ion-chip outline>
            <ion-icon :icon="lockClosedOutline" />
            <ion-label>200 {{ $t("PO ATP") }}</ion-label>
          </ion-chip>

          <div class="ion-text-center">
            <ion-chip outline>
              <ion-icon :icon="sendOutline" />
              <ion-label>12 Jan 2021</ion-label>
            </ion-chip>
            <ion-label>PO: #19222</ion-label>
          </div>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("back-order") }}</p>
          </ion-label>

          <ion-label class="tablet">
            <ion-toggle />
            <p>{{ $t("pre-order") }}</p>
          </ion-label>

          <ion-checkbox />

          <ion-button fill="clear" color="medium" @click="openPopover">
            <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  popoverController,
} from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import Popover from '../views/shipping-popover.vue';
import {
  checkmarkOutline,
  ellipsisVerticalOutline,
  lockClosedOutline,
  sendOutline,
  shirtOutline,
} from 'ionicons/icons';

export default defineComponent({
  name: 'Catalog',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonMenuButton,
    IonPage,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  },
  methods: {
    segmentChanged(ev: CustomEvent) {
      this.segment = ev.detail.value;
    },
    async openPopover(ev: Event) {
      const popover = await popoverController.create({
        component: Popover,
        event: ev,
        translucent: true,
        showBackdrop: false,
      });
      return popover.present();
    },
  },
  setup() {
    const segment = ref("all");
    return {
      checkmarkOutline,
      ellipsisVerticalOutline,
      lockClosedOutline,
      sendOutline,
      shirtOutline,
      segment,
    };
  },
});
</script>

<style scoped>
.search-filter {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
}

.filter-chips {
  justify-self: end;
}
</style>
