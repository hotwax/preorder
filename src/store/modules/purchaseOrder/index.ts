import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import PurchaseOrderState from './PurchaseOrder'
import RootState from '@/store/RootState'

const purchaseOrder: Module<PurchaseOrderState, RootState> = {
  namespaced: true,
  state: {
    list: {
      orders: [],
      total: 0
    },
    current: {},
  },
  getters,
  actions,
  mutations,
}

export default purchaseOrder;