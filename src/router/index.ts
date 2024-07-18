import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Products from '../views/products.vue'
import ProductDetails from '../views/product-details.vue'
import CatalogProductDetails from '../views/catalog-product-details.vue'
import Orders from '../views/orders.vue'
import Catalog from '../views/catalog.vue'
import Settings from '../views/settings.vue'
import store from '@/store';
import { DxpLogin, useAuthStore } from '@hotwax/dxp-components';
import { loader } from '@/user-utils';
import { hasPermission } from '@/authorization';
import { showToast } from '@/utils';
import { translate } from '@/i18n';

// Defining types for the meta values
declare module 'vue-router' {
  interface RouteMeta {
    permissionId?: string;
  }
}

const authGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated || !store.getters['user/isAuthenticated']) {
    await loader.present('Authenticating')
    // TODO use authenticate() when support is there
    const redirectUrl = window.location.origin + '/login'
    window.location.href = `${process.env.VUE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`
    loader.dismiss()
  }
  next()
};

const loginGuard = (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated && !to.query?.token && !to.query?.oms) {
    next('/')
  }
  next();
};

const routes: Array<RouteRecordRaw> = [
   {
    path: '/',
    redirect: '/orders'
  },
  {
    path: '/login',
    name: 'dxp-login',
    component: DxpLogin,
    beforeEnter: loginGuard
  },
  {
    path: '/products',
    name: 'products',
    component: Products,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_PRODUCTS_VIEW"
    }
  },
  {
    path: '/product-details/:id',
    name: 'Product-details',
    component: ProductDetails,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_PRDT_DTLS_VIEW"
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_ORDERS_VIEW"
    }
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: Catalog,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_CATALOG_VIEW"
    }
  },
  {
    path: '/catalog-product-details/:productId/',
    name: 'Catalog-product-details',
    component: CatalogProductDetails,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_CTLG_PRDT_DTLS_VIEW"
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    beforeEnter: authGuard
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  if (to.meta.permissionId && !hasPermission(to.meta.permissionId)) {
    let redirectToPath = from.path;
    // If the user has navigated from Login page or if it is page load, redirect user to settings page without showing any toast
    if (redirectToPath == "/login" || redirectToPath == "/") redirectToPath = "/settings";
    else showToast(translate('You do not have permission to access this page'));
    return {
      path: redirectToPath,
    }
  }
})

export default router
