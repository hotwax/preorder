<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("Orders") }}</ion-title>
        <ion-buttons slot="secondary">
          <!-- TODO Add internationalisation -->
          <ion-button @click="deselectAlert()">{{ selectedItemsCount}} {{ $t("item selected")}} </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="openActiveJobs">
            <ion-icon :color='isJobPending ? "warning" : ""' :icon="hourglass" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :scroll-events="true" @ionScroll="enableScrolling()">
      <div class="header">
        <div class="search">
          <ion-searchbar @ionFocus="selectSearchBarText($event)" @ionClear="query.queryString = ''; updateQuery()" :value="query.queryString" v-on:keyup.enter="query.queryString = $event.target.value; updateQuery()"> </ion-searchbar>
        </div> 

        <div class="filters">
          <ion-item>
            <ion-label>{{ $t("Ordered after") }}</ion-label>
            <ion-chip slot="end">
              <!-- 
                TODO Need to fix this
                :value is a recommended way for vuex state but value is not working for date when resetting with close button used v-model instead of :value
                https://vuex.vuejs.org/guide/forms.html#two-way-computed-property
                -->
              <ion-input aria-label="ordered-after" v-model="query.orderedAfter" @ionChange="updateQuery()" type="date" />
              <ion-icon @click='query.orderedAfter = ""' v-if="query.orderedAfter" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Ordered before") }}</ion-label>
            <ion-chip slot="end">
              <ion-input aria-label="ordered-before" v-model="query.orderedBefore" @ionChange="query.orderedBefore = $event.target.value; updateQuery()" type="date" />
              <ion-icon @click='query.orderedBefore = ""' v-if="query.orderedBefore" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Promised after") }}</ion-label>
            <ion-chip slot="end">
              <ion-input aria-label="promised-after" v-model="query.promisedAfter" @ionChange="query.promisedAfter = $event.target.value; updateQuery()" type="date" />
              <ion-icon @click='query.promisedAfter = ""' v-if="query.promisedAfter" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Promised before") }}</ion-label>
            <ion-chip slot="end">
              <ion-input aria-label="promised-before" v-model="query.promisedBefore" @ionChange="query.promisedBefore = $event.target.value; updateQuery()" type="date" />
              <ion-icon @click='query.promisedBefore = ""' v-if="query.promisedBefore" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item>
            <ion-label>{{ $t("Loyalty status") }}</ion-label>
            <ion-chip slot="end">
              <ion-icon :icon="ribbon" />
              <ion-select aria-label="loyalty-status" :placeholder="$t('select')" v-model="query.cusotmerLoyalty"  @ionChange="updateQuery()" interface="popover" interface-options="{showBackdrop:false}">
                <ion-select-option v-for=" (key, value) in cusotmerLoyaltyOptions" v-bind:key="key" :value="value">{{key}}</ion-select-option>
              </ion-select>
              <ion-icon @click='query.cusotmerLoyalty = ""' v-if="query.cusotmerLoyalty" :icon="close"/>
            </ion-chip>
          </ion-item>
          <ion-item lines="none">
             <ion-toggle @ionChange="query.hasPromisedDate = !query.hasPromisedDate; updateQuery()" :checked="!query.hasPromisedDate">{{ $t("Only orders without promise date") }}</ion-toggle>
          </ion-item>
        </div>

         <div class="results">
          <ion-badge color="success">{{ preorderCount }} {{ $t("items preordered")}}</ion-badge>
          <ion-badge color="secondary">{{ ordersTotal }} {{ $t("orders")}}</ion-badge>
        </div> 
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="orders.length === 0">
        <!-- No result -->
        <p v-if="query.hasUpdated">{{ $t("No results found")}}</p>
        <p>{{ $t("Enter an order ID, product name, style name, SKU, customer name, UPCA or external ID")}}</p>
      </div>

      <!-- Orders -->
      <div v-else>
        <div class="order" v-bind:key="order.orderId" v-for="order in orders">
          <div class="order-header">
            <div class="order-id">
              <ion-item lines="none">
                <ion-label>
                  <h1>{{ order.doclist.docs[0].orderName ? order.doclist.docs[0].orderName : order.doclist.docs[0].orderId }}</h1>
                  <p>{{ order.doclist.docs[0].customerPartyName }}</p>
                </ion-label>
              </ion-item>
            </div>

            <div class="order-tags">
              <ion-chip outline v-if="$filters.getCustomerLoyalty(order.doclist.docs[0].orderNotes, cusotmerLoyaltyOptions)">
                <ion-icon :icon="ribbon" />
                <ion-label>{{ $filters.getCustomerLoyalty(order.doclist.docs[0].orderNotes, cusotmerLoyaltyOptions) }}</ion-label>
              </ion-chip>
            </div>

            <div class="order-metadata">
              <ion-note>{{ $t("Order placed on") }} {{ $filters.formatUtcDate(order.doclist.docs[0].orderDate, 'YYYY-MM-DDTHH:mm:ssZ') }}</ion-note>
            </div>
          </div> 

          <div class="order-items">
            <ion-card v-bind:key="item.orderItemSeqId" v-for="item in order.doclist.docs">
              <ion-item lines="none">
                <ion-thumbnail slot="start">
                  <!-- TODO Create a separate component that handles default image -->
                  <DxpShopifyImg :src="getProduct(item.productId).mainImageUrl" size="small"></DxpShopifyImg>
                </ion-thumbnail>
                <ion-label>
                  <h2>{{ getProductIdentificationValue(productIdentificationPref.primaryId, item) ? getProductIdentificationValue(productIdentificationPref.primaryId, item) : item.productName }}</h2>
                  <p v-if="$filters.getFeature(getProduct(item.productId).featureHierarchy, '1/COLOR/')">{{ $t("Color") }} : {{ $filters.getFeature(getProduct(item.productId).featureHierarchy, '1/COLOR/') }}</p>
                  <p v-if="$filters.getFeature(getProduct(item.productId).featureHierarchy, '1/SIZE/')">{{ $t("Size") }} : {{ $filters.getFeature(getProduct(item.productId).featureHierarchy, '1/SIZE/') }}</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-label>{{ $t ("Available to promise") }}</ion-label>
                <p slot="end">{{ getProductStock(item.productId) }}</p>
              </ion-item>
              <ion-item lines="full">
                <ion-label>{{ $t("Promised date") }}</ion-label>
                <p slot="end"> {{ item.promisedDatetime ? $filters.formatUtcDate(item.promisedDatetime, "yyyy-MM-dd'T'HH:mm:ss'Z'") : '-'  }}</p>
              </ion-item>
              <ion-item button @click="item.isChecked = !item.isChecked" lines="none">
                <ion-checkbox :modelValue="item.isChecked" @ionChange="selectItem($event, item)" label-placement="end" justify="start">{{ $t("Select item") }}</ion-checkbox>
                <ion-button fill="clear" color="medium" @click.stop="openPopover($event, item)">
                  <ion-icon slot="icon-only" :icon="ellipsisVertical" />
                </ion-button>
              </ion-item>
            </ion-card>
          </div>
        </div>
          <!--
            When searching for a keyword, and if the user moves to the last item, then the didFire value inside infinite scroll becomes true and thus the infinite scroll does not trigger again on the same page(https://github.com/hotwax/users/issues/84).
            Also if we are at the section that has been loaded by infinite-scroll and then move to the details page then the list infinite scroll does not work after coming back to the page
            In ionic v7.6.0, an issue related to infinite scroll has been fixed that when more items can be added to the DOM, but infinite scroll does not fire as the window is not completely filled with the content(https://github.com/ionic-team/ionic-framework/issues/18071).
            The above fix in ionic 7.6.0 is resulting in the issue of infinite scroll not being called again.
            To fix this we have maintained another variable `isScrollingEnabled` to check whether the scrolling can be performed or not.
            If we do not define an extra variable and just use v-show to check for `isScrollable` then when coming back to the page infinite-scroll is called programatically.
            We have added an ionScroll event on ionContent to check whether the infiniteScroll can be enabled or not by toggling the value of isScrollingEnabled whenever the height < 0.
          -->
        <ion-infinite-scroll @ionInfinite="loadMoreOrders($event)" threshold="100px" id="infinite-scroll" v-show="isScrolleable" ref="infiniteScrollRef">
          <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="$t('Loading')"></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>  
    </ion-content>
 
    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button :disabled="!selectedItemsCount" @click="releaseAlert" fill="outline" color="primary" size="small">
            <ion-icon slot="start" :icon="send" />{{ $t("Release") }}
          </ion-button>
          <ion-button :disabled="!selectedItemsCount" @click="openWarehouseList(selectedItems)" fill="outline" color="dark" size="small">
            <ion-icon slot="start" :icon="business" />{{ $t("Release to a warehouse") }}
          </ion-button>
          <ion-button :disabled="!selectedItemsCount" @click=" editPromiseDate" fill="outline" color="dark" size="small">
            <ion-icon slot="start" :icon="calendar" />{{ $t("Edit promise date") }}
          </ion-button>
          <ion-button :disabled="!selectedItemsCount" @click="cancelAlert" fill="outline" color="danger" size="small">
            <ion-icon slot="start" :icon="closeCircle" /> {{ $t("Cancel") }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBadge,
  IonButtons,
  IonButton,
  IonCard,
  IonChip,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonInput,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonInfiniteScroll, 
  IonInfiniteScrollContent,
  alertController,
  modalController,
  popoverController,
} from "@ionic/vue";
import { computed, defineComponent } from "vue";
import WarehouseModal from "./warehouse-modal.vue";
import BackgroundJobModal from "./background-job-modal.vue";
import PromiseDateModal from "./promise-date-modal.vue";
import Popover from "../views/order-popover.vue";
import {
  pricetag,
  ribbon,
  ellipsisVertical,
  send,
  business,
  calendar,
  closeCircle,
  hourglass,
  close
} from "ionicons/icons";
import { useStore } from "@/store";
import { mapGetters } from "vuex";
import { showToast } from '@/utils'
import { Plugins } from '@capacitor/core';
import { getProductIdentificationValue, DxpShopifyImg, useProductIdentificationStore, useUserStore } from "@hotwax/dxp-components";
import emitter from "@/event-bus";

const { Clipboard } = Plugins;

export default defineComponent({
  name: "orders",
  components: {
    IonBadge,
    IonButtons,
    IonButton,
    IonCard,
    IonChip,
    IonCheckbox,
    IonContent,
    IonFooter,
    IonHeader,
    IonInput,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuButton,
    IonNote,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonThumbnail,
    IonTitle,
    IonToggle,
    IonToolbar,
    IonInfiniteScroll, 
    IonInfiniteScrollContent,
    DxpShopifyImg
  },
  data() {
    return {
      cusotmerLoyaltyOptions : JSON.parse(process.env?.VUE_APP_CUST_LOYALTY_OPTIONS),
      isScrollingEnabled: false
    }
  },
  computed: {
    ...mapGetters({
      orders: 'order/getList',
      preorderCount: 'order/getListPreorders',
      ordersTotal: 'order/getListTotal',
      isScrolleable: 'order/isScrolleable',
      getProductStock: 'stock/getProductStock',
      getProduct: 'product/getProduct',
      isJobPending: 'job/isJobPending',
      jobTotal: 'job/getTotal',
      selectedItems: 'order/getSelectedItems',
      getSelectedItemsToRelease: 'order/getSelectedItemsToRelease',
      selectedItemsToCancel: 'order.getSelectedItemsToCancel',
      selectedItemsCount: 'order/getSelectedItemsCount',
      userProfile: 'user/getUserProfile',
      query: 'order/getQuery',
    }),
  },
  async ionViewWillEnter() {
    this.isScrollingEnabled = false;
  },
  methods: {
    updateQuery() {
      this.query.viewSize = parseInt(process.env.VUE_APP_VIEW_SIZE);
      this.query.viewIndex = 0;
      this.store.dispatch("order/updateQuery", { query: this.query});
    },
    enableScrolling() {
      const parentElement = (this as any).$refs.contentRef.$el
      const scrollEl = parentElement.shadowRoot.querySelector("main[part='scroll']")
      let scrollHeight = scrollEl.scrollHeight, infiniteHeight = (this as any).$refs.infiniteScrollRef.$el.offsetHeight, scrollTop = scrollEl.scrollTop, threshold = 100, height = scrollEl.offsetHeight
      const distanceFromInfinite = scrollHeight - infiniteHeight - scrollTop - threshold - height
      if(distanceFromInfinite < 0) {
        this.isScrollingEnabled = false;
      } else {
        this.isScrollingEnabled = true;
      }
    },
    async loadMoreOrders(event: any) {
      // Added this check here as if added on infinite-scroll component the Loading content does not gets displayed
      if(!(this.isScrollingEnabled && this.isScrolleable)) {
        await event.target.complete();
      }
      this.query.viewIndex = Math.ceil(this.orders.length / process.env.VUE_APP_VIEW_SIZE);
      this.store.dispatch("order/updateQuery", { query: this.query}).then(async () => {
        await event.target.complete();
      });
    },
    async releaseItems() {
      emitter.emit("presentLoader")
      const selectedItems = this.getSelectedItemsToRelease("RELEASED_ORD_PARKING", "RELEASED"); // TODO Make it configurable
      const json = JSON.stringify(selectedItems);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "ReleaseItems_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_REL_ORD_ITM_JSON");
      formData.append("param_productStoreId", this.currentEComStore.productStoreId);
      this.deselectSelectedItems();
      return this.store.dispatch("order/releaseItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      }).then(() => {
        // TODO Find a better place to call this
        this.store.dispatch("order/removeItems", { items: selectedItems });
      }).finally(() => emitter.emit("dismissLoader"))
    },
    async cancelItems() {
      emitter.emit("presentLoader")
      const selectedItems = this.selectedItemsToCancel;
      const json = JSON.stringify(selectedItems);
      const blob = new Blob([json], { type: 'application/json'});
      const formData = new FormData();
      const fileName = "CancelItems_" + Date.now() +".json";
      formData.append("uploadedFile", blob, fileName);
      formData.append("configId", "MDM_CAN_ORD_ITM_JSON");
      formData.append("param_productStoreId", this.currentEComStore.productStoreId);
      this.deselectSelectedItems();
      return this.store.dispatch("order/cancelItems", {
          headers: {
              'Content-Type': 'multipart/form-data;'
          },
          data: formData
      }).then(() => {
        // TODO Find a better place to call this
        this.store.dispatch("order/removeItems", { items: selectedItems });
      }).finally(() => emitter.emit("dismissLoader"))
    },
    async deselectAlert() {
      const alert = await alertController.create({
        header: this.$t("Deselect items"),
        message: this.$t('Deselect the selected order items', { count: this.selectedItems.length }),
        buttons: [
            {
              text: this.$t("Cancel"),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: this.$t("Deselect"),
              handler: () => {
                this.deselectSelectedItems();
              },
            },
          ],
      });
      return alert.present();
    },
    async releaseAlert() {
      const message = (this.jobTotal > 0 ? (this.jobTotal === 1 ? this.$t("There is a job already pending.")  : this.$t("There are jobs already pending.",  { count: this.jobTotal })) + " " : "") + this.$t(
          'preorders will be automatically brokered and assigned for fulfillment.', { count: this.selectedItems.length }
        );
      const alert = await alertController.create({
        header: this.$t("Release orders"),
        cssClass: "alert-message",
        message,
        buttons: [
            {
              text: this.$t('Cancel'),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text:this.$t('Release'),
              handler: () => {
                this.releaseItems();
                
              },
            },
          ],
      });
      return alert.present();
    },
    async cancelAlert() {
      const message = (this.jobTotal > 0 ? (this.jobTotal === 1 ? this.$t("There is a job already pending.")  : this.$t("There are jobs already pending.",  { count: this.jobTotal })) + " " : "") + this.$t(
          'preorders will be cancelled. This action cannot be undone.',{ count: this.selectedItems.length }
        )
      const alert = await alertController.create({
        header:this.$t("Cancel orders"),
        message,
        buttons: [
            {
              text: this.$t("Don't cancel"),
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: this.$t("Confirm"),
              handler: () => {
                this.cancelItems();
              },
            },
          ],
      });
      return alert.present();
    },
    async openWarehouseList() {
      const warehouseModal = await modalController.create({
        component: WarehouseModal,
        cssClass: "my-custom-class",
        componentProps: {
          items: this.selectedItems
        },
      });
      warehouseModal.onDidDismiss().finally(() => {
        // TODO FIX this it should deselect only on successful action
        this.deselectSelectedItems();
      })
      return warehouseModal.present();
    },
    async openActiveJobs() {
      const bgjobModal = await modalController.create({
        component: BackgroundJobModal,
        cssClass: "my-custom-class",
      });
      return bgjobModal.present();
    },
    async editPromiseDate() {
      const dateModal = await modalController.create({
        component: PromiseDateModal,
        cssClass: "my-custom-class",
        componentProps: {
          items: this.selectedItems
        },
      });
      dateModal.onDidDismiss().finally(() => {
        // TODO FIX this it should deselect only on successful action
        this.deselectSelectedItems();
      })
      return dateModal.present();
    },
    selectItem: function(event: any, item: any) {
      const existingItemIndex = this.selectedItems.findIndex((element: any) => element.orderId === item.orderId && element.orderItemSeqId === item.orderItemSeqId)
      if (event.target.checked && existingItemIndex === -1) {
        this.store.dispatch("order/addToSelectedItems", { item });
      } else if(!event.target.checked && existingItemIndex > -1) {
        this.store.dispatch("order/removeFromSelectedItems", { index: existingItemIndex });
      }
    },
    deselectSelectedItems: function() {
      this.selectedItems.forEach((item: any) => {
          item.isChecked = false;
      })
      this.store.dispatch("order/clearSelectedItems");
    },
    async openPopover(ev: Event, item: any) {
      const popover = await popoverController.create({
        component: Popover,
        componentProps: {
            "item": item
        },
        event: ev,
        translucent: true,
        showBackdrop: false,
      });
      return popover.present();
    },
    async copyToClipboard(text: string) {
      await Clipboard.write({
        string: text
      }).then(() => {
        showToast(this.$t('Copied', { text }));
      })
    },
    selectSearchBarText(event: any) {
      event.target.getInputElement().then((element: any) => {
        element.select();
      })
    }
  },
  setup() {
    const store = useStore();
    const userStore = useUserStore();
    const productIdentificationStore = useProductIdentificationStore();
    let productIdentificationPref = computed(() => productIdentificationStore.getProductIdentificationPref)
    let currentEComStore: any = computed(() => userStore.getCurrentEComStore)

    return {
      business,
      calendar,
      close,
      closeCircle,
      currentEComStore,
      ellipsisVertical,
      getProductIdentificationValue,
      hourglass,
      pricetag,
      productIdentificationPref,
      ribbon,
      send,
      store
    };
  },
});
</script>

<style scoped>

/* Table of contents

  1. Desktop Header

  2. Desktop Order
      - Order Header
        - Order ID
        - Order Tags
        - Order Metadata
      - Order Items

  3. Mobile Header

  4. Mobile Order
*/

/* ==============
 1. Desktop Header
   ============== */

.header {
  display: grid;
  grid: "search filters"
        "results filters"
        /1fr 1fr;
  grid-gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  
}

.search {
  grid-area: search;
}

.filters {
  grid-area: filters;
}

.results {
  grid-area: results;
  align-self: end;
}


/* ==============
 2. Desktop Order
   ============== */

.order {
  border-top: 1px solid;
  border-color: var(--ion-color-medium);
  margin: 0 16px;
}

.order-header {
  display: grid;
  grid:"id tags metadata" / 1fr 1fr minmax(min-content, max-content);
  align-items: center;
}

.order-id {
  grid-area: id;
}

.order-tags {
  grid-area: tags;

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.order-metadata {
  grid-area: metadata;

  justify-self: end;
  padding-right: 10px;
}

.order-metadata ion-note {
  white-space: normal;
}

.order-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(343px, 1fr));
  gap: 10px;
}

ion-chip > ion-input, ion-chip > ion-select {
  /* In ionic 7, a min-height is getting set on the ion-chip hence removing it. */
  min-height: unset !important;
}

@media (max-width: 991px) {

  /* ==============
   3. Mobile Header
     ============== */

  .header {
    grid: "search"
          "filters"
          "results"
          / auto;
    padding: 0;
  }
  
  .results{
    padding: 16px;
  }

  /* ==============
   4. Mobile Order
     ============== */

  .order-header {
    grid-template-areas:
      "id metadata"
      "tags tags";
  }

}
</style>


