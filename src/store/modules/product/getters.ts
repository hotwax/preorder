import { GetterTree } from 'vuex'
import ProductState from './ProductState'
import RootState from '../../RootState'

const getters: GetterTree <ProductState, RootState> = {
    getCached (state) {
        return state.cached
    },
    getProduct: (state) => (productId: string) => {
        // Returning empty object so that it doesn't breaks the UI
        return state.cached[productId] ? state.cached[productId] : {};
    },
    getList (state) {
        return state.list.items
    },
    getProductOrders: (state) => (productId: string) => {
        return state.list.items.find(item => item.groupValue === productId);
    },
    isScrolleable(state) {
        return state.list.items.length > 0 && state.list.items.length < state.list.total
    },
    getCurrent: (state) => {
        return state.current;
    },
    getCatalogProducts: (state) => {
        return state.catalogProducts.items
    },
    isCatalogScrolleable(state) {
        return state.catalogProducts.items.length > 0 && state.catalogProducts.items.length < state.catalogProducts.total
    },
}
export default getters;