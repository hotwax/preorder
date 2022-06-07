import { Customer } from "./Customer";
export interface Order {
    id: string; //3 orderId
    name: string; //4 orderName
    customer: Customer; //971
    /** An array containing the items purchased in this order */
    items?: OrderItem;//152
    /** An array containing the groups of items purchased in this order */
    itemGroup?: OrderItemGroup;
    total?: number;//31 grandTotal
    statusId?: string;//35 status.statusId
    identifications?: Array<string>;//
    orderDate?: string;//
}
export interface OrderItem {
    orderItemGroupId?: string;
    id?: string;//parts.items[0].orderId
    productId?: string;//parts.items[0].productId
    quantity?: number;//parts.items[0].quantity
    price?: number;//parts.items[0].unitListPrice
    amount?: number;//parts.items[0].billings.amount
    statusId?: string;//parts.items[0].shipmentSources.statusId//parts.items[0].product.statusId
}
export interface OrderItemGroup {
    id?: string;
    shippingAddress?: any;//parts.parties.contactMechs.postalAddress.shipGatewayAddressId
    billingAddress?: any;//
    shippingMethod?: any;//parts.shipmentMethod
    carrier?: any;//parts.carrier
    identifications?: Array<any>;//
} 