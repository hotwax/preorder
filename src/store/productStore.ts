import { defineStore } from 'pinia'
import { api, commonUtil, logger, translate, useSolrSearch } from '@common'
import { useUserStore } from '@/store/user'
const defaultProductStoreSettings = JSON.parse(import.meta.env.VITE_DEFAULT_PRODUCT_STORE_SETTINGS as string || '{"PRDT_IDEN_PREF":{"stateKey":"productIdentifier.productIdentificationPref","value":{"primaryId":"SKU","secondaryId":"productId"}}}')
const productStoreInitialization = new WeakMap<object, Promise<void>>()

export const useProductStore = defineStore('productStore', {
  state: () => ({
    currentProductStore: {} as any,
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
      barcodeIdentifier: {
        barcodeIdentifierPref: "",
        barcodeIdentifierOptions: [] as any[],
      },
      affectQOHOnRej: 'N'
    } as any,
    productStores: [] as any[],
    isProductStoreInitialized: false,
  }),

  getters: {
    getCurrentProductStore: (state) => state.currentProductStore,
    getProductStores: (state) => state.productStores,
    getSettings: (state) => state.settings,
    getProductIdentificationPref: (state) => state.settings.productIdentifier.productIdentificationPref,
    getBarcodeIdentifierPref: (state) => state.settings.barcodeIdentifier.barcodeIdentifierPref,
    getProductIdentificationOptions: (state) => state.settings.productIdentifier.productIdentificationOptions,
    getBarcodeIdentifierOptions: (state) => state.settings.barcodeIdentifier.barcodeIdentifierOptions,
    getCurrentSampleProduct: (state) => state.settings.productIdentifier.currentSampleProduct,
    getAffectQOHOnRej: (state) => state.settings.affectQOHOnRej,
  },

  actions: {
    async initializeProductStore() {
      if (this.isProductStoreInitialized) return

      const pendingInitialization = productStoreInitialization.get(this)
      if (pendingInitialization) return pendingInitialization

      const initialization = (async () => {
        await this.fetchProductStores()
        await this.fetchProductStorePreference()
        this.isProductStoreInitialized = true
      })()

      productStoreInitialization.set(this, initialization)
      try {
        await initialization
      } finally {
        productStoreInitialization.delete(this)
      }
    },
    async setCurrentProductStore(store: any) {
      this.currentProductStore = store
      this.fetchProductStoreSettings(store.productStoreId);
    },

    async fetchProductStores() {
      try {
        const payload = {
          fieldsToSelect: ["productStoreId", "storeName"],
          pageSize: 250
        }

        const resp = await api({
          url: `/admin/productStores`,
          method: "GET",
          params: payload
        });

        if (!commonUtil.hasError(resp)) {
          const stores = resp.data
          this.productStores = stores
          if (stores.length) {
            const selectedStore = stores.find((store: any) => store.productStoreId === this.currentProductStore?.productStoreId)
            this.currentProductStore = selectedStore || stores[0]
          } else {
            this.currentProductStore = {}
          }
        } else {
          throw resp.data
        }
      } catch (err) {
        logger.error("Failed to fetch product stores", err)
      }
    },

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
        if (preferredStoreId) {
          const store = this.productStores?.find((store: any) => store.productStoreId === preferredStoreId);
          if (store) {
            this.setCurrentProductStore(store)
            return
          }
        }
        if (this.productStores?.length && !this.productStores.some((store: any) => store.productStoreId === this.currentProductStore?.productStoreId)) {
          this.setCurrentProductStore(this.productStores[0])
        }
      } catch (err) {
        logger.error('Favourite product store not found', err)
        if (this.productStores?.length && !this.currentProductStore?.productStoreId) {
          this.setCurrentProductStore(this.productStores[0])
        }
      }
    },
    async setProductStorePreference(payload: any) {
      const userStore = useUserStore();
      try {
        await api({
          url: "admin/user/preferences",
          method: "PUT",
          data: {
            userId: userStore.current.userId,
            preferenceKey: 'SELECTED_BRAND',
            preferenceValue: payload.productStoreId,
          }
        });
      } catch (error) {
        console.error('error', error)
      }
      this.fetchProductStoreSettings(payload.productStoreId);
      this.currentProductStore = payload;
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
      this.settings.barcodeIdentifier.barcodeIdentifierOptions = fetchedGoodIdentificationOptions
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
  persist: {
    omit: ['isProductStoreInitialized']
  }
})
