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
      pwaState: {
        updateExists: false,
        registration: null,
      },
      omsRedirectionInfo: {
        url: "",
        token: ""
      }
    },
    getters,
    actions,
    mutations,
}

export default userModule;

// TODO
// store.registerModule('user', userModule);
