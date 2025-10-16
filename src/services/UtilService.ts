import { api } from '@/adapter';
import store from '@/store';
import { hasError } from '@hotwax/oms-api';

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

const fetchFacilities = async (payload: any): Promise<any> => {
  return await api({
    url: "performFind",
    method: "get",
    params: payload
  })
}

// TODO: remove this util service when the oms-api version is updated to 1.16.0
const fetchGoodIdentificationTypes = async(parentTypeId = "HC_GOOD_ID_TYPE"): Promise<any> => {
  const payload = {
    "inputFields": {
      "parentTypeId": parentTypeId,
    },
    "fieldList": ["goodIdentificationTypeId", "description"],
    "viewSize": 50,
    "entityName": "GoodIdentificationType",
    "noConditionFind": "Y"
  }
  try {
    const resp = await api({
      url: "performFind",
      method: "get",
      params: payload
    }) as any

    if (!hasError(resp)) {
      return Promise.resolve(resp.data.docs)
    } else {
      throw resp.data;
    }
  } catch (err) {
    return Promise.reject({
      code: 'error',
      message: 'Something went wrong',
      serverResponse: err
    })
  }
}

export const UtilService = {
  getServiceStatusDesc,
  getReserveInvConfig,
  getPreOrdPhyInvHoldConfig,
  updateReserveInvConfig,
  updatePreOrdPhyInvHoldConfig,
  createPreOrdPhyInvHoldConfig,
  fetchFacilities,
  fetchGoodIdentificationTypes
}