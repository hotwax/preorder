<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/purchase-orders" />
        </ion-buttons>
        <ion-title>{{ translate('Create purchase order') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <section class="create-po">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Order') }}</ion-card-title>
          </ion-card-header>
          <ion-card-content class="form-fields">
            <ion-select v-model="form.supplierPartyId" :label="requiredLabel('Supplier')" label-placement="stacked" fill="outline" interface="popover" :placeholder="translate('Select supplier')" :helper-text="suppliersError || undefined">
              <ion-select-option v-for="supplier in suppliers" :key="supplier.partyId" :value="supplier.partyId">{{ supplier.name || supplier.partyId }}</ion-select-option>
            </ion-select>
            <ion-select v-model="form.facilityId" :label="requiredLabel('Destination')" label-placement="stacked" fill="outline" interface="popover" :disabled="!facilitiesSynced" :placeholder="facilityPlaceholder">
              <ion-select-option v-for="facility in facilityOptions" :key="facility.facilityId" :value="facility.facilityId">{{ facility.facilityName || facility.facilityId }}</ion-select-option>
            </ion-select>
            <ion-input v-model="form.externalId" :label="translate('External ID')" label-placement="stacked" fill="outline" :helper-text="translate('Generated when empty')" />
            <ion-input v-model="form.orderName" :label="translate('Name')" label-placement="stacked" fill="outline" />
            <ion-select v-model="form.statusId" :label="translate('Status')" label-placement="stacked" fill="outline" interface="popover" :selected-text="seed.statusDescription(form.statusId)">
              <ion-select-option value="ORDER_CREATED">{{ seed.statusDescription('ORDER_CREATED') }}</ion-select-option>
              <ion-select-option value="ORDER_APPROVED">{{ seed.statusDescription('ORDER_APPROVED') }}</ion-select-option>
            </ion-select>
            <ion-input v-model="form.currencyUomId" :label="translate('Currency')" label-placement="stacked" fill="outline" />
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Pre-order') }}</ion-card-title>
          </ion-card-header>
          <ion-list lines="none">
            <ion-item :disabled="!canUpdateFutureInventory">
              <ion-toggle v-model="form.createFutureInventory">{{ translate('Sell as pre-order') }}</ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <p>{{ translate('Creates a future inventory batch for each line, at its arrival date and quantity, so it can be sold before it arrives.') }}</p>
                <p v-if="!canUpdateFutureInventory">{{ translate('You do not have permission to create future inventory.') }}</p>
              </ion-label>
            </ion-item>
            <ion-item :disabled="!form.createFutureInventory">
              <ion-select v-model="form.futureInventoryItemTypeId" :label="translate('Sell as')" interface="popover">
                <ion-select-option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card>
      </section>

      <ion-list>
        <ion-list-header>
          <ion-label>{{ translate('Lines') }}</ion-label>
        </ion-list-header>
        <div class="ion-padding-horizontal">
          <ion-searchbar v-model="productQuery" :placeholder="translate('Search products to add')" :debounce="300" @ionInput="searchProducts" />
        </div>
        <ion-progress-bar v-if="searching" type="indeterminate" />
        <ion-item v-if="productQuery.trim() && !searching && searched && !searchResults.length" lines="none">
          <ion-label>{{ searchError || translate('No products match this search.') }}</ion-label>
        </ion-item>
        <ion-item v-for="product in searchResults" :key="product.productId" button :detail="false" @click="addLine(product)">
          <ion-thumbnail slot="start">
            <DxpShopifyImg :src="product.mainImageUrl" size="small" />
          </ion-thumbnail>
          <ion-label>
            {{ primaryId(product, [product.parentProductName, product.productName, product.productId]) }}
            <p>{{ secondaryId(product, [product.productId]) }}</p>
          </ion-label>
          <ion-icon slot="end" :icon="addCircleOutline" />
        </ion-item>

        <div v-for="(line, index) in form.items" :key="line.productId" class="line">
          <ProductItem :product-id="line.productId" :product-name="line.productName" />
          <ion-input v-model.number="line.quantity" type="number" min="1" :label="requiredLabel('Quantity')" label-placement="stacked" fill="outline" />
          <ion-input v-model.number="line.unitPrice" type="number" min="0" :label="translate('Unit cost')" label-placement="stacked" fill="outline" />
          <DateFilterSelect v-model="line.arrivalDate" :label="requiredLabel('Arrival date')" :min="todayValue()" allow-future />
          <ion-button fill="clear" color="danger" :aria-label="translate('Remove line')" @click="form.items.splice(index, 1)">
            <ion-icon slot="icon-only" :icon="trashOutline" />
          </ion-button>
        </div>
        <ion-item v-if="!form.items.length && !productQuery.trim() && !searchResults.length" lines="none">
          <ion-label>{{ translate('Search for products above to add lines.') }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-title size="small">{{ translate('{count} lines', { count: form.items.length }) }}, {{ translate('{count} units', countParams(totalUnits)) }}</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="solid" :disabled="!canSave || saving" @click="save">{{ translate('Create purchase order') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonFooter, IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonProgressBar, IonSearchbar, IonSelect, IonSelectOption, IonThumbnail,
  IonTitle, IonToggle, IonToolbar,
} from '@ionic/vue';
import { addCircleOutline, trashOutline } from 'ionicons/icons';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { commonUtil, DxpShopifyImg, translate } from '@common';
import { useSeedData } from '@common/db';
import router from '@/router';
import { usePurchaseOrderActions } from '@/composables/usePurchaseOrderActions';
import { useProductIdentity } from '@/composables/useProductIdentity';
import { useStoreFacilities } from '@/composables/useStoreFacilities';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user';
import Actions from '@/authorization/actions';
import { SOLR_SETTLE_MS, usePurchaseOrderSearchStore } from '@/store/purchaseOrderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import ProductItem from '@/components/common/ProductItem.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import { requiredLabel } from '@/utils';
import { useFutureInventoryTypes } from '@/composables/useFutureInventoryTypes';
import { errorMessage } from '@/utils/response';
import { countParams, todayValue } from '@/utils/format';

const seed = useSeedData();
const { typeOptions } = useFutureInventoryTypes();
const productStore = useProductStore();
const { primaryId, secondaryId } = useProductIdentity();
const { fetchSuppliers, createPurchaseOrder, searchOrderableProducts } = usePurchaseOrderActions();

// Selling as pre-order creates future inventory: the FI permission, not the PO one that opens this page
const canUpdateFutureInventory = computed(() => useUserStore().hasPermission(Actions.APP_FI_UPDATE));
const suppliers = ref<{ partyId: string; name: string }[]>([]);
// The store's receiving facilities; right after login their tables are still filling, which is not "no facilities"
const { facilityOptions, synced: facilitiesSynced } = useStoreFacilities();
const facilityPlaceholder = computed(() => {
  if (!facilitiesSynced.value) return translate('Loading facilities');
  return facilityOptions.value.length ? translate('Select facility') : translate('No facilities');
});
const productQuery = ref('');
const searchResults = ref<any[]>([]);
const saving = ref(false);

const form = reactive({
  supplierPartyId: '',
  facilityId: '',
  externalId: '',
  orderName: '',
  statusId: 'ORDER_APPROVED',
  currencyUomId: 'USD',
  createFutureInventory: canUpdateFutureInventory.value,
  futureInventoryItemTypeId: 'FIT_PRE_ORDER',
  items: [] as { productId: string; productName?: string; quantity: number; unitPrice?: number; arrivalDate: string }[],
});

// A destination of another store's (after a store switch) is not offered, so it is not kept either
watch(facilityOptions, (options) => {
  if (form.facilityId && !options.some((facility) => facility.facilityId === form.facilityId)) form.facilityId = '';
});

const totalUnits = computed(() => form.items.reduce((sum, line) => sum + Number(line.quantity || 0), 0));
const canSave = computed(() => productStore.getCurrentProductStoreId && form.supplierPartyId && form.facilityId && form.items.length
  && form.items.every((line) => Number(line.quantity) > 0 && line.arrivalDate && line.arrivalDate >= todayValue()));

const suppliersError = ref('');
const searching = ref(false);
const searched = ref(false);
const searchError = ref('');

onMounted(async () => {
  try {
    suppliers.value = await fetchSuppliers();
  } catch (error) {
    suppliersError.value = errorMessage(error, translate('Suppliers could not be loaded.'));
  }
});

/** Each search takes a number; only the latest one's answer lands and ends the spinner. */
let searchRequest = 0;

async function searchProducts() {
  const request = ++searchRequest;
  const keyword = productQuery.value.trim();
  searched.value = false;
  searchError.value = '';
  if (!keyword) {
    searchResults.value = [];
    searching.value = false;
    return;
  }
  searching.value = true;
  try {
    const results = await searchOrderableProducts(keyword, productStore.getCurrentProductStoreId);
    if (request !== searchRequest) return;
    searchResults.value = results;
  } catch (error) {
    if (request !== searchRequest) return;
    searchResults.value = [];
    searchError.value = errorMessage(error, translate('Product search failed.'));
  } finally {
    if (request === searchRequest) {
      searching.value = false;
      searched.value = true;
    }
  }
}

function addLine(product: any) {
  if (!form.items.some((line) => line.productId === product.productId)) {
    const lastDate = form.items[form.items.length - 1]?.arrivalDate || '';
    form.items.push({ productId: product.productId, productName: product.parentProductName || product.productName, quantity: 1, arrivalDate: lastDate });
  }
  productQuery.value = '';
  searchResults.value = [];
}

async function save() {
  saving.value = true;
  try {
    const result = await createPurchaseOrder({
      supplierPartyId: form.supplierPartyId,
      facilityId: form.facilityId,
      productStoreId: productStore.getCurrentProductStoreId,
      externalId: form.externalId.trim() || undefined,
      orderName: form.orderName.trim() || undefined,
      statusId: form.statusId,
      currencyUomId: form.currencyUomId || undefined,
      createFutureInventory: form.createFutureInventory && canUpdateFutureInventory.value,
      futureInventoryItemTypeId: form.futureInventoryItemTypeId,
      items: form.items.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitPrice: line.unitPrice === undefined || line.unitPrice === null || (line.unitPrice as any) === '' ? undefined : Number(line.unitPrice), arrivalDate: line.arrivalDate })),
    });
    if (result.futureInventoryError) {
      // The order exists without its batches: the toast stays until dismissed, and Sell as pre-order on the order adds them
      const toast: any = await commonUtil.showToast(
        translate('Purchase order {orderId} created, but its future inventory was not: {error} Use Sell as pre-order on the order to create it.', { orderId: result.orderId, error: result.futureInventoryError }),
        { manualDismiss: true, canDismiss: true },
      );
      await toast.present();
    } else {
      await commonUtil.showToast(result.futureInventoryItemIds
        ? translate('Purchase order {orderId} created with {count} future inventory batches.', { orderId: result.orderId, count: result.futureInventoryItemIds.length })
        : translate('Purchase order {orderId} created.', { orderId: result.orderId }));
    }
    usePurchaseOrderSearchStore().markStale(SOLR_SETTLE_MS);
    useFutureInventorySearchStore().markStale();
    router.replace(`/purchase-orders/${encodeURIComponent(result.orderId)}`);
  } catch (error) {
    await commonUtil.showToast(errorMessage(error, translate('Failed to create the purchase order.')));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.create-po {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: minmax(0, 1fr);
  padding: var(--spacer-sm);
}

@media (min-width: 991px) {
  .create-po {
    grid-template-columns: 2fr 1fr;
  }
}

.create-po ion-card {
  margin: 0;
}

.form-fields {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
}

.line {
  align-items: center;
  border-block-start: var(--border-medium);
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)) 11rem auto;
  padding: var(--spacer-xs) var(--spacer-sm);
}

@media (max-width: 767px) {
  .line {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
