export default interface OrderState {
    list: {
        total: number;
        items: any[];
        preorderCount: number;
    },
    query: {
        queryString: string;
        orderedAfter: string;
        orderedBefore: string;
        promisedAfter: string;
        promisedBefore: string;
        cusotmerLoyalty: string;
        hasPromisedDate: boolean;
        viewIndex: number;
        viewSize: number;
        hasUpdated: boolean;
    },
    selectedItems: any[],
    brokeringCountByProduct: any,
    lastActionTimestamp: string
}