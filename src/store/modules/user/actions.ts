import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import { Settings } from 'luxon'
import { updateInstanceUrl, updateToken, resetConfig } from '@/adapter'
import { useAuthStore } from '@hotwax/dxp-components';

const actions: ActionTree<UserState, RootState> = {

  /**
 * Login user and return token
 */
  async login ({ commit, dispatch }, payload) {

    const { token, oms } = payload;
    dispatch("setUserInstanceUrl", oms);

    try {
        if (token) {
          const permissionId = process.env.VUE_APP_PERMISSION_ID;
          if (permissionId) {
            const checkPermissionResponse = await UserService.checkPermission({
              data: {
                permissionId
              },
              headers: {
                Authorization:  'Bearer ' + token,
                'Content-Type': 'application/json'
              }
            });

            if (checkPermissionResponse.status === 200 && !hasError(checkPermissionResponse) && checkPermissionResponse.data && checkPermissionResponse.data.hasPermission) {
              commit(types.USER_TOKEN_CHANGED, { newToken: token })
              updateToken(token)
              await dispatch('getProfile')
            } else {
              const permissionError = 'You do not have permission to access the app.';
              showToast(translate(permissionError));
              console.error("error", permissionError);
              return Promise.reject(new Error(permissionError));
            }
          } else {
            commit(types.USER_TOKEN_CHANGED, { newToken: token })
            updateToken(token)
            await dispatch('getProfile')
          }
        }
    } catch (err: any) {
      showToast(translate('Something went wrong'));
      console.error("error", err);
      return Promise.reject(new Error(err))
    }
  },

  /**
   * Logout user
   */
  async logout ({ commit }) {
    const authStore = useAuthStore()

    // TODO add any other tasks if need
    commit(types.USER_END_SESSION)
    resetConfig();
    this.dispatch("product/resetProductList")
    this.dispatch("product/resetCatalogProducts")
    this.dispatch("order/resetOrderQuery")
    this.dispatch("job/clearCtgryAndBrkrngJobs")
    this.dispatch("util/clearInvConfigs")

    // reset plugin state on logout
    authStore.$reset()
  },

  /**
   * Get User profile
   */
  async getProfile ( { commit }) {
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
    async setEcomStore({ commit }, payload) {
      commit(types.USER_CURRENT_ECOM_STORE_UPDATED, payload.eComStore);
      // Reset all the current queries
      this.dispatch("product/resetProductList")
      this.dispatch("order/resetOrderQuery")
      await UserService.setUserPreference({
        'userPrefTypeId': 'SELECTED_BRAND',
        'userPrefValue': payload.eComStore.productStoreId
      });
    },

  /**
   * Set User Instance Url
   */
    setUserInstanceUrl ({ commit }, payload){
      commit(types.USER_INSTANCE_URL_UPDATED, payload)
      updateInstanceUrl(payload)
    },
}
export default actions;