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
}