import { api } from '@/adapter';

const findOrder = async (payload: any): Promise<any> => {
  return api({
    url: "searchOrders",
    method: "post",
    data: payload
  });
}

const fetchBrokeringCountByProducts = async (payload: any): Promise<any> => {
  return api({
    url: "searchOrders",
    method: "post",
    data: payload
  });
}

const releaseItems = async (payload: any): Promise<any> => {
  return api({
    url: "uploadJsonFile",
    method: "post",
    data: payload.data,
    headers: payload.headers
  });
}

const cancelItems = async (payload: any): Promise<any> => {
  return api({
    url: "uploadJsonFile",
    method: "post",
    data: payload.data,
    headers: payload.headers
  });
}

const updatePromiseDateItems = async (payload: any): Promise<any> => {
  return api({
    url: "uploadJsonFile",
    method: "post",
    data: payload.data,
    headers: payload.headers
  });
}

const releaseItem = async (payload: any): Promise<any> => {
  return api({
    url: "releaseOrderItem",
    method: "post",
    data: payload
  });
}

const cancelItem = async (payload: any): Promise<any> => {
  return api({
    url: "cancelOrderItem",
    method: "post",
    data: payload
  });
}

const updatePromiseDateItem = async (payload: any): Promise<any> => {
  return api({
    url: "updateOrderItem",
    method: "post",
    data: payload
  });
}

const getPODeliveryDate = async (query: any): Promise <any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: query
  });
}

const getPOItemAndATPDetails = async (payload: any): Promise<any> => {
  return api({
    url: "solr-query",
    method: "POST",
    data: payload
  })
}

export const OrderService = {
  fetchBrokeringCountByProducts,
  findOrder,
  releaseItem,
  cancelItem,
  updatePromiseDateItem,
  releaseItems,
  cancelItems,
  updatePromiseDateItems,
  getPODeliveryDate,
  getPOItemAndATPDetails
}