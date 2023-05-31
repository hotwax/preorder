import { api } from '@/adapter';

const getShopifyShopConfig = async (query: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: "get",
    params: query
  });
}

const getShopifyConfigDetails = async (payload: any): Promise<any> => {
  return api({
    url: "solr-query",
    method: "POST",
    data: payload
  })
}


export const ShopifyService = {
  getShopifyShopConfig,
  getShopifyConfigDetails
}