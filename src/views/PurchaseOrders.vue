<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("Purchase orders") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :scroll-events="true" @ionScroll="enableScrolling()">
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list class="purchase-order-controls" lines="full">
        <ion-searchbar
          :placeholder="$t('Search purchase orders')"
          v-model="localQuery.keyword"
          v-on:keyup.enter="search()"
          @ionClear="localQuery.keyword = ''; search()">
        </ion-searchbar> |

        <ion-item lines="none">
          <ion-icon slot="start" :icon="swapVerticalOutline" />
          <ion-select :label="$t('Sort by')" interface="popover" :value="sortBy" @ionChange="sortBy = $event.detail.value; search()">
            <ion-select-option value="-orderDate">{{ $t("Newest first") }}</ion-select-option>
            <ion-select-option value="orderDate">{{ $t("Oldest first") }}</ion-select-option>
          </ion-select>
        </ion-item> |

        <ion-item lines="none">
          <ion-icon slot="start" :icon="filterOutline" />
          <ion-select :label="$t('Facility')" interface="popover" :value="facilityId" @ionChange="facilityId = $event.detail.value; search()">
            <ion-select-option value="">{{ $t("All") }}</ion-select-option>
            <ion-select-option v-for="id in Object.keys(facilities)" :key="id" :value="id">{{ getFacilityName(id) }}</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <div v-if="isLoading" class="empty-state">
        <ion-spinner name="crescent" />
        <ion-label>{{ $t("Loading Purchase Orders") }}</ion-label>
      </div>

      <ion-list v-else-if="!orders.length">
        <ion-item>
          <ion-label>
            <p>{{ $t("Active purchase orders not found, try clearing filters or changing product store") }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <main v-else class="purchase-order-results">
        <div v-for="order in orders" :key="order.orderId" @click="router.push(`/purchase-order-detail/${order.orderId}`)">
          <section>
            <div class="list-item">
              <ion-item lines="none">
                <ion-label>
                  <strong>{{ order.orderExternalId || order.orderName }}</strong>
                  <p>{{ order.orderId }}</p>
                </ion-label>
              </ion-item>
              <div class="tablet ion-text-center">
                <ion-label>
                  {{ getFacilityName(order.facilityId) }}
                  <p>{{ $t("Facility") }}</p>
                </ion-label>
              </div>
              <div class="tablet ion-text-center">
                <ion-label>
                  {{ formatDate(order.estimatedDeliveryDate) }}
                  <p>{{ $t("Promise date") }}</p>
                </ion-label>
              </div>
              <div class="tablet ion-text-center">
                <ion-label>
                  {{ formatDate(order.orderDate) }}
                  <p>{{ $t("Order date") }}</p>
                </ion-label>
              </div>
              <ion-badge :color="getStatusColor(order.orderStatusDesc)">{{ order.orderStatusDesc || order.orderStatusId }}</ion-badge>
            </div>
          </section>
        </div>
      </main>

      <ion-infinite-scroll @ionInfinite="loadMore($event)" id="infinite-scroll" threshold="100px" v-show="isScrollable" ref="infiniteScrollRef">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="$t('Loading')"></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/vue";
import { arrowDownOutline, arrowUpOutline, chevronDownOutline, documentTextOutline, downloadOutline, filterOutline, swapVerticalOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { defineComponent } from "vue";
import { mapGetters } from "vuex";
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import { getProductIdentificationValue, useProductIdentificationStore } from "@hotwax/dxp-components";
import { getStatusColor } from "@/utils";

export default defineComponent({
  name: "purchase-orders",
  components: {
    IonBadge,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonPage,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar
  },
  data() {
    return {
      expandedGroups: [] as string[],
      filterEvent: undefined as any,
      groupBy: 'ORDER_ITEM',
      groupingOptions: [
        { value: 'ORDER_ITEM', label: 'Order item' },
        { value: 'ORDER_PARENT_PRODUCT', label: 'Order and parent product' },
        { value: 'PARENT_PRODUCT', label: 'Parent product' },
        { value: 'PARENT_PRODUCT_ARRIVAL', label: 'Parent product and arrival date' },
        { value: 'PRODUCT', label: 'Product' },
        { value: 'PRODUCT_ARRIVAL', label: 'Product and arrival date' }
      ],
      localQuery: {
        keyword: '',
        orderStatusId: [] as string[],
        itemStatusId: [] as string[],
        estimatedDeliveryDateFrom: '',
        estimatedDeliveryDateTo: ''
      },
      facilityId: '',
      isLoading: false,
      viewSize: 10,
      isScrollingEnabled: false,
      showFilters: false,
      showOrderItems: true,
      sortBy: '-orderDate',
      sortDirection: 'asc',
      statusColor: {
        "Approved": "primary",
        "Completed": "success",
        "Cancelled": "danger"
      } as Record<string, string>
    }
  },
  computed: {
    ...mapGetters({
      orders: 'purchaseOrder/getList',
      facilities: 'util/getFacilities',
      getFacilityName: 'util/getFacilityName',
      total: 'purchaseOrder/getListTotal',
      isScrollable: 'purchaseOrder/isScrollable',
      getProduct: 'product/getProduct',
      currentEComStore: 'user/getCurrentEComStore',
      productStoreFacilities: 'user/getProductStoreFacilities'
    }),
  },
  ionViewWillEnter() {
    this.isScrollingEnabled = false
    this.search();
    this.store.dispatch("util/getEnumDetails");
    this.store.dispatch("util/fetchStatuses");
  },
  methods: {
    parseDate(value: any) {
      if (value === undefined || value === null) return null;
      const stringValue = String(value).trim();
      if (!stringValue || ['null', 'undefined'].includes(stringValue)) return null;
      if (typeof value === 'number' || /^\d+$/.test(stringValue)) {
        const numericValue = Number(stringValue);
        const millis = stringValue.length === 10 ? numericValue * 1000 : numericValue;
        const numericDate = DateTime.fromMillis(millis);
        return numericDate.isValid ? numericDate : null;
      }
      const isoDate = DateTime.fromISO(stringValue);
      const sqlDate = DateTime.fromSQL(stringValue);
      const parsedDate = isoDate.isValid ? isoDate : sqlDate;
      return parsedDate.isValid ? parsedDate : null;
    },
    formatDate(value: any) {
      return this.parseDate(value)?.toFormat('d LLL yyyy') || '-';
    },
    async fetchPurchaseOrders(pageIndex = 0) {
      await this.store.dispatch("purchaseOrder/fetchPurchaseOrders", {
        orderBy: this.sortBy,
        ...(this.localQuery.keyword.trim() && { keyword: this.localQuery.keyword.trim() }),
        ...(this.facilityId && { facilityId: this.facilityId }),
        productStoreId: this.currentEComStore.productStoreId,
        pageIndex,
        limit: this.viewSize
      });
    },
    async search() {
      this.isLoading = true;
      this.isScrollingEnabled = false;
      await this.fetchPurchaseOrders();
      this.isLoading = false;
    },
    async refresh(event: any) {
      await this.search();
      event.target.complete();
    },
    enableScrolling() {
      const parentElement = (this as any).$refs.contentRef.$el
      const scrollEl = parentElement.shadowRoot.querySelector("div[part='scroll']")
      if (!scrollEl) {
        console.error('[enableScrolling] scrollEl not found — shadow DOM selector may be wrong')
        return
      }
      const scrollHeight = scrollEl.scrollHeight
      const infiniteHeight = (this as any).$refs.infiniteScrollRef.$el.offsetHeight
      const scrollTop = scrollEl.scrollTop
      const threshold = 100
      const height = scrollEl.offsetHeight
      const distanceFromInfinite = scrollHeight - infiniteHeight - scrollTop - threshold - height
      this.isScrollingEnabled = distanceFromInfinite >= 0
    },
    async loadMore(event: any) {
      // Prevents fetching the next page when the user has not scrolled
      if(!(this.isScrollingEnabled && this.isScrollable)) {
        await event.target.complete()
        return
      }
      await this.fetchPurchaseOrders(Math.ceil(this.orders.length / this.viewSize))
      await event.target.complete()
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const productIdentificationStore = useProductIdentificationStore();
    const productIdentificationPref = productIdentificationStore.getProductIdentificationPref;

    return {
      arrowDownOutline,
      arrowUpOutline,
      chevronDownOutline,
      documentTextOutline,
      downloadOutline,
      filterOutline,
      getProductIdentificationValue,
      productIdentificationPref,
      router,
      store,
      swapVerticalOutline,
      getStatusColor
    };
  }
});
</script>

<style scoped>
.purchase-order-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 8px 16px 16px;
}

.purchase-order-controls ion-searchbar {
  flex: 1 1 320px;
  padding-inline-start: 0;
  padding-inline-end: 0;
}

.purchase-order-controls ion-item {
  flex: 1 1 280px;
}

.purchase-order-results {
  padding: 16px;
}

.purchase-order-results .list-item {
  --columns-tablet: 5;
  --columns-desktop: 5;
}

.purchase-order-results .purchase-order-group-header {
  --columns-tablet: 2;
  --columns-desktop: 2;
}

.purchase-order-results .product-group {
  --columns-tablet: 4;
  --columns-desktop: 4;
}

.purchase-order-results .product-arrival-group,
.purchase-order-results .parent-product-group {
  --columns-tablet: 4;
  --columns-desktop: 5;
}

.purchase-order-results .parent-product-arrival-group {
  --columns-tablet: 4;
  --columns-desktop: 6;
}

.purchase-order-results .product-arrival-child,
.purchase-order-results .parent-product-arrival-child {
  --columns-tablet: 4;
  --columns-desktop: 4;
}

.section-header {
  display: grid;
  grid-template-areas: "info metadata"
                       "tags tags";
  align-items: center;                     
}

@media (max-width: 720px) {
  .purchase-order-controls,
  .purchase-order-results {
    padding-inline-start: 0;
    padding-inline-end: 0;
  }
}
</style>