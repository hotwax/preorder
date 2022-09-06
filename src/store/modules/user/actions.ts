import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import "moment-timezone";

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
              dispatch('getProfile')
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
            dispatch('getProfile')
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
    } catch (err) {
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
    
  },

  /**
   * Get User profile
   */
  async getProfile ( { commit, dispatch }) {
    const resp = await UserService.getProfile()
    if (resp.status === 200) {
      const payload = {
        "inputFields": {
          "storeName_op": "not-empty"
        },
        "fieldList": ["productStoreId", "storeName"],
        "entityName": "ProductStore",
        "distinct": "Y",
        "noConditionFind": "Y"
      }

      const storeResp = await UserService.getEComStores(payload);
      let stores = [] as any;
      if(storeResp.status === 200 && !hasError(storeResp) && storeResp.data.docs?.length > 0) {
        stores = [...storeResp.data.docs]
      }

      let userPrefStore = ''

      try {
        const userPref =  await UserService.getUserPreference({
          'userPrefTypeId': 'SELECTED_BRAND'
        });
        userPrefStore = stores.find((store: any) => store.productStoreId == userPref.data.userPrefValue)
      } catch (err) {
        console.error(err)
      }
      dispatch('setEcomStore', { eComStore: userPrefStore ? userPrefStore : stores.length > 0 ? stores[0] : {} });
      commit(types.USER_INFO_UPDATED, resp.data);
    }
  },



  /**
   * Set User Instance Url
   */
  setUserInstanceUrl ({ commit }, payload){
    commit(types.USER_INSTANCE_URL_UPDATED, payload)
  },

  /**
   * Update user timeZone
   */
     async setUserTimeZone ( { state, commit }, payload) {
      const resp = await UserService.setUserTimeZone(payload)
      if (resp.status === 200 && !hasError(resp)) {
        const current: any = state.current;
        current.userTimeZone = payload.tzId;
        commit(types.USER_INFO_UPDATED, current);
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
}
export default actions;