/**
 * App actions mapped to the server permissions they require.
 *
 * Views, components and routes refer to an action from this file instead of a server permission,
 * so a permission change is a one line change here. The value is the permission expression
 * evaluated by `hasPermission` of the user store: it supports `OR` and `AND`, and an empty value
 * allows every logged in user.
 */
export default {
  APP_SETUP_UPDATE: "PREORDER_ADMIN OR COMMON_ADMIN",
  APP_PREORDER_VIEW: "PREORDER_APP_VIEW",
  APP_PREORDER_UPDATE: "PREORDER_APP_UPDATE OR PREORDER_ADMIN OR ORDERMGR_ADMIN",
  APP_PO_VIEW: "PREORDER_APP_VIEW",
  APP_PO_UPDATE: "PREORDER_APP_UPDATE OR PREORDER_ADMIN OR ORD_PURCH_ORDER_ADMIN OR ORDERMGR_ADMIN",
  APP_FI_UPDATE: "PREORDER_APP_UPDATE OR PREORDER_ADMIN OR ORDERMGR_ADMIN",
  APP_COMMS_VIEW: "PREORDER_APP_VIEW",
  APP_COMMS_UPDATE: "PREORDER_ADMIN OR ORDERMGR_ADMIN OR COMMON_ADMIN",
  APP_PRODUCT_IDENTIFIER_UPDATE: "STOREFULFILLMENT_ADMIN",
  APP_COMMERCE_VIEW: "COMMERCEUSER_VIEW"
} as const satisfies Record<string, string>
