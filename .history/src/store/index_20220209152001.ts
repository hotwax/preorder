import { createStore, useStore as useVuexStore } from "vuex"
import mutations  from './mutations'
import getters  from './getters'
import actions from './actions'
import RootState from './RootState'
import createPersistedState from "vuex-persistedstate";
import userModule from './modules/user';
import orderModule from "./modules/order";
import stockModule from "./modules/stock"
import productModule from "./modules/product"
import jobModule from "./modules/job"
import SecureLS from "secure-ls";


// TODO check how to register it from the components only
// Handle same module registering multiple time on page refresh
//store.registerModule('user', userModule);


const state: any = {

}

const persistState = createPersistedState({
    paths: ['user'],
    fetchBeforeUse: true
})

// Added modules here so that hydration takes place before routing
const store = createStore<RootState>({
    state,
    actions,
    mutations,
    getters,
    plugins: [ persistState ],
    modules: { 
        'user': userModule,
        'order': orderModule,
        'stock': stockModule,
        'product': productModule,
        'job': jobModule
    },
})

export default store
export function useStore(): typeof store {
    return useVuexStore()
}