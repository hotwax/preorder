import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import moment from 'moment';
import emitter from '@/event-bus'
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
          commit(types.USER_EXPIRATION_TIME_UPDATED, resp.data.expirationTime);
          commit(types.USER_TOKEN_CHANGED, { newToken: resp.data.token })
          dispatch('getProfile')
          return resp.data;
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
  async getProfile ( { commit }) {
    const resp = await UserService.getProfile()
    if (resp.status === 200) {
      commit(types.USER_INFO_UPDATED, resp.data);
    }
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
   * Set user's selected brand
   */
     async setSelectedBrand ( { commit }, payload) {
      commit(types.USER_BRAND_UPDATED, payload.selectedBrand);
      // Reset all the current queries
      this.dispatch("product/resetProductList")
      this.dispatch("order/resetOrderQuery")
    },

  /**
    * Set User Instance Url
    */
     setUserInstanceUrl ({ state, commit }, payload){
      commit(types.USER_INSTANCE_URL_UPDATED, payload)
    }
}
export default actions;