import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree <UtilState> = {
  [types.UTIL_SERVICE_STATUS_DESC_UPDATED] (state, payload) {
    payload.map((status: any) => {
      state.statusDesc[status.statusId] = status.description;
    })
  },
  [types.UTIL_STORE_INV_CONFIG_UPDATED] (state, payload) {
    state.config = payload;
  },
  [types.UTIL_ENUMS_UPDATED](state, payload) {
    state.enums = payload;
  },
  [types.UTIL_FACILITIES_UPDATED](state, payload) {
    state.facilities = Object.keys(payload).length ? { ...state.facilities, ...payload } : {};
  }
}
export default mutations;