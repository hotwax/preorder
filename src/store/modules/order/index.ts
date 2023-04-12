import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import OrderState from './OrderState'
import RootState from '../../RootState'

const orderModule: Module<OrderState, RootState> = {
    namespaced: true,
    state: {
      list: {
        items: [],
        total: 0,
        preorderCount: 0
      },
      query: {
        hasUpdated: false, // TODO Find a better way. We are handling empty state and result empty state differently. To identify whether a query is done added a flag variable.
        queryString: '',
        orderedAfter: '',
        orderedBefore: '',
        promisedAfter: '',
        promisedBefore: '',
        cusotmerLoyalty: '',
        hasPromisedDate: true,
        viewIndex: 0,
        viewSize: process.env.VUE_APP_VIEW_SIZE ? process.env.VUE_APP_VIEW_SIZE : 10 // To make sure the code doesn't breaks when there is not configuration set
      },
      selectedItems: [],
      brokeringCountByProduct: {},
      lastActionTimestamp: ''
    },
    getters,
    actions,
    mutations,
}

export default orderModule;

// TODO
// store.registerModule('order', orderModule);
