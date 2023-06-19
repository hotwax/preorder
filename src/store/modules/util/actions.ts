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
    async getReserveInvConfig({ commit, state }) {
      if ((state.config as any)['reserveInv'] && Object.keys((state.config as any)['reserveInv']).length) return

      const resp = await UtilService.getReserveInvConfig({
        "fieldList": ["productStoreId", "reserveInventory"],
        "entityName": "ProductStore",
        "viewSize": 20,
        "noConditionFind": 'Y',
      })
      let reserveInvConfigs = {}, inventoryConfig = {}
      if (!hasError(resp)) {
        reserveInvConfigs = resp.data.docs.reduce((configs: any, config: any) => {
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
    async getPreOrdPhyInvHoldConfig({ commit, state }) {
      if ((state.config as any)['preOrdPhyInvHold'] && Object.keys((state.config as any)['preOrdPhyInvHold']).length) return

      const resp = await UtilService.getPreOrdPhyInvHoldConfig({
        "inputFields": {
          "settingTypeEnumId": "HOLD_PRORD_PHYCL_INV"
        },
        "fieldList": ["settingTypeEnumId", "settingValue", "fromDate", "productStoreId"],
        "entityName": "ProductStoreSetting",
        "viewSize": 20
      })
      let preOrdPhyInvHoldConfig = {}, inventoryConfig = {}
      if (!hasError(resp)) {
        preOrdPhyInvHoldConfig = resp.data.docs.reduce((configs: any, config: any) => {
          configs[config.productStoreId] = config
          return configs
        }, {})
      }

      inventoryConfig = {...state.config, 'preOrdPhyInvHold': preOrdPhyInvHoldConfig }
      commit(types.UTIL_STORE_INV_CONFIG_UPDATED, inventoryConfig)
    },
}

export default actions;