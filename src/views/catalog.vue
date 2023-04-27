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
            <ion-searchbar />
            <ion-item lines="none">
              <ion-chip v-for="filter in filters" :key="filter.value" @click="updateFilters(filter.value)">
                <!-- Used v-show as v-if caused the ion-chip click animation to render weirdly -->
                <ion-icon v-show="selectedFilter === filter.value" :icon="checkmarkOutline" />
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
                <h5>Preorder computation</h5>
                <p>13 minutes ago</p>
              </ion-label>
              <ion-label slot="end">
                <p>in 3 mins</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h5>Backorder computation</h5>
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

      <div class="list-item">
        <ion-item lines="none" class="tablet">
          <ion-thumbnail slot="start">
            <Image />
          </ion-thumbnail>
          <ion-label>
            <h5>Product name</h5>
            <p>SKU</p>
          </ion-label>
        </ion-item>

        <ion-chip class="tablet" outline>
          <ion-label>Removed from preorder category</ion-label>
        </ion-chip>

        <ion-item lines="none" class="tablet">
          <ion-label class="ion-text-center">
            <h5>12-01-2023</h5>
            <p>from date</p>
          </ion-label>
        </ion-item>
        
        <ion-item lines="none" class="tablet">
          <ion-label class="ion-text-center">
            <h5>12-01-2023</h5>
            <p>thru date</p>
          </ion-label>
        </ion-item>
      </div>
      <div class="list-item">
        <ion-item lines="none" class="tablet">
          <ion-thumbnail slot="start">
            <Image />
          </ion-thumbnail>
          <ion-label>
            <h5>Product name</h5>
            <p>SKU</p>
          </ion-label>
        </ion-item>

        <ion-chip class="tablet" outline>
          <ion-label>Removed from preorder category</ion-label>
        </ion-chip>

        <ion-item lines="none" class="tablet">
          <ion-label class="ion-text-center">
            <h5>12-01-2023</h5>
            <p>from date</p>
          </ion-label>
        </ion-item>
        
        <ion-item lines="none" class="tablet">
          <ion-label class="ion-text-center">
            <h5>12-01-2023</h5>
            <p>thru date</p>
          </ion-label>
        </ion-item>
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
import { mapGetters } from "vuex";
import {
  checkmarkOutline,
  ellipsisVerticalOutline,
  lockClosedOutline,
  sendOutline,
  shirtOutline,
} from 'ionicons/icons';
import Image from '@/components/Image.vue';

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
      selectedFilter: 'PRE_ORDER',
      filters: [{
        name: 'Pre-order',
        value: 'PRE_ORDER'
      }, {
        name: 'Back-order',
        value: 'BACK_ORDER'
      }, {
        name: 'Never in any category',
        value: 'NEVER'
      }, {
        name: 'Removed from category',
        value: 'REMOVED'
      }]
    }
  },
  methods: {
    updateFilters(value: string) {
      if(this.selectedFilter === value) return
      this.selectedFilter = value
    }
  },
  setup() {
    return {
      checkmarkOutline,
      ellipsisVerticalOutline,
      lockClosedOutline,
      sendOutline,
      shirtOutline
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
