<template>

  <ion-card>
    <ion-card-header>
      <ion-card-title>
        {{ translate('Product identifier') }}
      </ion-card-title>
    </ion-card-header>

    <ion-card-content>
      {{ translate('Choosing a product identifier allows you to view products with your preferred identifiers.') }}
    </ion-card-content>

    <ion-item :disabled="!userStore.hasPermission(Actions.APP_PRODUCT_IDENTIFIER_UPDATE)">
      <ion-select :label="translate('Primary')" interface="popover" :placeholder="translate('primary identifier')" :value="productIdentificationPref.primaryId" @ionChange="setProductIdentificationPref($event.detail.value, 'primaryId')">
        <ion-select-option v-for="identification in productIdentificationOptions" :key="identification.goodIdentificationTypeId" :value="identification.goodIdentificationTypeId" >{{ identification.description ? identification.description : identification.goodIdentificationTypeId }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item lines="none" :disabled="!userStore.hasPermission(Actions.APP_PRODUCT_IDENTIFIER_UPDATE)">
      <ion-select :label="translate('Secondary')" interface="popover" :placeholder="translate('secondary identifier')" :value="productIdentificationPref.secondaryId" @ionChange="setProductIdentificationPref($event.detail.value, 'secondaryId')">
        <ion-select-option v-for="identification in productIdentificationOptions" :key="identification.goodIdentificationTypeId" :value="identification.goodIdentificationTypeId" >{{ identification.description ? identification.description : identification.goodIdentificationTypeId }}</ion-select-option>
        <ion-select-option value="">{{ translate("None") }}</ion-select-option>
      </ion-select>
    </ion-item>
    <template v-if="currentSampleProduct">
      <ion-item lines="full" color="light">
        <ion-label color="medium">{{ translate('Preview product identifier') }}</ion-label>
      </ion-item>
      <ion-item lines="none">
        <ion-thumbnail slot="start">
          <DxpShopifyImg size="small" :src="currentSampleProduct.mainImageUrl"/>
        </ion-thumbnail>
        <ion-label>
          {{ getProductIdentificationValue(productIdentificationPref.primaryId, currentSampleProduct) ? getProductIdentificationValue(productIdentificationPref.primaryId, currentSampleProduct) : currentSampleProduct.productId }}
          <p>{{ getProductIdentificationValue(productIdentificationPref.secondaryId, currentSampleProduct) }}</p>
        </ion-label>
        <ion-button size="default" fill="clear" @click="shuffle" :aria-label="translate('Shuffle')" :title="translate('Shuffle')">
          <ion-icon slot="icon-only" :icon="shuffleOutline"/>
        </ion-button>
      </ion-item>
    </template>
  </ion-card>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption, IonThumbnail } from '@ionic/vue';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user'
import { computed, onMounted } from 'vue';
import { commonUtil, DxpShopifyImg, translate } from "@common";
import { shuffleOutline } from "ionicons/icons";
import Actions from "@/authorization/actions";

const productStore = useProductStore();
const userStore = useUserStore()

const getProductIdentificationValue = commonUtil.getProductIdentificationValue;
const currentProductStore = computed(() =>  productStore.getCurrentProductStore)
const productIdentificationPref = computed(() => productStore.getProductIdentificationPref);
const productIdentificationOptions = computed(() => productStore.getProductIdentificationOptions);
const currentSampleProduct = computed(() => productStore.getCurrentSampleProduct) as any
onMounted(() => {
  productStore.prepareProductIdentifierOptions();
  productStore.fetchProductStoreSettings(currentProductStore.value.productStoreId);
  productStore.fetchProducts(); 
})

function setProductIdentificationPref(value: string | any, id: string) {
  const updatedPreference = JSON.parse(JSON.stringify(productIdentificationPref.value)) as any
  updatedPreference[id] = value
  productStore.setProductStoreSetting(currentProductStore.value.productStoreId, "PRDT_IDEN_PREF", updatedPreference)
}

function shuffle() {
  productStore.shuffleProduct()
}

</script>
