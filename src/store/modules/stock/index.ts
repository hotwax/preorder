import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import StockState from './StockState'
import RootState from '../../RootState'

const stockModule: Module<StockState, RootState> = {
    namespaced: true,
    state: {
      products: {}
    },
    getters,
    actions,
    mutations,
}

export default stockModule;

// TODO
// store.registerModule('stock', stockModule);
