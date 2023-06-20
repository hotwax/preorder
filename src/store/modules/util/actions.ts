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
    async getReserveInvConfig({ commit, state }, productStoreId) {
      if (((state.config as any)['reserveInv'] && Object.keys((state.config as any)['reserveInv']).length)
       || (this.state.user.currentEComStore.productStoreId != productStoreId)) {
        return
       }

      const resp = await UtilService.getReserveInvConfig({
        "inputFields": {
          "productStoreId": productStoreId,
        },
        "fieldList": ["productStoreId", "reserveInventory"],
        "entityName": "ProductStore",
        "viewSize": 1,
        "noConditionFind": 'Y',
      })
      let reserveInvConfigs = {}, inventoryConfig = {}
      if (!hasError(resp)) {
        reserveInvConfigs = resp.data.docs.reduce((configs: any, config: any) => {
          // if empty, consider it 'Y'
          if (!config.reserveInventory) config.reserveInventory = 'Y'
          configs[config.productStoreId] = config
          return configs
        }, {})
      }

      inventoryConfig = { ...state.config, 'reserveInv': reserveInvConfigs }
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, inventoryConfig)
    },

  /**
    Get preorder physical inventory hold config
   */
    async getPreOrdPhyInvHoldConfig({ commit, state }, productStoreId) {
      if (((state.config as any)['preOrdPhyInvHold'] && Object.keys((state.config as any)['preOrdPhyInvHold']).length)
      || (this.state.user.currentEComStore.productStoreId != productStoreId)) {
        return
      }

      // pid, settingenumid, fromdate, settingbvalue
      const resp = await UtilService.getPreOrdPhyInvHoldConfig({
        "inputFields": {
          "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV",
          "productStoreId": productStoreId
        },
        "fieldList": ["settingTypeEnumId", "settingValue", "fromDate", "productStoreId"],
        "entityName": "ProductStoreSetting",
        "viewSize": 1
      })
      let preOrdPhyInvHoldConfig = {} as any, inventoryConfig = {}
      if (!hasError(resp)) {
        preOrdPhyInvHoldConfig = resp.data.docs.reduce((configs: any, config: any) => {
          configs[config.productStoreId] = config
          return configs
        }, {})
      } else if (resp.data.error === 'No record found') {
        // setting the config value as 'true' by default in case no record is found
        // Will create as new record while updation if not found again
        preOrdPhyInvHoldConfig[productStoreId] = {
          "settingValue": 'true',
          "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV",
          "productStoreId": productStoreId
        }
      }
      inventoryConfig = {...state.config, 'preOrdPhyInvHold': preOrdPhyInvHoldConfig }
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, inventoryConfig)
    },
  /**
    clear inventory config state
   */
    async clearInvConfigs({ commit }) {
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, {})
    }
}

export default actions;