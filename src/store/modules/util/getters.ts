import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree <UtilState, RootState> = {
  getStatusDesc: (state) => (statusId: any) => {
    return state.statusDesc[statusId] ? state.statusDesc[statusId] : "-";
  },
  getInventoryConfig: (state) => (type: string, productStoreId: string) => {
    return Object.keys((state.config)).length && (Object.keys((state.config as any)[type]).length) ? (state.config as any)[type][productStoreId] : {}
  }
}
export default getters;