<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button :default-href="`/purchase-orders/${orderId}`" /></ion-buttons>
        <ion-title>{{ translate('Create inbound shipment') }}</ion-title>
      </ion-toolbar>
      <ion-progress-bar v-if="loading" type="indeterminate" />
    </ion-header>
    <ion-content>
      <ErrorState v-if="error" :title="translate('Shipment could not be created')" :message="error" />
      <main v-if="order" class="shipment-form">
        <aside>
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ translate('Shipment details') }}</ion-card-title>
              <ion-card-subtitle>{{
                translate('Track an incoming delivery against this purchase order.')
              }}</ion-card-subtitle>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item>
                <ion-icon slot="start" :icon="documentTextOutline" />
                <ion-label class="ion-text-wrap"
                  ><p>{{ translate('Purchase order') }}</p>
                  {{ order.orderName || orderId }}</ion-label
                >
              </ion-item>
              <ion-item>
                <ion-icon slot="start" :icon="locationOutline" />
                <ion-label class="ion-text-wrap"
                  ><p>{{ translate('Destination') }}</p>
                  {{ seed.facilityName(order.facilityId) }}</ion-label
                >
              </ion-item>
            </ion-list>
            <ion-card-content class="shipment-fields">
              <ion-input
                v-model="reference"
                :label="requiredLabel('Shipment reference')"
                label-placement="stacked"
                fill="outline"
                :maxlength="60"
                :helper-text="translate('Use the supplier’s shipment or tracking reference.')"
              />
              <DateFilterSelect
                v-model="arrivalDate"
                :label="requiredLabel('Estimated arrival')"
                allow-future
              />
            </ion-card-content>
          </ion-card>
        </aside>
        <section>
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ translate('Items to ship') }}</ion-card-title>
              <ion-card-subtitle>{{
                translate('Enter the quantity included in this delivery. Leave other items at zero.')
              }}</ion-card-subtitle>
            </ion-card-header>
            <ion-list>
              <div v-for="line in lines" :key="line.orderItemSeqId" class="shipment-line">
                <ProductItem :product-id="line.productId" :product-name="line.productName">
                  <p>{{ translate('{count} units available to ship', { count: line.unshippedQuantity }) }}</p>
                </ProductItem>
                <ion-input
                  v-model="line.shipmentQuantity"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  :max="line.unshippedQuantity"
                  :label="translate('Quantity')"
                  :aria-label="
                    translate('Shipment quantity for {product}', { product: line.productName || line.productId })
                  "
                  label-placement="stacked"
                  fill="outline"
                  :class="{
                    'ion-invalid ion-touched':
                      Number(line.shipmentQuantity) > line.unshippedQuantity || Number(line.shipmentQuantity) < 0,
                  }"
                  :error-text="translate('Enter 0 to {count}', { count: line.unshippedQuantity })"
                />
              </div>
              <ion-item v-if="!lines.length" lines="none"
                ><ion-label class="ion-text-wrap">{{
                  translate('All open units already belong to a shipment.')
                }}</ion-label></ion-item
              >
            </ion-list>
          </ion-card>
          <ion-item lines="none">
            <ion-icon slot="start" :icon="informationCircleOutline" />
            <ion-label class="ion-text-wrap"
              ><p>
                {{
                  translate(
                    'Pre-order supply moves to this shipment, and the pre-orders waiting at its destination move with it, oldest first.'
                  )
                }}
              </p></ion-label
            >
          </ion-item>
        </section>
      </main>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="shipment-footer">
          <ion-note
            >{{ translate('{count} lines', { count: selectedLines.length }) }},
            {{ translate('{count} units', { count: totalUnits }) }}</ion-note
          >
          <ion-button v-if="canUpdate" :disabled="loading || !valid" @click="save">{{
            translate('Create shipment')
          }}</ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonProgressBar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonFooter,
  IonIcon,
  IonNote,
  onIonViewWillEnter,
} from '@ionic/vue';
import { translate } from '@common';
import { documentTextOutline, locationOutline, informationCircleOutline } from 'ionicons/icons';
import ProductItem from '@/components/common/ProductItem.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import { requiredLabel } from '@/utils';
import { useSeedData } from '@common/db';
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';
import { useInboundShipments } from '@/composables/useInboundShipments';
import { useUserStore } from '@/store/user';
import Actions from '@/authorization/actions';
import ErrorState from '@/components/common/ErrorState.vue';
import { errorMessage } from '@/utils/response';
const props = defineProps<{ orderId: string }>();
const router = useRouter();
const seed = useSeedData();
const user = useUserStore();
const canUpdate = computed(() => user.hasPermission(Actions.APP_PO_UPDATE));
const { fetchPurchaseOrder } = usePurchaseOrderActions();
const { createShipment } = useInboundShipments();
const order = ref<any>();
const lines = ref<any[]>([]);
const reference = ref('');
const arrivalDate = ref('');
const error = ref('');
const loading = ref(false);
const selectedLines = computed(() => lines.value.filter((line) => Number(line.shipmentQuantity) > 0));
const totalUnits = computed(() =>
  selectedLines.value.reduce((total, line) => total + Number(line.shipmentQuantity), 0)
);
const valid = computed(
  () =>
    reference.value.trim() &&
    arrivalDate.value &&
    lines.value.some((line) => Number(line.shipmentQuantity) > 0) &&
    lines.value.every(
      (line) =>
        Number.isFinite(Number(line.shipmentQuantity)) &&
        Number(line.shipmentQuantity) >= 0 &&
        Number(line.shipmentQuantity) <= line.unshippedQuantity
    )
);
onIonViewWillEnter(async () => {
  loading.value = true;
  error.value = '';
  try {
    order.value = await fetchPurchaseOrder(props.orderId);
    lines.value = order.value.items
      .filter((line: any) => line.unshippedQuantity > 0)
      .map((line: any) => ({ ...line, shipmentQuantity: 0 }));
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load the purchase order.'));
  } finally {
    loading.value = false;
  }
});
async function save() {
  if (!valid.value || loading.value || !canUpdate.value) return;
  loading.value = true;
  error.value = '';
  try {
    const result = await createShipment({
      orderId: props.orderId,
      externalId: reference.value.trim(),
      arrivalDate: arrivalDate.value,
      items: lines.value
        .filter((line) => Number(line.shipmentQuantity) > 0)
        .map((line) => ({ orderItemSeqId: line.orderItemSeqId, quantity: Number(line.shipmentQuantity) })),
    });
    await router.replace(`/inbound-shipments/${encodeURIComponent(result.shipmentId)}`);
  } catch (err) {
    error.value = errorMessage(err, translate('Shipment could not be created'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.shipment-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacer-sm);
  padding: var(--spacer-sm);
  align-items: start;
}
.shipment-form ion-card {
  margin: 0;
}
.shipment-fields {
  display: grid;
  gap: var(--spacer-base);
}
.shipment-fields :deep(.date-filter-select) {
  min-width: 0;
  max-width: none;
  width: 100%;
}
.shipment-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7rem;
  align-items: center;
  gap: var(--spacer-sm);
  padding: var(--spacer-xs) var(--spacer-sm) var(--spacer-xs) 0;
}
.shipment-line > * {
  min-width: 0;
}
.shipment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer-sm);
  padding-inline: var(--spacer-sm);
}
@media (min-width: 1100px) {
  .shipment-form {
    grid-template-columns: minmax(18rem, 1fr) minmax(0, 2fr);
  }
}
@media (max-width: 400px) {
  .shipment-footer {
    flex-wrap: wrap;
    padding-block: var(--spacer-xs);
  }
}
</style>
