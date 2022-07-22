import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../views/login.vue'
import Products from '../views/products.vue'
import Productdetails from '../views/product-details.vue'
import Orders from '../views/orders.vue'
import Catalog from '../views/catalog.vue'
import UpdatePassword from '../views/update-password.vue'
import Settings from '../views/settings.vue'
import store from '@/store'


const authGuard = (to: any, from: any, next: any) => {
  if (store.getters['user/isAuthenticated']) {
      next()
  } else {
    next("/login")
  }
};

const loginGuard = (to: any, from: any, next: any) => {
  if (!store.getters['user/isAuthenticated']) {
      next()
  } else {
    next("/")
  }
};


const routes: Array<RouteRecordRaw> = [
   {
    path: '/',
    redirect: '/orders'
  },
  {
    path: '/update-password',
    name: 'update-password',
    component: UpdatePassword
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    beforeEnter: loginGuard
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
    component: Productdetails,
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
