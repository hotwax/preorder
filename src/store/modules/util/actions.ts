import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import { PurchaseOrderService } from '@/services/PurchaseOrderService'

const actions: ActionTree<UtilState, RootState> = {
  /**
   * Status Description
   */
  async getServiceStatusDesc ({ commit, state }) {
    if (Object.keys(state.statusDesc).length) return

    try{
      const resp = await UtilService.getServiceStatusDesc({
        "inputFields": {
          "statusTypeId": "SERVICE_STATUS",
          "statusTypeId_op": "equals"
        },
        "entityName": "StatusItem",
        "fieldList": ["statusId", "description"],
        "noConditionFind": "Y",
        "viewSize": 20
      }) 
      if (resp.status === 200 && !hasError(resp) && resp.data.count) {
        commit(types.UTIL_SERVICE_STATUS_DESC_UPDATED, resp.data.docs);
      }
    } catch(err) {
      console.error(err)
    }
  },
  /**
    Get reserve inventory config
   */
    async getReserveInvConfig({ commit, state }, payload) {
      const inventoryConfig = (state.config || {}) as any;
      const reserveInvConfigs = inventoryConfig.reserveInv || {};
      if (reserveInvConfigs[payload.productStoreId] && !payload.forceUpdate) {
        return reserveInvConfigs[payload.productStoreId];
      }

      try {
        // TODO Get this configuration on login with ProductStore
        const resp = await UtilService.getReserveInvConfig({
          "inputFields": {
            "productStoreId": payload.productStoreId,
          },
          "fieldList": ["productStoreId", "reserveInventory"],
          "entityName": "ProductStore",
          "viewSize": 1,
          "noConditionFind": 'Y',
        })
        if (!hasError(resp)) {
          const config = resp.data.docs[0];
          // if empty, consider it 'Y'
          if (!config.reserveInventory) config.reserveInventory = 'Y'
          reserveInvConfigs[payload.productStoreId] = config;
        } else {
          throw resp.data
        }
      } catch(err) {
        console.error(err)
        return Promise.reject(err);
      }
      inventoryConfig.reserveInv = reserveInvConfigs;
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, inventoryConfig)
      return reserveInvConfigs[payload.productStoreId];
    },

  /**
    Get preorder physical inventory hold config
   */
    async getPreOrdPhyInvHoldConfig({ commit, state }, payload) {
      const inventoryConfig = (state.config || {}) as any;
      const preOrdPhyInvHoldConfig = inventoryConfig.preOrdPhyInvHold || {};
      if (preOrdPhyInvHoldConfig[payload.productStoreId] && !payload.forceUpdate) {
        return preOrdPhyInvHoldConfig[payload.productStoreId];
      }

      try {
        // pid, settingenumid, fromdate, settingbvalue
        const resp = await UtilService.getPreOrdPhyInvHoldConfig({
          "inputFields": {
            "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV",
            "productStoreId": payload.productStoreId
          },
          "fieldList": ["settingTypeEnumId", "settingValue", "fromDate", "productStoreId"],
          "entityName": "ProductStoreSetting",
          "viewSize": 1
        })
        if (!hasError(resp)) {
          preOrdPhyInvHoldConfig[payload.productStoreId] = resp.data.docs[0];
        } else if (resp.data.error === 'No record found') {
          // setting the config value as 'true' by default in case no record is found
          // Will create as new record while updation if not found again
          preOrdPhyInvHoldConfig[payload.productStoreId] = {
            "settingValue": 'true',
            "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV",
            "productStoreId": payload.productStoreId
          }
        }
      } catch(err) {
        console.error(err)
        return Promise.reject(err);
      }
      inventoryConfig.preOrdPhyInvHold = preOrdPhyInvHoldConfig;
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, inventoryConfig)
      return preOrdPhyInvHoldConfig[payload.productStoreId];
    },
  /**
    clear inventory config state
   */
    async clearInvConfigs({ commit }) {
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, {})
    },

    async clearFacilities({ commit }) {
      commit(types.UTIL_FACILITIES_UPDATED, {})
    },

  async getEnumDetails({ commit, state }) {
    if (Object.keys(state.enums).length) return

    try{
      const resp = await UtilService.fetchEnums({
        enumTypeId: "FUTURE_INV_ITEM_TYPE,FUTURE_INV_DETAIL_REASON",
        enumTypeId_op: "in",
        pageSize: 500
      }) 
      if(resp.data.length) {
        commit(types.UTIL_ENUMS_UPDATED, resp.data.reduce((enums: any, e: any) => {
          enums[e.enumId] = e
          return enums;
        }, {}));
      }
    } catch(err) {
      console.error(err)
    }
  },

  async fetchFacilityDetails({ commit }, facilityIds) {
    try{
      const resp = await UtilService.fetchMaargFacilities({
        facilityId: facilityIds.join(","),
        facilityId_op: "in",
        pageSize: 500
      }) 
      if(resp.data.length) {
        commit(types.UTIL_FACILITIES_UPDATED, resp.data.reduce((facilities: any, facility: any) => {
          facilities[facility.facilityId] = facility
          return facilities;
        }, {}));
      }
    } catch(err) {
      console.error(err)
    }
  },

  async fetchStatuses({ commit }) {
    try{
      const resp = await UtilService.fetchStatusInfo() 
      if(resp.data.length) {
        commit(types.UTIL_SERVICE_STATUS_DESC_UPDATED, resp.data);
      }
    } catch(err) {
      console.error(err)
    }
  },
}

export default actions;