import { MutationTree } from 'vuex'
import OrderState from './OrderState'
import * as types from './mutation-types'

const mutations: MutationTree <OrderState> = {
    [types.ORDER_LIST_UPDATED] (state, payload) {
        state.list.items = payload.items
        state.list.total = payload.total
        state.list.preorderCount = payload.preorderCount
    },
    [types.ORDER_SELECTED_ITEMS_UPDATED] (state, payload) {
        state.selectedItems = payload.selectedItems
    },
    [types.ORDER_QUERY_UPDATED] (state, payload) {
        state.query = payload.query
    },
}
export default mutations;