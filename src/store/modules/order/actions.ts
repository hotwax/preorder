import { OrderService } from '@/services/OrderService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import OrderState from './OrderState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'
import { DateTime } from 'luxon';
import emitter from '@/event-bus'

const actions: ActionTree<OrderState, RootState> = {

  /**
   * Update query
   */
  updateQuery  ( { commit, dispatch, rootState } , { query }) {
    commit(types.ORDER_QUERY_UPDATED, { query } );
    const userProfile = this.getters['user/getUserProfile'];
    const payload = {
      viewSize: query.viewSize,
      viewIndex: query.viewIndex,
      queryString: query.queryString,
      queryFields: 'parentProductId productId parentProductName productName goodIdentifications orderId search_orderIdentifications customerPartyName',
      groupByField: 'orderId',
      groupLimit: 10000,
      filters: JSON.parse(process.env.VUE_APP_ORDER_FILTERS)
    }
    if (query.orderedBefore || query.orderedAfter) {
      const orderedBefore = query.orderedBefore ? DateTime.fromFormat(query.orderedBefore, "yyyy-MM-dd").setZone(userProfile.userTimeZone).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'") : DateTime.now().setZone(userProfile.userTimeZone).endOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
      const orderedAfter = query.orderedAfter ? DateTime.fromFormat(query.orderedAfter, "yyyy-MM-dd").setZone(userProfile.userTimeZone).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'") : DateTime.fromFormat("0001-01-01", "yyyy-MM-dd").setZone(userProfile.userTimeZone).startOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
      const dateQuery: any = 'orderDate: [' + orderedAfter + ' TO ' + orderedBefore + ']';
      payload.filters.push(dateQuery);
    }

    if (query.promisedBefore || query.promisedAfter) {
      const promisedBefore = query.promisedBefore ? DateTime.fromFormat(query.promisedBefore, "yyyy-MM-dd").setZone(userProfile.userTimeZone).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'") : DateTime.now().setZone(userProfile.userTimeZone).endOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
      const promisedAfter = query.promisedAfter ? DateTime.fromFormat(query.promisedAfter, "yyyy-MM-dd").setZone(userProfile.userTimeZone).toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'") : DateTime.fromFormat("0001-01-01", "yyyy-MM-dd").setZone(userProfile.userTimeZone).startOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
      const promisedDateQuery: any = 'promisedDatetime: [' + promisedAfter + ' TO ' + promisedBefore + ']';
      payload.filters.push(promisedDateQuery);
    }
    if (query.cusotmerLoyalty) {
      payload.filters.push('orderNotes: ' +query.cusotmerLoyalty);
    }
    if (!query.hasPromisedDate) {
      payload.filters.push("-promisedDatetime: *");
    }
    if (rootState.user.currentEComStore) {
      payload.filters.push('productStoreId: ' + rootState.user.currentEComStore.productStoreId);
    }
    return dispatch("findOrder", payload).finally(() => {
      query.hasUpdated = true;
      commit(types.ORDER_QUERY_UPDATED, { query } );
    })
  },

  /**
   * Find Order
   */
  async findOrder ( { rootState, commit, state, dispatch }, payload) {
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
      resp = await OrderService.findOrder(payload)
      if (resp && resp.status === 200 && !hasError(resp)) {
        const orders = resp.data.grouped.orderId;
        // Add stock information to Stock module to show on UI
        dispatch('getProductInformation', { orders });
        // Handled case for infinite scroll
        if (payload.viewIndex && payload.viewIndex > 0) orders.groups = state.list.items.concat(orders.groups)
        commit(types.ORDER_LIST_UPDATED, {
          items: orders.groups,
          total: orders.ngroups,
          preorderCount: orders.matches
        });
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
   * Reset Order Query
   */
  resetOrderQuery ( { commit }) {
    commit(types.ORDER_QUERY_UPDATED, {
      query: {
        hasUpdated: false,
        queryString: '',
        orderedAfter: '',
        orderedBefore: '',
        promisedAfter: '',
        promisedBefore: '',
        cusotmerLoyalty: '',
        hasPromisedDate: true,
        viewIndex: 0,
        viewSize: process.env.VUE_APP_VIEW_SIZE ? process.env.VUE_APP_VIEW_SIZE : 10 // To make sure the code doesn't breaks when there is not configuration set
      }
    });
    commit(types.ORDER_LIST_UPDATED, {
      items: [],
      total: 0,
      preorderCount: 0
    });
    commit(types.ORDER_SELECTED_ITEMS_UPDATED, { selectedItems: [] } );
  },

  /**
   * Release items
   */
  async releaseItems({ commit }, payload) {
    const resp = await OrderService.releaseItems(payload)
    if (resp.status === 200 && !hasError(resp)) {
      // Storing current time stamp to fetch jobs for polling till 10 mins
      commit(types.ORDER_LST_ACTN_TIMESTAMP_UPDATED, { lastActionTimestamp: DateTime.now().toMillis()})
      this.dispatch("job/initiatePollingJobs");
      showToast(translate("Items queued for release successfully"));
      // TODO Clear axios cache 
    } else {
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Release item
   */
    async releaseItem ( context, payload) {
    const resp = await OrderService.releaseItem(payload)
    if (resp.status === 200 && !hasError(resp)) {
      showToast(translate("Item released successfully"));
      // TODO Clear axios cache 
    } else {
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  },


  /**
   * Cancel items
   */
   async cancelItems ( context, payload) {
    const resp = await OrderService.cancelItems(payload)
    if (resp.status === 200 && !hasError(resp)) {
      this.dispatch("job/initiatePollingJobs");
      showToast(translate("Items queued for cancel successfully"));
      // TODO Clear axios cache 
    } else {
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Cancel item
   */
     async cancelItem ( context, payload) {
      const resp = await OrderService.cancelItem(payload)
      if (resp.status === 200 && !hasError(resp)) {
        showToast(translate("Item cancelled successfully"));
        // TODO Clear axios cache 
      } else {
        showToast(translate("Something went wrong"));
      }
      // TODO Handle specific error
      return resp;
    },




  /**
   * Update Promise Date items
   */
   async updatePromiseDateItems ( context, payload) {
    const resp = await OrderService.updatePromiseDateItems(payload)
    if (resp.status === 200 && !hasError(resp)) {
      this.dispatch("job/initiatePollingJobs");
      showToast(translate("Items queued to update promise date successfully"));
      // TODO Clear axios cache 
    } else {
      showToast(translate("Something went wrong"));
    }
    // TODO Handle specific error
    return resp;
  },

  /**
   * Update Promise Date item
   */
     async updatePromiseDateItem ( { commit, state }, payload) {
      const resp = await OrderService.updatePromiseDateItem(payload)
      if (resp.status === 200 && !hasError(resp)) {
        // As we get the success response update the local value
        const order = state.list.items.find(order => order.groupValue === payload.orderId );
        if (order) {
          const item = order.doclist.docs.find((orderItem: any) => orderItem.orderItemSeqId === payload.orderItemSeqId);
          // TODO Check if we can use the value from the response
          item.promisedDatetime = DateTime.fromFormat(payload.promisedDatetime, "yyyy-MM-dd hh:mm:ss.SSS").toFormat("YYYY-MM-DD'T'hh:mm:ss'Z'");
        }
        commit(types.ORDER_LIST_UPDATED, state.list );
        showToast(translate("Item promise date updated successfully"));
      } else {
        showToast(translate("Something went wrong"));
      }
      // TODO Handle specific error
      return resp;
    },

  /**
   * Add Stocks information to stock state
   */
  async getProductInformation  ( context , { orders }) {
    // To remove redundant value Set is used
    let productIds: any = new Set();
    orders.groups.forEach((order: any) => {
      order.doclist.docs.forEach((item: any) => {
        // Getting item.internalName null for some item
        if (item.productId) productIds.add(item.productId);
        // this.dispatch('stock/addProduct', { sku: item.internalName});
      });
    });
    // Converted to list as methods like reduce not supported
    productIds = [...productIds]
    if (productIds.length) {
      this.dispatch('product/fetchProducts', { productIds })
      this.dispatch('stock/addProducts', { productIds })
    }
  },

  /**
   * Remove item from list
   */
  async removeItem  ( { commit, state } , { item }) {
    const order = state.list.items.find(order => order.groupValue === item.orderId );
    order.doclist.docs = order.doclist.docs.filter((orderItem: any) => orderItem.orderItemSeqId !== item.orderItemSeqId);
    if (order.doclist.docs.length === 0) {
      state.list.items = state.list.items.filter(order => order.groupValue !== item.orderId );
    }
    commit(types.ORDER_LIST_UPDATED, state.list );
  },

  /**
   * Remove items from list
   */
  async removeItems  ( { commit, state } , { items }) {
    items.forEach((item: any) => {
      const order = state.list.items.find(order => order.groupValue === item.orderId );
      if (order) {
        order.doclist.docs = order.doclist.docs.filter((orderItem: any) => orderItem.orderItemSeqId !== item.orderItemSeqId);
        if (order.doclist.docs.length === 0) {
          state.list.items = state.list.items.filter(order => order.groupValue !== item.orderId );
        }
      }
    });
    commit(types.ORDER_LIST_UPDATED, state.list );
  },

  /**
   * Add items to selected items
   */
  addToSelectedItems  ( { commit, state } , { item }) {
    state.selectedItems.push(item);
    commit(types.ORDER_SELECTED_ITEMS_UPDATED, { selectedItems: state.selectedItems } );
  },

  /**
   * Remove items from list
   */
   removeFromSelectedItems  ( { commit, state } , { index }) {
    state.selectedItems.splice(index, 1);
    commit(types.ORDER_SELECTED_ITEMS_UPDATED, { selectedItems: state.selectedItems } );
  },

    /**
   * Remove items from selected items
   */
     removeAllSelectedItems  ( { commit, state } ) {
      state.selectedItems.forEach((item: any) => {
        item.isChecked = false;
    })
      commit(types.ORDER_SELECTED_ITEMS_UPDATED, { selectedItems: [] } );
    },

  /**
 * Fetch brokering count based upon product
 */
  async fetchBrokeringCountByProducts({ state, commit, rootState }, { productIds }) {
    const brokeringCountByProduct = JSON.parse(JSON.stringify(state.brokeringCountByProduct));
    // If product Ids are not provided, return
    if (!productIds || productIds.length === 0) {
      console.warn('Empty productId list, skipped fetching brokering orders')
      return brokeringCountByProduct;
    }

    const payload = {
      viewSize: productIds.length,
      groupByField: 'productId',
      groupLimit: 0,
      filters: ["productId: " + productIds.join(" OR "), ...JSON.parse(process.env.VUE_APP_ORDER_IN_BRKRNG_FILTERS)] as any
    }
    if (rootState.user.selectedBrand) {
      payload.filters.push('productStoreId: ' + rootState.user.selectedBrand);
    }

    try {
      const resp = await OrderService.fetchBrokeringCountByProducts(payload)
      if (resp && resp.status === 200 && !hasError(resp)) {
        // Initially reseting the count and as API doesn't returns any results when no orders in brokering
        // Also, if orders for some of the products are cleared, response will not have any such information
        productIds.reduce((brokeringCountByProduct: any, productId: any) => {
          brokeringCountByProduct[productId] = 0;
          return brokeringCountByProduct;
        }, brokeringCountByProduct)

        // If there are no records in response, reset the count
        if (resp.data.grouped.productId.matches === 0) {
          commit(types.ORDER_BRKRNG_CNT_BY_PRDCT_UPDATED, brokeringCountByProduct)
          return brokeringCountByProduct;
        }
        resp.data.grouped.productId.groups.reduce((brokeringCountByProduct: any, group: any) => {
          brokeringCountByProduct[group.groupValue] = group.doclist.numFound
          return brokeringCountByProduct;
        }, brokeringCountByProduct)
        commit(types.ORDER_BRKRNG_CNT_BY_PRDCT_UPDATED, brokeringCountByProduct)
      }
    } catch (err) {
      console.error('Something went wrong while fetching brokering count for products: ', err)
    }
    return brokeringCountByProduct;
  }
}
export default actions;