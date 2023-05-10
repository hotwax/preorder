export default interface ProductState {
    cached: any;
    list: {
        total: number;
        items: any[];
    };
    current: {
        product: any;
        list: {
            total: number;
            items: any[];
        };
        totalPreOrders: number;
    };
    catalogProducts: {
        items: any[],
        total: number
    },
    currentCatalogProduct: any,
    cachedCatalogProducts: any
}