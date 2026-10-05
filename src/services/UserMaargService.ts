import { api, apiClient, client } from '@/adapter';
import store from '@/store';
import { hasError } from '@/utils';

const fetchLoginOptions = async () => {
  const baseURL = store.getters['user/getMaargBaseUrl'];

  let isMoquiOms = false;
  try {
    let resp: any;

    try {
      // Try the entered OMS as an OFBiz instance first (default when VITE_OMS_TYPE is unset).
      resp = await api({
        url: "checkLoginOptions",
        method: "GET"
      });
      if(hasError(resp)) throw new Error(resp.data._ERROR_MESSAGE_);
    } catch (ofbizError) {
      //If OFBiz checkLoginOptions faild considering that this is the Moqui only setup and making call to moqui checkLoginOptions
      resp = await apiClient({
        url: "admin/checkLoginOptions",
        method: "GET",
        baseURL
      });
      isMoquiOms = true;
    }
  } catch (error) {
    console.error(error)
  }
  return isMoquiOms;
};

const getEComStores = async (token: any): Promise<any> => {
  const baseURL = store.getters['user/getMaargBaseUrl'];
  try {
    const resp = await client({
      url: "admin/productStores",
      method: "get",
      baseURL,
      params: {
        pageSize: 500
      },
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    if (hasError(resp)) {
      return Promise.reject(resp.data);
    } else {
      return Promise.resolve(resp.data);
    }
  } catch(error: any) {
    return Promise.reject(error)
  }
}

const setProductStorePreference = async (payload: any) => {
  const token = store.getters['user/getUserToken'];
  const baseURL = store.getters['user/getMaargBaseUrl'];

  try {
    await apiClient({
      url: "admin/user/preferences",
      method: "PUT",
      data: {
        userId: payload.userId,
        preferenceKey: 'SELECTED_BRAND',
        preferenceValue: payload.productStoreId,
      },
      baseURL,
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('error', error)
  }
  return;
}

const getPreferredStore = async (userId: string, token: string) => {
  const baseURL = store.getters['user/getMaargBaseUrl'];
  try {
    const preferredStoreResp = await apiClient({
      url: "admin/user/preferences",
      method: "GET",
      params: {
        pageSize: 1,
        userId,
        preferenceKey: "SELECTED_BRAND"
      },
      baseURL,
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }) as any;
    return preferredStoreResp.data?.[0]?.preferenceValue || ""
  } catch (err) {
    console.error('Favourite product store not found', err)
    return {}
  }
}

const getUserPermissions = async (params: any, token: any): Promise<any> => {
  const baseURL = store.getters['user/getMaargBaseUrl'];
  try {
    const resp = await apiClient({
      url: "admin/user/permissions",
      method: "get",
      params: {
        permissionIds: params.permissionIds,
        permissionId_op: "in",
        pageSize: params.permissionIds.length
      },
      baseURL,
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }) as any

    return resp.data.docs.map((permission: any) => permission.permissionId)
  } catch(err) {
    return Promise.reject(err)
  }
}

const getUserProfile = async (token: any): Promise<any> => {
  const baseURL = store.getters['user/getMaargBaseUrl'];
  try {
    const resp = await apiClient({
      url: "admin/user/profile",
      method: "get",
      baseURL,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    if (hasError(resp)) return Promise.reject("Error getting user profile: " + JSON.stringify(resp.data));
    return Promise.resolve(resp.data)
  } catch (error: any) {
    return Promise.reject(error)
  }
}

const fetchProductStoreFacilities = async (productStoreId: string): Promise<any> => {
  const baseURL = store.getters['user/getMaargBaseUrl'];
  const token = store.getters['user/getUserToken'];

  let productStoreFacilities = [];

  try {
    const resp = await apiClient({
      url: `oms/productStores/${productStoreId}/facilities`,
      method: "get",
      baseURL,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    productStoreFacilities = resp.data
  } catch (error: any) {
    productStoreFacilities = []
  }
  return productStoreFacilities;
}

export const UserMaargService = {
  fetchLoginOptions,
  fetchProductStoreFacilities,
  getEComStores,
  getPreferredStore,
  getUserProfile,
  getUserPermissions,
  setProductStorePreference
}