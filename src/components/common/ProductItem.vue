<template>
  <ion-item lines="none" class="product-item">
    <slot name="start" />
    <ion-thumbnail slot="start">
      <DxpShopifyImg :src="getProduct(productId)?.mainImageUrl" size="small" />
    </ion-thumbnail>
    <ion-label>
      {{ primaryId(getProduct(productId), [productName, productId]) }}
      <p>{{ secondaryId(getProduct(productId), [productId]) }}</p>
      <slot />
    </ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonThumbnail } from '@ionic/vue';
import { DxpShopifyImg } from '@common';
import { useProductIdentity } from '@/composables/useProductIdentity';

/**
 * A product as the rows show it: image, and the Settings product identifiers, from the product master.
 * The `start` slot puts a row's selection checkbox (`slot="start"`) before the image.
 */
defineProps<{ productId: string; productName?: string }>();
const { getProduct, primaryId, secondaryId } = useProductIdentity();
</script>
