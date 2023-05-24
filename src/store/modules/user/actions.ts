import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import { Settings } from 'luxon'
import { updateInstanceUrl, updateToken, resetConfig } from '@/adapter'

const actions: ActionTree<UserState, RootState> = {

  /**
 * Login user and return token
 */
  async login ({ commit, dispatch }, { username, password }) {
    try {
      const resp = await UserService.login(username, password)
      if (resp.status === 200 && resp.data) {
        if (resp.data.token) {
          const permissionId = process.env.VUE_APP_PERMISSION_ID;
          if (permissionId) {
            const checkPermissionResponse = await UserService.checkPermission({
              data: {
                permissionId
              },
              headers: {
                Authorization:  'Bearer ' + resp.data.token,
                'Content-Type': 'application/json'
              }
            });

            if (checkPermissionResponse.status === 200 && !hasError(checkPermissionResponse) && checkPermissionResponse.data && checkPermissionResponse.data.hasPermission) {
              commit(types.USER_TOKEN_CHANGED, { newToken: resp.data.token })
              updateToken(resp.data.token)
              await dispatch('getProfile')
              if (resp.data._EVENT_MESSAGE_ && resp.data._EVENT_MESSAGE_.startsWith("Alert:")) {
                // TODO Internationalise text
                showToast(translate(resp.data._EVENT_MESSAGE_));
              }
              return resp.data;
            } else {
              const permissionError = 'You do not have permission to access the app.';
              showToast(translate(permissionError));
              console.error("error", permissionError);
              return Promise.reject(new Error(permissionError));
            }
          } else {
            commit(types.USER_TOKEN_CHANGED, { newToken: resp.data.token })
            updateToken(resp.data.token)
            await dispatch('getProfile')
            return resp.data;
          }
        } else if (hasError(resp)) {
          showToast(translate('Sorry, your username or password is incorrect. Please try again.'));
          console.error("error", resp.data._ERROR_MESSAGE_);
          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }
      } else {
        showToast(translate('Something went wrong'));
        console.error("error", resp.data._ERROR_MESSAGE_);
        return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
      }
    } catch (err: any) {
      showToast(translate('Something went wrong'));
      console.error("error", err);
      return Promise.reject(new Error(err))
    }
    // return resp
  },

  /**
   * Logout user
   */
  async logout ({ commit }) {
    // TODO add any other tasks if need
    commit(types.USER_END_SESSION)
    resetConfig();
    this.dispatch("product/resetProductList")
    this.dispatch("order/resetOrderQuery")
    this.dispatch("job/clearCtgryAndBrkrngJobs")
  },

  /**
   * Get User profile
   */
  async getProfile ( { commit, dispatch }) {
    const resp = await UserService.getProfile()
    const userProfile = JSON.parse(JSON.stringify(resp.data));

    if (resp.status === 200) {
      if(userProfile.userTimeZone) {
        Settings.defaultZone = userProfile.userTimeZone;
      }
      const payload = {
        "inputFields": {
          "storeName_op": "not-empty",
          "partyId": userProfile.partyId
        },
        "fieldList": ["productStoreId", "storeName"],
        "entityName": "ProductStoreAndRole",
        "distinct": "Y",
        "noConditionFind": "Y"
      }

      const storeResp = await UserService.getEComStores(payload);
      let stores = [] as any;
      if(!hasError(storeResp) ) {
        stores = storeResp.data.docs
      }
      userProfile.stores = stores;

      let userPrefStore = {} as any

      if (stores.length > 0) {
        userPrefStore = stores[0];
        try {
          const userPrefResponse =  await UserService.getUserPreference({
            'userPrefTypeId': 'SELECTED_BRAND'
          });
          userPrefResponse.data.userPrefValue && (userPrefStore = stores.find((store: any) => store.productStoreId == userPrefResponse.data.userPrefValue))
        } catch (err) {
          console.error(err)
        }
      }
      commit(types.USER_CURRENT_ECOM_STORE_UPDATED,  userPrefStore);
      commit(types.USER_INFO_UPDATED, userProfile);
      this.dispatch('util/getServiceStatusDesc')
      await dispatch('getReserveInvConfig', userPrefStore.productStoreId)
      await dispatch('getPreOrdPhyInvHoldConfig', userPrefStore.productStoreId)
    }
  },

  /**
   * Update user timeZone
   */
     async setUserTimeZone ( { state, commit }, payload) {
      const resp = await UserService.setUserTimeZone(payload)
      if (resp.status === 200 && !hasError(resp)) {
        const current: any = state.current;
        current.userTimeZone = payload.timeZoneId;
        commit(types.USER_INFO_UPDATED, current);
        Settings.defaultZone = current.userTimeZone;
        showToast(translate("Time zone updated successfully"));
      }
    },

  /**
   * Set user's selected Ecom store
   */
    async setEcomStore({ commit, dispatch }, payload) {
      commit(types.USER_CURRENT_ECOM_STORE_UPDATED, payload.eComStore);
      // Reset all the current queries
      this.dispatch("product/resetProductList")
      this.dispatch("order/resetOrderQuery")
      await UserService.setUserPreference({
        'userPrefTypeId': 'SELECTED_BRAND',
        'userPrefValue': payload.eComStore.productStoreId
      });
      await dispatch('getReserveInvConfig', payload.eComStore.productStoreId)
      await dispatch('getPreOrdPhyInvHoldConfig', payload.eComStore.productStoreId)
    },

  /**
   * Set User Instance Url
   */
    setUserInstanceUrl ({ commit }, payload){
      commit(types.USER_INSTANCE_URL_UPDATED, payload)
      updateInstanceUrl(payload)
    },

  /**
    Get reserve inventory config
   */
    async getReserveInvConfig({ commit, state }, productStoreId) {
      const resp = await UserService.getReserveInvConfig({
        "inputFields": {
          "productStoreId": productStoreId
        },
        "fieldList": ["productStoreId", "reserveInventory"],
        "entityName": "ProductStore",
      })
      let reserveInvConfig = {}, inventoryConfig = {}
      if (!hasError(resp)) {
        reserveInvConfig = resp.data.docs[0]
      }
      inventoryConfig = { ...state.inventoryConfig, 'reserveInv': reserveInvConfig }
      commit(types.USER_STORE_INV_CONFIG_UPDATED, inventoryConfig)
    },

  /**
    Get preorder physical inventory hold config
   */
    async getPreOrdPhyInvHoldConfig({ commit, state }, productStoreId) {
      const resp = await UserService.getPreOrdPhyInvHoldConfig({
        "inputFields": {
          "productStoreId": productStoreId,
          "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV"
        },
        "fieldList": ["settingTypeEnumId", "settingValue", "fromDate"],
        "entityName": "ProductStoreSetting",
      })
      let preOrdPhyInvHoldConfig = {}, inventoryConfig = {}
      if (!hasError(resp)) {
        preOrdPhyInvHoldConfig = resp.data.docs[0]
      }
      inventoryConfig = {...state.inventoryConfig, 'preOrdPhyInvHold': preOrdPhyInvHoldConfig }
      commit(types.USER_STORE_INV_CONFIG_UPDATED, inventoryConfig)
    },

    /**
    Update preorder physical inventory hold config
   */
    async updatePreOrdPhyInvHoldStatus({ dispatch, state }, payload) {
      // Handled initial programmatical update
      // When storing boolean values, it is stored as string. Further comparison needs conversion
      if (payload.config.settingValue === payload.value || (typeof payload.value === 'boolean' && (payload.config.settingValue == 'true') === payload.value)) {
        return;
      }
      
      const productStoreId = (state.currentEComStore as any).productStoreId
      const params = {
        "fromDate": payload.config.fromDate,
        "settingTypeEnumId": 'HOLD_PRORD_PHYCL_INV',
        "settingValue": payload.value,
        productStoreId
      }

      try {
        const resp = await UserService.updatePreOrdPhyInvHoldStatus(params) as any
        if(!hasError(resp)) {
          showToast(translate('Configuration updated'))
        } else {
          showToast(translate('Failed to update configuration'))
        }
      } catch(err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }

      dispatch('getPreOrdPhyInvHoldConfig', productStoreId)
    },

    /**
    Update reserve inventory config
   */
    async updateReserveInvStatus({ dispatch, state }, payload) {
      // Handled initial programmatical update
      if ((payload.config.reserveInventory === "Y" && payload.value ) || (payload.config.reserveInventory === "N" && !payload.value )) {
        return;
      }
      
      const productStoreId = (state.currentEComStore as any).productStoreId
      const params = {
        "reserveInventory": payload.value ? "Y" : "N",
        productStoreId
      }

      try {
        const resp = await UserService.updateReserveInvStatus(params) as any
        if(!hasError(resp)) {
          showToast(translate('Configuration updated'))
        } else {
          showToast(translate('Failed to update configuration'))
        }
      } catch(err) {
        showToast(translate('Failed to update configuration'))
        console.error(err)
      }

      dispatch('getReserveInvConfig', productStoreId)
    },
}
export default actions;