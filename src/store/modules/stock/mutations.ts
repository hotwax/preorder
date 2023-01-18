import { MutationTree } from 'vuex'
import StockState from './StockState'
import * as types from './mutation-types'
import { Stock } from '@/adapter'

const mutations: MutationTree <StockState> = {
    [types.STOCK_ADD_PRODUCT] (state, payload) {
        state.products[payload.productId] = payload.stock
    },
    [types.STOCK_ADD_PRODUCTS] (state, payload) {
        // TODO
        payload.forEach((productStock: Stock) => {
            state.products[productStock.productId] = productStock.availableToPromiseTotal
        });
    }
}
export default mutations;