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

const getProductInventory = async (query: any): Promise<any> => {
  return api({
    url: "getProductInventory",
    method: "get",
    data: query
  });
}

const getProductInventoryAvailable = async (query: any): Promise<any> => {
  return api({
    url: "service/getProductInventoryAvailable",
    method: "post", // not supporting get
    data: query
  });
}

export const ProductService = {
  fetchProducts,
  findOrder,
  fetchCurrentList,
  getCatalogProducts,
  getProductInventory,
  getProductInventoryAvailable
}