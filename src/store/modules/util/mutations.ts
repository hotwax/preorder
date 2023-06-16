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
  }
}
export default mutations;