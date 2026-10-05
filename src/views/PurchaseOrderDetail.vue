<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/purchase-orders"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t("Purchase Order Details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="isLoading" class="empty-state">
        <ion-spinner name="crescent" />
        <ion-label>{{ $t("Loading Purchase Order") }}</ion-label>
      </div>

      <template v-else>
        <ion-item class="purchase-order-detail-header" lines="none">
          <ion-icon slot="start" :icon="ticketOutline" />
          <ion-label>
            <h1>{{ order.externalId }}</h1>
            <p>{{ order.orderId }}</p>
          </ion-label>
          <div slot="end">
            <ion-note>{{ formatDate(order.orderDate) }}</ion-note>
            <ion-label>
              {{ getFacilityName(order.originFacilityId) }}
            </ion-label>
            <ion-badge :color="getStatusColor(order.orderStatusDesc)">{{ order.orderStatusDesc }}</ion-badge>
          </div>
        </ion-item>
        <template v-if="order.orderIds?.length">
          <ion-label class="ion-margin-start">{{ "Sales Orders" }}: {{ order.orderIds.length }}</ion-label>
          <ion-item lines="none">
            <ion-chip v-for="orderId in order.orderIds" :key="orderId" @click="openOrderDetails(orderId)">
              {{ orderId }}
              <ion-icon :icon="openOutline"></ion-icon>
            </ion-chip>
          </ion-item>
        </template>

        <main class="purchase-order-items">
          <ion-item class="purchase-order-items-header" lines="none">
            <ion-icon slot="start" :icon="shirtOutline" />
            <ion-label>
              <h1>{{ $t("Items") }}</h1>
            </ion-label>
          </ion-item>
          <ion-list v-if="!order.items?.length">
            <ion-item class="ion-text-center" lines="none">
              <ion-label>{{ $t("No items found") }}</ion-label>
            </ion-item>
          </ion-list>

          <ion-accordion-group>
            <ion-accordion :value="row.futureInventoryItemId" v-for="row in order.items" :key="row.id">
              <ion-item slot="header" color="light">
                <div class="list-item purchase-order-item-summary-row">
                  <ion-item lines="none">
                    <ion-thumbnail slot="start">
                      <DxpShopifyImg :src="getProduct(row.productId)?.mainImageUrl" size="small" />
                    </ion-thumbnail>
                    <ion-label>
                      <p class="overline">{{ getProduct(row.productId).internalName }}</p>
                      <h2>{{ getProduct(row.productId).productName || row.productId }}</h2>
                      <p>{{ row.futureInventoryItemId }}</p>
                    </ion-label>
                  </ion-item>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ row.quantity || "-" }}/{{ row.availableToPromiseTotal || "-" }}
                      <p>{{ $t("quantity") }}/{{ $t("ATP") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ formatDate(row.promiseDate) }}
                      <p>{{ $t("promise date") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ getEnum(row.futureInventoryItemTypeId)?.description || "-" }}
                      <p>{{ $t("category") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-badge>{{ getStatusDesc(row.statusId) }}</ion-badge>
                  </div>
                </div>
              </ion-item>

              <div slot="content">
                <div v-for="detail in row.details" :key="detail.id" class="list-item ion-margin-start purchase-order-item-summary-row">
                  <ion-item lines="none">
                    <ion-label>
                      <h2>{{ detail.futureInventoryItemDetailId }}</h2>
                      <p>{{ detail.poItemSeqId }}</p>
                    </ion-label>
                  </ion-item>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ detail.availableToPromiseDiff }}
                      <p>{{ $t("quantity") }}</p>
                    </ion-label>
                  </div>
                  <div v-if="detail.orderId" class="tablet ion-text-center">
                    <ion-label>
                      {{ detail.orderId }}
                      {{ detail.shipGroupSeqId }}
                      <p>{{ $t("Order Id") }}</p>
                    </ion-label>
                  </div>
                  <div v-else-if="detail.shipmentExternalId" class="tablet ion-text-center">
                    <ion-label>
                      {{ detail.shipmentExternalId }}
                      <p>{{ $t("Shipment Id") }}</p>
                    </ion-label>
                  </div>
                  <div v-else class="tablet ion-text-center"></div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ formatDate(detail.promiseDate) }}
                      <p>{{ $t("Promise date") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ getEnum(detail.reasonEnumId)?.description || detail.reasonEnumId }}
                      <p>{{ $t("Reason") }}</p>
                    </ion-label>
                  </div>
                </div>
              </div>
              <hr/>
            </ion-accordion>
          </ion-accordion-group>

          <hr/>

          <ion-item class="purchase-order-items-header" lines="none">
            <ion-icon slot="start" :icon="shirtOutline" />
            <ion-label>
              <h1>{{ $t("Shipments") }}</h1>
            </ion-label>
          </ion-item>
          
          <ion-list v-if="!order.shipments?.length">
            <ion-item class="ion-text-center" lines="none">
              <ion-label>{{ $t("No shipments found") }}</ion-label>
            </ion-item>
          </ion-list>

          <ion-accordion-group>
            <ion-accordion :value="row.futureInventoryItemId" v-for="row in order.shipments" :key="row.id">
              <ion-item slot="header" color="light">
                <div class="list-item purchase-order-item-summary-row">
                  <ion-item lines="none">
                    <ion-label>
                      <h2>{{ row.shipmentExternalId }}</h2>
                      <p>{{ row.futureInventoryItemId }}</p>
                    </ion-label>
                  </ion-item>
                  <div class="tablet ion-text-center"></div>
                  <div class="tablet ion-text-center"></div>
                  <div class="tablet ion-text-center"></div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ row.availableToPromiseTotal }}
                      <p>{{ $t("quantity") }}</p>
                    </ion-label>
                  </div>
                </div>
              </ion-item>

              <div slot="content">
                <div v-for="detail in row.details" :key="detail.id" class="list-item ion-margin-start purchase-order-item-summary-row">
                  <ion-item lines="none">
                    <ion-thumbnail slot="start">
                      <DxpShopifyImg :src="getProduct(row.productId)?.mainImageUrl" size="small" />
                    </ion-thumbnail>
                    <ion-label>
                      <h2>{{ getProduct(row.productId).productName || row.productId }}</h2>
                      <p>{{ getProduct(row.productId).internalName }}</p>
                      <p>{{ row.futureInventoryItemDetailId }}</p>
                    </ion-label>
                  </ion-item>
                  <div class="tablet ion-text-center"></div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ formatDate(detail.promiseDate) }}
                      <p>{{ $t("Promise date") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ getEnum(detail.reasonEnumId)?.description || detail.reasonEnumId }}
                      <p>{{ $t("Reason") }}</p>
                    </ion-label>
                  </div>
                  <div class="tablet ion-text-center">
                    <ion-label>
                      {{ detail.availableToPromiseDiff }}
                      <p>{{ $t("quantity") }}</p>
                    </ion-label>
                  </div>
                </div>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </main>
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonAccordion, IonAccordionGroup, IonBackButton, IonBadge, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonThumbnail, IonTitle, IonToolbar } from "@ionic/vue";
import { openOutline, shirtOutline, ticketOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { defineComponent } from "vue";
import { mapGetters } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "@/store";
import { DxpShopifyImg } from "@hotwax/dxp-components";
import { getStatusColor } from "@/utils";

export default defineComponent({
  name: "purchase-order-detail",
  components: {
    IonAccordion,
    IonAccordionGroup,
    DxpShopifyImg,
    IonBackButton,
    IonBadge,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner,
    IonThumbnail,
    IonTitle,
    IonToolbar
  },
  data() {
    return {
      isLoading: false
    }
  },
  props: ["id"],
  computed: {
    ...mapGetters({
      order: 'purchaseOrder/getCurrent',
      items: 'purchaseOrder/getItems',
      getProduct: 'product/getProduct',
      getStatusDesc: 'util/getStatusDesc',
      getEnum: "util/getEnumDetail",
      getFacilityName: "util/getFacilityName"
    })
  },
  ionViewWillEnter() {
    this.load();
  },
  methods: {
    async load() {
      this.isLoading = true;
      await this.store.dispatch('purchaseOrder/fetchFutureInventoryDetails', this.id);
      this.isLoading = false;
    },
    formatDate(value: any) {
      return this.parseDate(value)?.toFormat('d LLL yyyy') || '-';
    },
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
    openOrderDetails(orderId: string) {
      window.location.href = `https://order-manager.hotwax.io/orders/${orderId}`
    }
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    return {
      openOutline,
      orderId: route.params.orderId as string,
      router,
      shirtOutline,
      store,
      ticketOutline,
      getStatusColor
    };
  }
});
</script>

<style scoped>
.purchase-order-detail-header,
.purchase-order-items-header {
  padding: 16px;
}

.purchase-order-items {
  padding: 0 16px 16px;
}

.purchase-order-item-summary-row {
  --columns-tablet: 4;
  --columns-desktop: 5;
}

ion-accordion > ion-item[slot="header"] > .list-item {
  flex: 1;
}

@media (max-width: 720px) {
  .purchase-order-detail-header,
  .purchase-order-items-header,
  .purchase-order-items {
    padding-inline-start: 0;
    padding-inline-end: 0;
  }
}
</style>