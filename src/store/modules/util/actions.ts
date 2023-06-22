import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { hasError } from '@/utils'

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
    }
}

export default actions;