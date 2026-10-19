import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { commonUtil, Login, translate } from '@common';
import { useAuth } from '@common/composables/useAuth';
import { useUserStore } from '@/store/user';
import Actions from '@/authorization/actions';
import Dashboard from '@/views/Dashboard.vue';
import Preorders from '@/views/Preorders.vue';
import PreorderDetail from '@/views/PreorderDetail.vue';
import FutureInventory from '@/views/FutureInventory.vue';
import FutureInventoryDetail from '@/views/FutureInventoryDetail.vue';
import PurchaseOrders from '@/views/PurchaseOrders.vue';
import PurchaseOrderDetail from '@/views/PurchaseOrderDetail.vue';
import CreatePurchaseOrder from '@/views/CreatePurchaseOrder.vue';
import CreateInboundShipment from '@/views/CreateInboundShipment.vue';
import InboundShipments from '@/views/InboundShipments.vue';
import InboundShipmentDetail from '@/views/InboundShipmentDetail.vue';
import PurchaseOrderImports from '@/views/PurchaseOrderImports.vue';
import Communications from '@/views/Communications.vue';
import BulkUpdates from '@/views/BulkUpdates.vue';
import PreorderSetup from '@/views/PreorderSetup.vue';
import PreorderSyncEvents from '@/views/PreorderSyncEvents.vue';
import Settings from '@/views/Settings.vue';

const authGuard = async () => {
  if (!useAuth().isAuthenticated.value) {
    return { path: '/login' };
  }
};

const page = (path: string, name: string, component: any, permissionId?: string): RouteRecordRaw => ({
  path,
  name,
  component,
  props: path.includes(':'),
  beforeEnter: authGuard,
  meta: permissionId ? { permissionId } : {}
});

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login },
  page('/dashboard', 'Dashboard', Dashboard, Actions.APP_PREORDER_VIEW),
  page('/preorders', 'Preorders', Preorders, Actions.APP_PREORDER_VIEW),
  page('/preorders/:orderId', 'PreorderDetail', PreorderDetail, Actions.APP_PREORDER_VIEW),
  page('/future-inventory', 'FutureInventory', FutureInventory, Actions.APP_PREORDER_VIEW),
  page('/future-inventory/:futureInventoryItemId', 'FutureInventoryDetail', FutureInventoryDetail, Actions.APP_PREORDER_VIEW),
  page('/purchase-orders', 'PurchaseOrders', PurchaseOrders, Actions.APP_PO_VIEW),
  page('/purchase-orders/create', 'CreatePurchaseOrder', CreatePurchaseOrder, Actions.APP_PO_UPDATE),
  page('/purchase-orders/:orderId/inbound-shipment', 'CreateInboundShipment', CreateInboundShipment, Actions.APP_PO_UPDATE),
  page('/purchase-orders/:orderId', 'PurchaseOrderDetail', PurchaseOrderDetail, Actions.APP_PO_VIEW),
  page('/inbound-shipments', 'InboundShipments', InboundShipments, Actions.APP_PO_VIEW),
  page('/inbound-shipments/:shipmentId', 'InboundShipmentDetail', InboundShipmentDetail, Actions.APP_PO_VIEW),
  page('/po-imports', 'PurchaseOrderImports', PurchaseOrderImports, Actions.APP_PO_VIEW),
  page('/communications', 'Communications', Communications, Actions.APP_COMMS_VIEW),
  page('/bulk-updates', 'BulkUpdates', BulkUpdates, Actions.APP_PREORDER_VIEW),
  page('/setup', 'PreorderSetup', PreorderSetup, Actions.APP_PREORDER_VIEW),
  page('/sync-events', 'PreorderSyncEvents', PreorderSyncEvents, Actions.APP_PREORDER_VIEW),
  page('/settings', 'Settings', Settings),
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from) => {
  // Enforce the canonical version URL on every navigation (no-op until the version is resolved).
  if (useAuth().checkAppVersionRedirect()) return false;

  if (to.meta.permissionId && !useUserStore().hasPermission(to.meta.permissionId as string)) {
    let redirectToPath = from.path;
    // From the login page or on page load, land on Settings without a toast.
    if (redirectToPath == "/login" || redirectToPath == "/") redirectToPath = "/settings";
    else commonUtil.showToast(translate('You do not have permission to access this page.'));
    return { path: redirectToPath };
  }
});

export default router;
