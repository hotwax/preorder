import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { refreshAfterMutation } from '@/db/appDbSync';
export function usePreorderSetup() {
  const refresh = (shopId: string, productStoreId: string) => refreshAfterMutation('preorderSetup', { shopId, productStoreId });
  async function saveMetafield(shopId: string, productStoreId: string, namespace: string, key: string) {
    try {
      for (const [settingTypeEnumId, settingValue] of [['SHPFY_PRORD_MF_NS', namespace.trim()], ['SHPFY_PRORD_MF_KEY', key.trim()]]) {
        await ensureOk(api({ url: 'sob/shopify/shopSetting', method: 'post', data: { shopId, settingTypeEnumId, settingValue } }), 'Failed to save the metafield mapping.');
      }
    } finally {
      // The existing settings API saves one field per request; show persisted state even after a partial failure.
      await refresh(shopId, productStoreId);
    }
  }
  async function saveChannel(shopId: string, productStoreId: string, data: { inventoryChannelId?: string; channelTypeEnumId: string; facilityGroupId: string; shopifyLocationId: string }) {
    const { inventoryChannelId, ...fields } = data;
    await ensureOk(api({ url: `sob/shopify/inventoryChannels${inventoryChannelId ? `/${encodeURIComponent(inventoryChannelId)}` : ''}`, method: inventoryChannelId ? 'put' : 'post', data: inventoryChannelId ? { facilityGroupId: fields.facilityGroupId, shopifyLocationId: fields.shopifyLocationId } : { ...fields, shopId } }), 'Failed to save the pre-order channel.');
    await refresh(shopId, productStoreId);
  }
  return { refresh, saveMetafield, saveChannel };
}
