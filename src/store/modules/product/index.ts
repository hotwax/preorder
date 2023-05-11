import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import ProductState from './ProductState'
import RootState from '../../RootState'

const productModule: Module<ProductState, RootState> = {
    namespaced: true,
    state: {
      cached: {},
      list: {
        items: [],
        total: 0
      },
      current: {
        product: {},
        list: {
            total: 0,
            items: []
        },
        totalPreOrders: 0
      },
      catalogProducts: {
        items: [],
        total: 0
      },
      currentCatalogProduct: {}
    },
    getters,
    actions,
    mutations,
}

export default productModule;

// TODO
// store.registerModule('product', productModule);
