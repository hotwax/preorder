import { MutationTree } from 'vuex'
import StockState from './StockState'
import * as types from './mutation-types'

const mutations: MutationTree <StockState> = {
    [types.STOCK_ADD_PRODUCT] (state, payload) {
        state.products[payload.productId] = payload.stock
    },
    [types.STOCK_ADD_PRODUCTS] (state, payload) {
        // TODO
        payload.products.forEach((product: any) => {
            state.products[product.productId] = product.atp
        });
    }
}
export default mutations;