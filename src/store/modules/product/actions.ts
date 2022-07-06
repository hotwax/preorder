import { ProductService } from '@/services/ProductService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import ProductState from './ProductState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import emitter from '@/event-bus'
import { fetchProducts, findProductFeatureTypeDetails } from '@hotwax/oms-api/src/product/index'
import { Product, Response } from '@hotwax/oms-api/src/types'


const actions: ActionTree<ProductState, RootState> = {

  /**
   * Fetch cached products
   */
  async fetchProducts ( { commit, state }, { productIds }) {
    const cachedProductIds = Object.keys(state.cached);

    const productIdFilter= productIds.reduce((filter: Array<any>, productId: any) => {
      // If product does not exist in cached products then add the id
      if (!cachedProductIds.includes(productId) && productId) {
        filter.push(productId);
      }
      return filter;
    }, []);

    // If there are no products skip the API call
    if (productIdFilter.length <= 0) return;

    const resp: Product[] | Response = await fetchProducts(productIdFilter)
    if (resp && (resp as Response).code !== 'error') {
      const products = resp;
      this.dispatch('util/findProductFeatureTypeDetails', products)
      commit(types.PRODUCT_ADD_TO_CACHED_MULTIPLE, { products });
    } else {
      console.error('Failed to fetch the products', resp)
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Fetch cached product
   */
   async fetchProduct ( { commit }, { productId }) {
    // TODO Skip if already exist
    const resp: Product[] | Response = await fetchProducts([productId])
    if ((resp as Response).code !== 'error') {
      const product = (resp as Product[])[0];
      commit(types.PRODUCT_ADD_TO_CACHED, { product });
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Find Order
   */
   async findProducts ( { commit, state, dispatch }, payload) {
    // Show loader only when new query and not the infinite scroll
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    let resp;
    try {
      resp = await ProductService.findOrder(payload)
      if (resp.status === 200 && !hasError(resp)) {
        const products = resp.data.grouped.parentProductId;
        // Add stock information to Stock module to show on UI
        dispatch('getProductsInformation', { products });
        // Handled case for infinite scroll
        if (payload.viewIndex && payload.viewIndex > 0) products.groups = state.list.items.concat(products.groups)
        commit(types.PRODUCT_LIST_UPDATED, { products });
      } else {
        showToast(translate("Something went wrong"));
      }
      // Remove added loader only when new query and not the infinite scroll
      if (payload.viewIndex === 0) emitter.emit("dismissLoader");
    } catch(error){
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Reset Order List
   */
   resetProductList ( { commit }) {
    commit(types.PRODUCT_LIST_UPDATED, {
      products: {
        groups: [],
        ngroups: 0
      }
    });
  },
  /**
   * Get Product related information 
   */
   async getProductsInformation  ( context , { products }) {
    // To remove redundant value Set is used
    let productIds: any = new Set();
    products.groups.forEach((product: any) => {
      productIds.add(product.groupValue);
    });
    // Converted to list as methods like reduce not supported
    productIds = [...productIds]
    if (productIds.length) {
      this.dispatch('product/fetchProducts', { productIds })
      this.dispatch('stock/addProducts', { productIds })
    }
  },

  async loadCurrent ({ dispatch, commit} , { productId }) {
    const current = {
      product: {},
      list: {
          total: 0,
          items: []
      },
      totalPreOrders: 0
    }
    current.product = this.getters['product/getProduct'](productId);

    if (Object.keys(current.product).length !== 0) {
      return commit(types.PRODUCT_CURRENT_UPDATED, { current });
    } else {
      return dispatch("fetchProduct", { productId }).then(() => {
        current.product = this.getters['product/getProduct'](productId);
        commit(types.PRODUCT_CURRENT_UPDATED, { current });
      })// TODO Rethrow to show error and navigation to product list page
    }
  },
  /**
   * Fetch Current List
   */
   async fetchCurrentList ( { commit, state, dispatch }, payload) {
    // Show loader only when new query and not the infinite scroll
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    let resp;
    try {
      resp = await ProductService.fetchCurrentList(payload)
      if (resp.status === 200 && !hasError(resp)) {
        const products = resp.data.grouped.productId;
        const current = state.current;
        current.list.items = products.groups
        current.list.total = products.ngroups
        current.totalPreOrders = resp.data.grouped.productId.matches
        // Add stock information to Stock module to show on UI
        dispatch('getProductsInformation', { products });
        // Handled case for infinite scroll
        // if (payload.viewIndex && payload.viewIndex > 0) products.groups = state.current.list.items.concat(products.groups)
        commit(types.PRODUCT_CURRENT_UPDATED, { current });
      } else {
        showToast(translate("Something went wrong"));
      }
      // Remove added loader only when new query and not the infinite scroll
      if (payload.viewIndex === 0) emitter.emit("dismissLoader");
    } catch(error){
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  }
}
export default actions;