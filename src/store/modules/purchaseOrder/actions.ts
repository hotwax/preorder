import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import PurchaseOrderState from './PurchaseOrder'
import * as types from './mutation-types'
import { PurchaseOrderService } from '@/services/PurchaseOrderService'
import store from '@/store'

const actions: ActionTree<PurchaseOrderState, RootState> = {
  async fetchFutureInventory({ commit }, params) {
    const productIds: Array<string> = [];
    const facilityIds: Array<string> = [];
    const orders: any[] = [];

    try {
      const resp = await PurchaseOrderService.fetchFutureInventory(params);
      if(resp.data?.futureInventoryItems?.length) {
        resp.data.futureInventoryItems.reduce((ords: any, order: any) => {
          if(!ords[order.externalId]) {
            ords[order.externalId] = {
              externalId: order.externalId,
              facilityId: order.facilityId,
              promiseDate: order.promiseDate,
              productStoreId: order.productStoreId,
              createdStamp: order.createdStamp,
              lastUpdatedStamp: order.lastUpdatedStamp,
              shipments: [],
              items: []
            }
            orders.push(ords[order.externalId])
          }
          if(order.shipmentExternalId) {
            ords[order.externalId]["shipments"].push(order)
          } else {
            ords[order.externalId]["items"].push(order)
          }

          productIds.push(order.productId)
          if(order.facilityId) facilityIds.push(order.facilityId)
          return ords
        }, {})

        store.dispatch("product/fetchMaargProducts", { productIds })
        store.dispatch("util/fetchFacilityDetails", [...new Set(facilityIds)])
      }
    } catch(err) {
      console.error("Failed to fetch future inventory details", err)
    }
    commit(types.PURCHASEORDER_LIST_UPDATED, { orders, total: orders.length })
  },

  async fetchPurchaseOrders({ commit, state }, params) {
    let orders: any[] = params.pageIndex ? JSON.parse(JSON.stringify(state.list.orders)) : [];
    let total = params.pageIndex ? state.list.total : 0;

    try {
      const resp = await PurchaseOrderService.fetchPurchaseOrders(params);
      if(resp.data?.orders?.length) {
        orders = orders.concat(resp.data.orders)
        total = resp.data.totalOrdersCount

        const facilityIds = resp.data.orders.map((order: any) => order.facilityId).filter(Boolean)
        store.dispatch("util/fetchFacilityDetails", [...new Set(facilityIds)])
      }
    } catch(err) {
      console.error("Failed to fetch purchase orders", err)
    }
    commit(types.PURCHASEORDER_LIST_UPDATED, { orders, total })
  },

  async fetchFutureInventoryDetails({ commit }, orderId) {
    let order = {} as any;

    try {
      const resp = await PurchaseOrderService.fetchPurchaseOrder(orderId);
      const { items: orderItems = [], ...orderHeader } = resp.data?.order || {};
      order = { ...orderHeader, shipments: [] }

      let fiiGroup = {} as any;
      if(order.externalId) {
        const fiiResp = await PurchaseOrderService.fetchFutureInventoryDetail(order.externalId);
        fiiGroup = fiiResp.data?.futureInventoryItemGroups?.[0] || {};
      }

      // PO items are the base list, merging the FII item linked to the PO item, matched on poItemSeqId and on productId when poItemSeqId is missing
      const fiiItems = [...(fiiGroup.items || [])];
      const items = orderItems.map((orderItem: any) => {
        const index = fiiItems.findIndex((fii: any) => fii.poItemSeqId ? fii.poItemSeqId === orderItem.orderItemSeqId : fii.productId === orderItem.productId);
        const fiiItem = index > -1 ? fiiItems.splice(index, 1)[0] : {};
        return { ...orderItem, itemStatusId: orderItem.statusId, ...fiiItem };
      });

      // Keeping the FII items not linked to any PO item, so that no record is missed
      order = { ...order, ...fiiGroup, items: [...items, ...fiiItems] }

      const productIds = order.items.map((item: any) => item.productId).filter(Boolean)
      if(productIds.length) store.dispatch("product/fetchMaargProducts", { productIds: [...new Set(productIds)] })
    } catch(err) {
      console.error("Failed to fetch purchase order details", err)
    }
    commit(types.PURCHASEORDER_CURRENT_UPDATED, order)
  }
}

export default actions;