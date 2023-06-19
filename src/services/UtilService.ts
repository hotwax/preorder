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
    productStoreId
  }

  return await api({
    url: "service/updateProductStoreSetting",
    method: "post",
    data: params
  })
}

const updateReserveInvConfig = async (payload: any): Promise<any> => {
  const productStoreId = store.state.user.currentEComStore.productStoreId
  const params = {
    "reserveInventory": payload.value ? "Y" : "N",
    productStoreId
  }

  return await api({
    url: "service/updateProductStore",
    method: "post",
    data: params
  })
}


export const UtilService = {
  getServiceStatusDesc,
  getReserveInvConfig,
  getPreOrdPhyInvHoldConfig,
  updateReserveInvConfig,
  updatePreOrdPhyInvHoldConfig
}