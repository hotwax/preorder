import { api } from '@/adapter';

const fetchProducts = async (query: any): Promise<any> => {
  return api({
    url: "searchProducts",
    method: "post",
    data: query,
    cache: true
  });
}
const findOrder = async (query: any): Promise<any> => {
  return api({
    url: "searchOrders",
    method: "post",
    data: query
  });
}
const fetchCurrentList = async (query: any): Promise<any> => {
  return api({
    url: "searchOrders",
    method: "post",
    data: query
  });
}

const getCatalogProducts = async (payload: any): Promise<any> => {
  return api({
    url: "/solr-query",
    method: "POST",
    data: payload
  })
}

const getProductCategories = async (query: any): Promise <any> => {
  return api({
    url: 'performFind',
    method: "get",
    params: query
  });
}

const getProductStoreCatalog = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: payload,
    cache: true
  });
}

const getCatalogCategories = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: payload,
    cache: true
  });
}

export const ProductService = {
  fetchProducts,
  findOrder,
  fetchCurrentList,
  getCatalogCategories,
  getCatalogProducts,
  getProductCategories,
  getProductStoreCatalog
}