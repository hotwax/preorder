<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><ion-back-button :default-href="`/purchase-orders/${orderId}`" /></ion-buttons><ion-title>{{ translate('Create inbound shipment') }}</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Shipment could not be created')" :message="error" />
      <ion-list v-if="order">
        <ion-item><ion-label>{{ order.orderName || orderId }}<p>{{ seed.facilityName(order.facilityId) }}</p></ion-label></ion-item>
        <ion-item><ion-input v-model="reference" :label="translate('Shipment reference')" label-placement="stacked" :maxlength="60" /></ion-item>
        <ion-item><ion-input v-model="arrivalDate" type="date" :label="translate('Estimated arrival')" label-placement="stacked" /></ion-item>
        <ion-item v-for="line in lines" :key="line.orderItemSeqId">
          <ion-label>{{ line.productName || line.productId }}<p>{{ translate('{count} units available to ship', { count: line.unshippedQuantity }) }}</p></ion-label>
          <ion-input v-model="line.shipmentQuantity" type="number" min="0" :max="line.unshippedQuantity" :label="translate('Shipment quantity')" label-placement="stacked" />
        </ion-item>
        <ion-item lines="none"><ion-label class="ion-text-wrap">{{ translate('Lines sold as pre-order transfer their supply to the shipment batch. Existing reservations stay on their original batch.') }}</ion-label></ion-item>
      </ion-list>
      <ion-button v-if="canUpdate" :disabled="loading || !valid" @click="save">{{ translate('Create inbound shipment') }}</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonProgressBar, IonList, IonItem, IonLabel, IonInput, IonButton, onIonViewWillEnter } from '@ionic/vue';
import { translate } from '@common';
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
const order = ref<any>(); const lines = ref<any[]>([]); const reference = ref(''); const arrivalDate = ref(''); const error = ref(''); const loading = ref(false);
const valid = computed(() => reference.value.trim() && arrivalDate.value && lines.value.some(line => Number(line.shipmentQuantity) > 0) && lines.value.every(line => Number.isFinite(Number(line.shipmentQuantity)) && Number(line.shipmentQuantity) >= 0 && Number(line.shipmentQuantity) <= line.unshippedQuantity));
onIonViewWillEnter(async () => {
  loading.value = true; error.value = '';
  try { order.value = await fetchPurchaseOrder(props.orderId); lines.value = order.value.items.filter((line: any) => line.unshippedQuantity > 0).map((line: any) => ({ ...line, shipmentQuantity: 0 })); }
  catch (err) { error.value = errorMessage(err, translate('Failed to load the purchase order.')); }
  finally { loading.value = false; }
});
async function save() {
  if (!valid.value || loading.value || !canUpdate.value) return;
  loading.value = true; error.value = '';
  try {
    const result = await createShipment({ orderId: props.orderId, externalId: reference.value.trim(), arrivalDate: arrivalDate.value, items: lines.value.filter(line => Number(line.shipmentQuantity) > 0).map(line => ({ orderItemSeqId: line.orderItemSeqId, quantity: Number(line.shipmentQuantity) })) });
    await router.replace(`/inbound-shipments/${encodeURIComponent(result.shipmentId)}`);
  } catch (err) { error.value = errorMessage(err, translate('Shipment could not be created')); }
  finally { loading.value = false; }
}
</script>
