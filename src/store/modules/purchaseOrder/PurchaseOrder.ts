export default interface PurchaseOrderState {
  list: {
    orders: any;
    total: number;
  };
  current: object;
}