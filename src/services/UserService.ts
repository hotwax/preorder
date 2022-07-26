import api, { client } from '../api'
import store from '@/store'

const login = async (username: string, password: string): Promise <any> => {
  return api({
    url: "login", 
    method: "post",
    data: {
      'USERNAME': username, 
      'PASSWORD': password
    }
  });
}

const getProfile = async (): Promise <any>  => {
    return api({
      url: "user-profile", 
      method: "get",
    });
}
const getAvailableTimeZones = async (): Promise <any>  => {
  return api({
    url: "getAvailableTimeZones",
    method: "get",
    cache: true
  });
}
const setUserTimeZone = async (payload: any): Promise <any>  => {
  return api({
    url: "setUserTimeZone",
    method: "post",
    data: payload
  });
}
const updatePassword = async (payload: any): Promise <any>  => {
  return client({
    url: "updatePassword",
    method: "post",
    baseURL: process.env.VUE_APP_BASE_URL ? process.env.VUE_APP_BASE_URL : store.getters['user/getInstanceUrl'],
    ...payload
  });
}

export const UserService = {
    login,
    getAvailableTimeZones,
    getProfile,
    setUserTimeZone,
    updatePassword
}