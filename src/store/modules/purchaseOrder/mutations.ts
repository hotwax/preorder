import { MutationTree } from 'vuex'
import PurchaseOrderState from './PurchaseOrder'
import * as types from './mutation-types'

const mutations: MutationTree<PurchaseOrderState> = {
  [types.PURCHASEORDER_LIST_UPDATED] (state, payload) {
    state.list.orders = payload.orders
    state.list.total = payload.total
  },
  [types.PURCHASEORDER_CURRENT_UPDATED] (state, payload) {
    state.current = payload
  },
}
export default mutations;