<template>
  <ion-menu side="start" content-id="main-content" type="overlay" :disabled="!isAuthenticated || router.currentRoute.value.path === '/login'">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ translate("Preorder Management") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-menu-toggle v-for="page in visiblePages" :key="page.url" :auto-hide="false">
          <ion-item-divider v-if="page.divider" color="light">
            <ion-label>{{ translate(page.divider) }}</ion-label>
          </ion-item-divider>
          <ion-item button :router-link="page.url" router-direction="root" :class="{ selected: isSelected(page) }">
            <ion-icon slot="start" :icon="page.icon" :color="isSelected(page) ? 'secondary' : undefined" />
            <ion-label :color="isSelected(page) ? 'secondary' : undefined">{{ translate(page.title) }}</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>

    <DxpOmsInstanceFooter
      v-if="isAuthenticated"
      :instance-label="omsInstanceLabel()"
      :product-stores="pickerStores"
      :current-product-store-id="currentProductStoreId"
      @update:product-store="setCurrentProductStore"
    />
  </ion-menu>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonList, IonMenu, IonMenuToggle, IonTitle, IonToolbar } from '@ionic/vue';
import {
  boatOutline,
  calendarOutline,
  cloudUploadOutline,
  documentTextOutline,
  gridOutline,
  layersOutline,
  syncOutline,
  mailOutline,
  settingsOutline
} from 'ionicons/icons';
import { commonUtil, DxpOmsInstanceFooter, translate } from '@common';
import { useAuth } from '@common/composables/useAuth';
import router from '@/router';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user';
import { computed } from 'vue';
import { useProductStoreSelection } from '@/composables/useProductStores';
import Actions from '@/authorization/actions';

const HOTWAX_HOST_SUFFIX = ".hotwax.io";

const { isAuthenticated } = useAuth();
const userStore = useUserStore();
const productStore = useProductStore();

const { productStores, currentProductStoreId } = useProductStoreSelection();
// The footer shows a store's name: a name two stores share carries the store's id
const pickerStores = computed(() => productStores.value.map((store) => ({ ...store, storeName: store.label })));

interface MenuPage {
  title: string;
  url: string;
  icon: string;
  permissionId: string;
  /** Other paths that keep this entry highlighted, such as its detail pages. */
  childPaths?: string[];
  divider?: string;
}

const pages: MenuPage[] = [
  { title: "Dashboard", url: "/dashboard", icon: gridOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Pre-orders", url: "/preorders", icon: calendarOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Future inventory", url: "/future-inventory", icon: layersOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Purchase orders", url: "/purchase-orders", icon: documentTextOutline, permissionId: Actions.APP_PO_VIEW, divider: "Supply" },
  { title: "Inbound shipments", url: "/inbound-shipments", icon: boatOutline, permissionId: Actions.APP_PO_VIEW },
  { title: "PO imports", url: "/po-imports", icon: cloudUploadOutline, permissionId: Actions.APP_PO_VIEW },
  { title: "Communications", url: "/communications", icon: mailOutline, permissionId: Actions.APP_COMMS_VIEW, divider: "Customers" },
  { title: "Bulk updates", url: "/bulk-updates", icon: syncOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Pre-order setup", url: "/setup", icon: settingsOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Future inventory sync", url: "/sync-events", icon: syncOutline, permissionId: Actions.APP_PREORDER_VIEW },
  { title: "Settings", url: "/settings", icon: settingsOutline, permissionId: "" },
];

const visiblePages = computed(() => pages.filter((page) => userStore.hasPermission(page.permissionId)));

function isSelected(page: MenuPage) {
  const path = router.currentRoute.value.path;
  return path === page.url || path.startsWith(`${page.url}/`) || Boolean(page.childPaths?.some((child) => path.startsWith(child)));
}

// Called from the template rather than memoised: getOmsURL() reads a cookie, so a
// computed would cache the pre-login empty value for the life of the session.
function omsInstanceLabel() {
  const omsURL = commonUtil.getOmsURL();
  if (!omsURL) return "";

  const host = omsURL.replace(/^https?:\/\//, "").split("/")[0];
  return host.endsWith(HOTWAX_HOST_SUFFIX) ? host.slice(0, -HOTWAX_HOST_SUFFIX.length) : host;
}

function setCurrentProductStore(productStoreId: string) {
  if (!productStoreId || currentProductStoreId.value === productStoreId) return;
  productStore.setProductStorePreference(productStoreId);
}
</script>
