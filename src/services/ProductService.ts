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

export const ProductService = {
  fetchProducts,
  findOrder,
  fetchCurrentList,
  getCatalogProducts
}