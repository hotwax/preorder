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

const getProductFutureATP = async (query: any): Promise<any> => {
    return api({
        url: "service/getProductFutureAtp",
        method: "post",
        data: query
    });
}

const getProductPOATP = async (query: any): Promise<any> => {
    return api({
        url: "service/getProductPOAtp",
        method: "post",
        data: query
    });
}

export const StockService = {
    checkInventory,
    getProductInventoryAvailable,
    getProductFutureATP,
    getProductPOATP
}