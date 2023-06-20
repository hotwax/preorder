import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree <UtilState, RootState> = {
  getStatusDesc: (state) => (statusId: any) => {
    return state.statusDesc[statusId] ? state.statusDesc[statusId] : "-";
  },
  getInventoryConfig: (state, getters, rootState, rootGetters) => (type: string) => {
    const productStoreId = rootState.user.currentEComStore.productStoreId
    return (Object.keys((state.config as any)[type]).length) ? (state.config as any)[type][productStoreId] : {}
  }
}
export default getters;