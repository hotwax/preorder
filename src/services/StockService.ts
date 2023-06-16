import { api } from '@/adapter';

const checkInventory = async (query: any): Promise<any> => {
    return api({
        url: "checkInventory",
        method: "post",
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

const getProductFutureAtp = async (query: any): Promise<any> => {
    return api({
        url: "service/getProductFutureAtp",
        method: "post",
        data: query
    });
}

const getProductOnlineAtp = async (query: any): Promise<any> => {
    return api({
        url: "service/getProductOnlineAtp",
        method: "post",
        data: query
    });
}

export const StockService = {
    checkInventory,
    getProductInventoryAvailable,
    getProductFutureAtp,
    getProductOnlineAtp
}