import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import UserState from './UserState'
import RootState from '../../RootState'

const userModule: Module<UserState, RootState> = {
    namespaced: true,
    state: {
      token: '',
      permissions: [],
      current: {},
      instanceUrl: '',
      currentEComStore: {},
      virtualFacilities: {},
      currentOrderParking: [],
      pwaState: {
        updateExists: false,
        registration: null,
      },
      omsRedirectionUrl: "",
      isMoquiOnly: false,
      productIdentificationPref: {
        primaryId: 'productId',
        secondaryId: ''
      },
      productStoreFacilities: [],
      productIdentificationOptions: []
    },
    getters,
    actions,
    mutations,
}

export default userModule;

// TODO
// store.registerModule('user', userModule);
