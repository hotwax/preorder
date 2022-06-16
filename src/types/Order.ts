import { Customer } from "./Customer";
export interface Order {
    orderId: string;
    orderName: string;
    customer: Customer;
    /** An array containing the items purchased in this order */
    items?: OrderItem;
    /** An array containing the groups of items purchased in this order */
    parts?: OrderPart;
    grandTotal?: number;
    status?: string;
    identifications?: Array<string>;
    placedDate?: string;
}
export interface OrderItem {
    orderPartSeqId?: string;
    orderItemSeqId?: string;
    productId?: string;
    quantity?: number;
    unitListPrice?: number;
    unitAmount?: number;
    statusId?: string;
}
export interface OrderPart {
    orderPartSeqId?: string;
    shippingAddress?: any;
    billingAddress?: any;
    shipmentMethodEnum?: any;
    carrierPartyId?: any;
    identifications?: Array<any>;
}