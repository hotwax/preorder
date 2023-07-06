import { ProductService } from '@/services/ProductService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import ProductState from './ProductState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import emitter from '@/event-bus'


const actions: ActionTree<ProductState, RootState> = {

  /**
   * Fetch cached products
   */
  async fetchProducts ( { commit, state }, { productIds }) {
    const cachedProducts = JSON.parse(JSON.stringify(state.cached));
    const cachedProductIds = Object.keys(state.cached);
    const productIdFilter= productIds.reduce((filter: string, productId: any) => {
      // If product already exist in cached products skip
      if (cachedProductIds.includes(productId)) {
        return filter;
      } else {
        // checking condition that if the filter is not empty then adding 'OR' to the filter
        if (filter !== '') filter += ' OR '
        return filter += productId;
      }
    }, '');

    // If there are no products skip the API call
    if (productIdFilter === '') return cachedProducts;

    const resp = await ProductService.fetchProducts({
      "filters": ['productId: (' + productIdFilter + ')'],
      "viewSize": productIds.length
    })
    if (resp.status === 200 && !hasError(resp)) {
      const products = resp.data.response.docs;
      // Handled empty response in case of failed query
      if (resp.data) {
        products.forEach((product: any) => {
          cachedProducts[product.productId] = product
        });
      }
      commit(types.PRODUCT_CACHED_UPDATED, { cached: cachedProducts });
    }
    return cachedProducts;
  },

  /**
   * Fetch cached product
   */
   async fetchProduct ( { commit }, { productId }) {
    // TODO Skip if already exist
    const resp = await ProductService.fetchProducts({
      "filters": ['productId: ' + productId ]
    })
    if (resp.status === 200 && !hasError(resp)) {
      const product = resp.data.response.docs[0];
      // Handled empty response in case of failed query
      if (resp.data) commit(types.PRODUCT_ADD_TO_CACHED, { product });
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Find Products in Orders
   */
   async findProducts ( { rootState, commit, state, dispatch }, payload) {
    // If there is not current product store setup query should not be allowed
    // TODO  
    // Need a permanent fix through login action
    // Will be done as per the GitHub app changes once done
    if (!rootState.user.currentEComStore?.productStoreId) {
      return;
    }
    // Show loader only when new query and not the infinite scroll
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    let resp;
    try {
      resp = await ProductService.findOrder(payload)
      if (resp.status === 200 && !hasError(resp)) {
        const products = resp.data.grouped.parentProductId;
        // Add stock information to Stock module to show on UI
        const productsInformation = await dispatch('getProductsInformation', { products });
        let items = products.groups.map((group: any) => {
          // Merge current list item and product information
          return {...group, ...productsInformation[group.groupValue]}
        })
        // Handled case for infinite scroll
        if (payload.viewIndex && payload.viewIndex > 0) items = state.list.items.concat(items)
        commit(types.PRODUCT_LIST_UPDATED, { items, total:  products.ngroups });
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
      items: [],
      total: 0
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
      this.dispatch('stock/addProducts', { productIds })
      return this.dispatch('product/fetchProducts', { productIds })
    }
  },

  async loadCurrent ({ rootState, dispatch, commit} , { productId }) {
    // If there is not current product store setup query should not be allowed
    // TODO  
    // Need a permanent fix through login action
    // Will be done as per the GitHub app changes once done
    if (!rootState.user.currentEComStore?.productStoreId) {
      return;
    }
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
        const productsInformation = await dispatch('getProductsInformation', { products });
        current.list.items = current.list.items.map((item: any) => {
          // Merge current list item and product information
          return {...item, ...productsInformation[item.groupValue]}
        })
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
    return state.current;
  },

  /**
   * Fetch catalog products
   */
  async findCatalogProducts({ commit, state }, payload) {
    let resp, items = []
    try {
      resp = await ProductService.getCatalogProducts(payload)

      if (!hasError(resp)) {
        items = resp.data.response.docs
        if (payload.json.params.start > 0) items = state.catalogProducts.items.concat(items);
      } else {
        throw resp.data;
      }
    } catch (error) {
      console.error(error)
      showToast(translate("Something went wrong"));
    } finally {
      commit(types.PRODUCT_CATALOG_UPDATED, { items, total: resp.data.response?.numFound ? resp.data.response.numFound : 0 });
    }
  },

  /**
   * Setting current catalog product in state
  */
  async setCurrentCatalogProduct({ commit, state }, payload) {
    // checking if product is in cache
    let product = state.cached[payload.productId] ? JSON.parse(JSON.stringify(state.cached[payload.productId])) : {}
    const isProductCached = Object.keys(product).length
    if (isProductCached && product.variants?.length) {
      commit(types.PRODUCT_CURRENT_CTLGPRDCT_UPDATED, product)
      return product
    }

    emitter.emit("presentLoader")

    let resp;
    let productFilterCondition: any = `docType: PRODUCT AND groupId: ${payload.productId}`;
    if (!isProductCached) productFilterCondition = `docType: PRODUCT AND (productId: ${payload.productId} OR groupId: ${payload.productId})`

    try {
      const params = {
        "json": {
          "params": {
            "rows": 50,
          } as any,
          "filter": productFilterCondition,
          "query": "*:*"
        }
      }

      resp = await ProductService.getCatalogProducts(params)
      if (!hasError(resp) && resp.data.response.numFound) {
        let variants = resp.data.response
        if (!isProductCached) {
          product = resp.data.response.docs.find((product: any) => product.productId === payload.productId)
          variants = resp.data.response.docs.filter((product: any) => product.productId !== payload.productId)
        }
        product.variants = variants
        commit(types.PRODUCT_CURRENT_CTLGPRDCT_UPDATED, product)
        commit(types.PRODUCT_ADD_TO_CACHED_MULTIPLE, { products: [product, ...product.variants] })
      } else {
        showToast(translate("Product not found"));
      }
    } catch(error){
      console.error(error)
      showToast(translate("Something went wrong"));
    }
    emitter.emit("dismissLoader");
    return product
  },
  /**
  * Reset Catalog Products
  */
  resetCatalogProducts ( { commit }) {
   commit(types.PRODUCT_CATALOG_UPDATED, {
     items: [],
     total: 0
   });
 },
   /**
   * Fetch catalog products
   */
   async getPreOrderBackorderCategory({ commit, state }, payload) {
    const productStoreCategory = JSON.parse(JSON.stringify(state.productStoreCategory));
    let productStoreCategories = state.productStoreCategory[payload.productStoreId];

    if (productStoreCategories) {
      return productStoreCategories;
    }

    let resp;
    try {
      productStoreCategories = {};
      let productStoreCatalogId;
      resp = await ProductService.getProductStoreCatalog({
        "inputFields": {
          "productStoreId": payload.productStoreId,
        },
        "fieldList": ["productStoreId", "prodCatalogId"],
        "entityName": "ProductStoreCatalog",
        "distinct": "Y",
        "noConditionFind": "Y",
        "filterByDate": "Y",
        "viewSize": 1,
      })

      if (!hasError(resp)) {
        productStoreCatalogId = resp.data.docs[0].prodCatalogId
      } else {
        throw resp.data;
      }

      resp = await ProductService.getCatalogCategories({
        "inputFields": {
          "productStoreId": payload.productStoreId,
          "prodCatalogCategoryTypeId": ["PCCT_PREORDR", "PCCT_BACKORDER"],
          "prodCatalogCategoryTypeId_op": "in"
        },
        "fieldList": ["productCategoryId", "prodCatalogCategoryTypeId"],
        "entityName": "ProdCatalogCategory",
        "distinct": "Y",
        "noConditionFind": "Y",
        "filterByDate": "Y",
        "viewSize": 10, // view size should be 2, considered if there are duplicate records it should not affect
      })
      if (!hasError(resp)) {
        resp.data.docs.reduce((productStoreCategories: any, category: any) => {
          productStoreCategories[category.prodCatalogCategoryTypeId] = category.productCategoryId;
          return productStoreCategories;
        }, productStoreCategories);
      } else {
        throw resp.data;
      }
      productStoreCategory[payload.productStoreId] = productStoreCategories;
      commit(types.PRODUCT_STR_CAT_UPDATED, productStoreCategory)
    } catch (error) {
      console.error(error)
      return Promise.reject(error);
    }
    return productStoreCategories;
  },
}
export default actions;