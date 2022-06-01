export interface Product {
    productId?: String;
    productName?: String;
    description?: String;
    brand?: String;
    price?: number;
    sku?: String;
    identifications?: Array<any>;
    specialPrice?: number;
    /** An array containing assets like images and videos */
    assets?: Array<any>;
    mainImage?: String;
    parentProductId?: String;
    type?: String;
    category?: Array<any>;
    feature?: Array<any>;
    variants?: Array<any>;
} 