import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Products from '../views/products.vue'
import ProductDetails from '../views/product-details.vue'
import CatalogProductDetails from '../views/catalog-product-details.vue'
import Orders from '../views/orders.vue'
import Catalog from '../views/catalog.vue'
import Settings from '../views/settings.vue'
import store from '@/store';
import { Login, useAuthStore } from '@hotwax/dxp-components';
import { loader } from '@/user-utils';

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

const routes: Array<RouteRecordRaw> = [
   {
    path: '/',
    redirect: '/orders'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/products',
    name: 'products',
    component: Products,
    beforeEnter: authGuard
  },
  {
    path: '/product-details/:id',
    name: 'Product-details',
    component: ProductDetails,
    beforeEnter: authGuard
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    beforeEnter: authGuard
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: Catalog,
    beforeEnter: authGuard
  },
  {
    path: '/catalog-product-details/:productId/',
    name: 'Catalog-product-details',
    component: CatalogProductDetails,
    beforeEnter: authGuard
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

export default router
