import { api } from '@/adapter';
import store from '@/store';

const getServiceStatusDesc = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: payload,
    cache: true
  });
}

const getReserveInvConfig = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: payload
  });
}

const getPreOrdPhyInvHoldConfig = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: payload
  });
}

const updatePreOrdPhyInvHoldConfig = async (payload: any): Promise<any> => {
  const productStoreId = store.state.user.currentEComStore.productStoreId
  const params = {
    "fromDate": payload.config.fromDate,
    "settingTypeEnumId": 'HOLD_PRORD_PHYCL_INV',
    "settingValue": payload.value,
    "productStoreId": store.state.user.currentEComStore.productStoreId
  }

  return await api({
    url: "service/updateProductStoreSetting",
    method: "post",
    data: params
  })
}

const updateReserveInvConfig = async (payload: any): Promise<any> => {
  const params = {
    "reserveInventory": payload.value ? "Y" : "N",
    "productStoreId": store.state.user.currentEComStore.productStoreId
  }

  return await api({
    url: "service/updateProductStore",
    method: "post",
    data: params
  })
}

const createPreOrdPhyInvHoldConfig = async (): Promise<any> => {
  const params = {
    "fromDate": Date.now(),
    "settingTypeEnumId": 'HOLD_PRORD_PHYCL_INV',
    "settingValue": 'true',
    "productStoreId": store.state.user.currentEComStore.productStoreId
  }

  return await api({
    url: "service/createProductStoreSetting",
    method: "post",
    data: params
  })
}


export const UtilService = {
  getServiceStatusDesc,
  getReserveInvConfig,
  getPreOrdPhyInvHoldConfig,
  updateReserveInvConfig,
  updatePreOrdPhyInvHoldConfig,
  createPreOrdPhyInvHoldConfig
}