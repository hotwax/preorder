import { defineStore } from 'pinia'
import { api, commonUtil, logger, translate, useSolrSearch } from '@common'
import { useUserStore } from '@/store/user'
/** The saved-store lookup in flight, so the picker's watch asks for it once. */
let preferenceLookup: Promise<void> | undefined
const defaultProductStoreSettings = JSON.parse(import.meta.env.VITE_DEFAULT_PRODUCT_STORE_SETTINGS as string || '{"PRDT_IDEN_PREF":{"stateKey":"productIdentifier.productIdentificationPref","value":{"primaryId":"SKU","secondaryId":"productId"}}}')

/**
 * The product store the user works in, and its product identifier settings. Only the selected id is
 * kept here: the product store rows (names, the picker's list) are the `productStores` seed table in
 * the app db, read with `useProductStores()`.
 */
export const useProductStore = defineStore('productStore', {
  state: () => ({
    currentProductStoreId: '',
    settings: {
      productIdentifier: {
        productIdentificationPref: {
          primaryId: '',
          secondaryId: ''
        },
        productIdentificationOptions: [] as any[],
        sampleProducts: [],
        currentSampleProduct: null
      },
    } as any,
  }),

  getters: {
    getCurrentProductStoreId: (state) => state.currentProductStoreId,
    getSettings: (state) => state.settings,
    getProductIdentificationPref: (state) => state.settings.productIdentifier.productIdentificationPref,
    getProductIdentificationOptions: (state) => state.settings.productIdentifier.productIdentificationOptions,
    getCurrentSampleProduct: (state) => state.settings.productIdentifier.currentSampleProduct,
  },

  actions: {
    /** Selects a product store for this session and loads its settings. */
    setCurrentProductStore(productStoreId: string) {
      this.currentProductStoreId = productStoreId
      this.fetchProductStoreSettings(productStoreId);
    },

    /** Selects the user's saved product store (the SELECTED_BRAND preference), if they have one. */
    async fetchProductStorePreference() {
      const userStore = useUserStore();
      try {
        const preferredStoreResp = await api({
          url: "admin/user/preferences",
          method: "GET",
          params: {
            pageSize: 1,
            userId: userStore.current.userId,
            preferenceKey: "SELECTED_BRAND"
          },
        }) as any;
        const preferredStoreId = preferredStoreResp.data?.[0]?.preferenceValue
        if (preferredStoreId) this.setCurrentProductStore(preferredStoreId)
      } catch (err) {
        logger.error('Favourite product store not found', err)
      }
    },

    /**
     * Keeps the selection on a product store that exists. With nothing selected (a reload of a session
     * from before the selection was kept here), the user's saved store comes first; then the first of
     * `productStoreIds` (the app db's rows, in the picker's order) when the selection is still empty or
     * names a store that is gone.
     */
    async ensureCurrentProductStore(productStoreIds: string[]) {
      if (!productStoreIds.length || productStoreIds.includes(this.currentProductStoreId)) return
      if (!this.currentProductStoreId) {
        preferenceLookup ??= this.fetchProductStorePreference().finally(() => { preferenceLookup = undefined })
        await preferenceLookup
        if (productStoreIds.includes(this.currentProductStoreId)) return
      }
      this.setCurrentProductStore(productStoreIds[0])
    },

    /** Selects a product store and saves it as the user's SELECTED_BRAND preference. */
    async setProductStorePreference(productStoreId: string) {
      const userStore = useUserStore();
      try {
        await api({
          url: "admin/user/preferences",
          method: "PUT",
          data: {
            userId: userStore.current.userId,
            preferenceKey: 'SELECTED_BRAND',
            preferenceValue: productStoreId,
          }
        });
      } catch (error) {
        logger.error('Failed to save the product store preference', error)
      }
      this.setCurrentProductStore(productStoreId);
    },
    async fetchProductStoreSettings(productStoreId: string) {
      const productStoreSettings = {} as any

      if (productStoreId) {
        const payload = {
          productStoreId,
          settingTypeEnumId: Object.keys(defaultProductStoreSettings),
          settingTypeEnumId_op: "in",
          pageIndex: 0,
          pageSize: 50
        }
        try {
          const resp = await api({
            url: `/oms/dataDocumentView`,
            method: "POST",
            data: {
              dataDocumentId: "ProductStoreSetting",
              customParametersMap: payload
            }
          }) as any

          resp?.data?.entityValueList?.forEach((productSetting: any) => {
            productStoreSettings[productSetting.settingTypeEnumId] = productSetting.settingValue
          })
        } catch (error) {
          logger.error("Failed to fetch settings", error)
        }
      }

      Object.entries(defaultProductStoreSettings).forEach(([settingTypeEnumId, setting]: any) => {
        const { stateKey, value } = setting;
        const settingValue = productStoreSettings[settingTypeEnumId];
        let finalValue;
        try {
          finalValue = settingValue ? JSON.parse(settingValue) : value;
        } catch {
          finalValue = settingValue; // fallback to raw value
        }

        const keys = stateKey.split('.');
        let current = this.settings;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          if (i === keys.length - 1) {
            current[key] = finalValue;
          } else {
            // ensure object exists at each level
            if (!current[key] || typeof current[key] !== 'object') {
              current[key] = {};
            }
            current = current[key];
          }
        }
      })
    },
    async setProductStoreSetting(productStoreId: string, settingTypeEnumId: string, settingValue: any) {
      try {
        const payloadSettingValue = typeof settingValue === 'object' ? JSON.stringify(settingValue) : settingValue;
        const resp = await api({
          url: `admin/productStores/${productStoreId}/settings`,
          method: 'POST',
          data: {
            productStoreId,
            settingTypeEnumId,
            settingValue: payloadSettingValue
          }
        })
        if (!commonUtil.hasError(resp)) {
          const defaultSetting = defaultProductStoreSettings[settingTypeEnumId]
          const { stateKey } = defaultSetting
          const keys = stateKey.split('.');
          let current = this.settings;

          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            if (i === keys.length - 1) {
              current[key] = settingValue;
            } else {
              // ensure object exists at each level
              if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
              }
              current = current[key];
            }
          }
          commonUtil.showToast(translate('Product Store setting updated successfully.'))
        } else {
          throw resp
        }
      } catch (err) {
        commonUtil.showToast(translate('Failed to update Product Store setting.'))
        logger.error(err)
      }
    },

    async prepareProductIdentifierOptions() {
      //static identifications 
      const productIdentificationOptions = [
        { goodIdentificationTypeId: "productId", description: translate("Product ID") },
        { goodIdentificationTypeId: "groupId", description: translate("Group ID") },
        { goodIdentificationTypeId: "groupName", description: translate("Group name") },
        { goodIdentificationTypeId: "internalName", description: translate("Internal name") },
        { goodIdentificationTypeId: "parentProductName", description: translate("Parent product name") },
        { goodIdentificationTypeId: "primaryProductCategoryName", description: translate("Primary product category name") },
        { goodIdentificationTypeId: "title", description: translate("Title") }
      ]
      //good identification types
      let fetchedGoodIdentificationOptions = []
      try {
        const resp: any = await api({
          url: "oms/goodIdentificationTypes",
          method: "get",
          params: {
            parentTypeId: "HC_GOOD_ID_TYPE",
            pageSize: 50
          }
        });

        fetchedGoodIdentificationOptions = resp.data
      } catch (error) {
        console.error('Failed to fetch good identification types', error)
      }

      // Merge the arrays and remove duplicates
      this.settings.productIdentifier.productIdentificationOptions = Array.from(new Set([...productIdentificationOptions, ...fetchedGoodIdentificationOptions])).sort();
    },

    async fetchProducts() {
      try {
        const resp = await useSolrSearch().searchProducts({
          viewSize: 10
        })

        // searchProducts returns an array of docs on hits, and {} when the
        // catalog has none. An empty catalog is a normal state (e.g. a fresh
        // OMS with nothing indexed yet), not an error.
        this.settings.productIdentifier.sampleProducts = Array.isArray(resp.products) ? resp.products : []
        this.shuffleProduct()
      } catch (error: any) {
        console.error("Failed to fetch sample products", error)
      }
    },
    shuffleProduct() {
      if (this.settings.productIdentifier.sampleProducts.length) {
        const randomIndex = Math.floor(Math.random() * this.settings.productIdentifier.sampleProducts.length)
        this.settings.productIdentifier.currentSampleProduct = this.settings.productIdentifier.sampleProducts[randomIndex]
      } else {
        this.settings.productIdentifier.currentSampleProduct = null
      }
    }
  },
  // Only the selection and the identifier settings are kept: the sample products are Solr search results
  // for the Settings preview (screen data), and a field older versions kept (the product store rows) is
  // dropped on load, since pick applies to hydration too.
  persist: {
    pick: ['currentProductStoreId', 'settings.productIdentifier.productIdentificationPref', 'settings.productIdentifier.productIdentificationOptions']
  }
})
