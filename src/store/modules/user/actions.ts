import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import { Settings } from 'luxon'
import { updateInstanceUrl, updateToken, resetConfig, logout, getUserPreference } from '@/adapter'
import { useAuthStore, useProductIdentificationStore } from '@hotwax/dxp-components';
import { UtilService } from '@/services/UtilService'
import { getServerPermissionsFromRules, prepareAppPermissions, resetPermissions, setPermissions } from '@/authorization'
import emitter from '@/event-bus'
import store from '@/store'

const actions: ActionTree<UserState, RootState> = {

  /**
 * Login user and return token
 */
  async login ({ commit, dispatch }, payload) {

    const { token, oms } = payload;
    dispatch("setUserInstanceUrl", oms);
    try {
      if (token) {
        // Getting the permissions list from server
        const permissionId = process.env.VUE_APP_PERMISSION_ID;

        // Prepare permissions list
        const serverPermissionsFromRules = getServerPermissionsFromRules();
        if (permissionId) serverPermissionsFromRules.push(permissionId);

          const serverPermissions = await UserService.getUserPermissions({
            permissionIds: [...new Set(serverPermissionsFromRules)]
          }, token);
          const appPermissions = prepareAppPermissions(serverPermissions);

          // Checking if the user has permission to access the app
          // If there is no configuration, the permission check is not enabled
          if (permissionId) {
            // As the token is not yet set in the state passing token headers explicitly
            // TODO Abstract this out, how token is handled should be part of the method not the callee
            const hasPermission = appPermissions.some((appPermission: any) => appPermission.action === permissionId );
            // If there are any errors or permission check fails do not allow user to login
            if (!hasPermission) {
              const permissionError = "You do not have permission to access the app.";
              showToast(translate(permissionError));
              console.error("error", permissionError);
              return Promise.reject(new Error(permissionError));
            }
          }

          const isAdminUser = appPermissions.some((appPermission: any) => appPermission?.action === "MERCHANDISING_ADMIN");

          // Getting user profile & if user is not associated with any product store, then showing this error
          const userProfile = await UserService.getUserProfile(token);
          try {
            userProfile.stores = await UserService.getProductStores(token, userProfile.partyId, isAdminUser);
          } catch (error) {
            const reason = "Unable to login. User is not associated with any product store.";
            console.error(reason, error);
            showToast(translate(reason));
            return Promise.reject(new Error(reason));
          }
          
          // Getting user preferred store
          let preferredStore = userProfile.stores[0];
          const preferredStoreId =  await UserService.getPreferredStore(token);
          if (preferredStoreId) {
            const store = userProfile.stores.find((store: any) => store.productStoreId === preferredStoreId);
            store && (preferredStore = store)
          }

          setPermissions(appPermissions);
          if (userProfile.userTimeZone) {
            Settings.defaultZone = userProfile.userTimeZone;
          }

          // TODO user single mutation
          commit(types.USER_CURRENT_PRODUCT_STORE_UPDATED,  preferredStore);
          commit(types.USER_INFO_UPDATED, userProfile);
          commit(types.USER_TOKEN_CHANGED, { newToken: token });
          commit(types.USER_PERMISSIONS_UPDATED, appPermissions);
          updateToken(token);

          await dispatch("fetchVirtualFacilities", { token })

        // Get product identification from api using dxp-component
        await useProductIdentificationStore().getIdentificationPref(preferredStoreId)
          .catch((error) => console.error(error));

        setPermissions(appPermissions);
        if (userProfile.userTimeZone) {
          Settings.defaultZone = userProfile.userTimeZone;
        }

        // TODO user single mutation
        commit(types.USER_CURRENT_PRODUCT_STORE_UPDATED, preferredStore);
        commit(types.USER_INFO_UPDATED, userProfile);
        commit(types.USER_TOKEN_CHANGED, { newToken: token });
        commit(types.USER_PERMISSIONS_UPDATED, appPermissions);
        updateToken(token);
      }
    } catch (err: any) {
      showToast(translate('Something went wrong'));
      console.error("error", err);
      return Promise.reject(err instanceof Object ? err :new Error(err));
    }
  },

  /**
   * Logout user
   */
  async logout ({ commit }, payload) {
    // store the url on which we need to redirect the user after logout api completes in case of SSO enabled
    let redirectionUrl = ''

    emitter.emit('presentLoader')
    // Calling the logout api to flag the user as logged out, only when user is authorised
    // if the user is already unauthorised then not calling the logout api as it returns 401 again that results in a loop, thus there is no need to call logout api if the user is unauthorised
    if(!payload?.isUserUnauthorised) {
      let resp;

      // wrapping the parsing logic in try catch as in some case the logout api makes redirection, and then we are unable to parse the resp and thus the logout process halts
      try {
        resp = await logout();

        // Added logic to remove the `//` from the resp as in case of get request we are having the extra characters and in case of post we are having 403
        resp = JSON.parse(resp.startsWith('//') ? resp.replace('//', '') : resp)
      } catch(err) {
        console.error('Error parsing data', err)
      }

      if(resp?.logoutAuthType == 'SAML2SSO') {
        redirectionUrl = resp.logoutUrl
      }
    }

    const authStore = useAuthStore()

    // TODO add any other tasks if need
    commit(types.USER_END_SESSION)
    resetConfig();
    this.dispatch("product/resetProductList")
    this.dispatch("product/resetCatalogProducts")
    this.dispatch("order/resetOrderQuery")
    this.dispatch("job/clearCtgryAndBrkrngJobs")
    this.dispatch("util/clearInvConfigs")
    resetPermissions();

    // reset plugin state on logout
    authStore.$reset()

    emitter.emit('dismissLoader')
    // If we get any url in logout api resp then we will redirect the user to the url
    if(redirectionUrl) {
      window.location.href = redirectionUrl
      return redirectionUrl;
    }

    return '';
  },

  /**
   * Update user timeZone
   */
  async setUserTimeZone ( { state, commit }, timeZoneId) {
    const current: any = state.current;
    current.userTimeZone = timeZoneId;
    commit(types.USER_INFO_UPDATED, current);
    Settings.defaultZone = current.userTimeZone;
  },

  /**
   * Set user's selected Ecom store
   */
    async setProductStore({ commit }, payload) {
      commit(types.USER_CURRENT_PRODUCT_STORE_UPDATED, payload.productStore);
      // Reset all the current queries
      this.dispatch("product/resetProductList")
      this.dispatch("order/resetOrderQuery")
      await UserService.setUserPreference({
        'userPrefTypeId': 'SELECTED_BRAND',
        'userPrefValue': payload.productStore.productStoreId
      });
    
      // Get product identification from api using dxp-component
      await useProductIdentificationStore().getIdentificationPref(payload.productStore.productStoreId)
        .catch((error) => console.error(error));
    },

  /**
   * Set User Instance Url
   */
    setUserInstanceUrl ({ commit }, payload){
      commit(types.USER_INSTANCE_URL_UPDATED, payload)
      updateInstanceUrl(payload)
    },

  async fetchVirtualFacilities({ commit }, params) {
    const payload = {
      inputFields: {
        parentTypeId: "VIRTUAL_FACILITY"
      },
      viewSize: 200, // expecting that there will be no more than 200 virtual facilities
      fieldList: ["facilityId", "facilityName"],
      entityName: "FacilityAndType"
    }

    try {
      const resp = await UtilService.fetchFacilities(payload)

      if(resp.status == 200 && !hasError(resp) && resp.data?.docs?.length) {
        const facilities = resp.data.docs.reduce((facilities: any, facility: any) => {
          facilities[facility.facilityId] = facility.facilityName
          return facilities
        }, {})

        // Default parking from where the orders will be fetched
        let currentOrderParking = ["PRE_ORDER_PARKING", "BACKORDER_PARKING"] as string[]

        const userPreferredParking =  await getUserPreference(params.token, store.getters["user/getBaseUrl"], "SELECTED_ORDER_PARKING");

        // if we already have a preference for order parking then updating it
        if(userPreferredParking?.length) {
          currentOrderParking = Object.keys(facilities).filter((facilityId: any) => userPreferredParking.includes(facilityId))
        }

        commit(types.USER_CURRENT_PARKING_UPDATED, currentOrderParking);
        commit(types.USER_VIRTUAL_FACILITIES_UPDATED, facilities)
      } else {
        throw resp.data
      }
    } catch(err) {
      console.error('Failed to fetch facilities for selection', err)
    }
  },

  async setOrderParking({ commit }, payload) {
    commit(types.USER_CURRENT_PARKING_UPDATED, payload);
    await UserService.setUserPreference({
      "userPrefTypeId": "SELECTED_ORDER_PARKING",
      "userPrefValue": JSON.stringify(payload)
    });
  },
    updatePwaState({ commit }, payload) {
      commit(types.USER_PWA_STATE_UPDATED, payload);
    }

}
export default actions;