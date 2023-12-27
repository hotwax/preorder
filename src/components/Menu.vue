<template>
    <ion-menu content-id="main-content" type="overlay" :disabled="!isUserAuthenticated">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ $t("Preorder Management")}}</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <ion-list id="preorder-list">
            <ion-menu-toggle auto-hide="false" v-for="(p, i) in getValidMenuItems(appPages)" :key="i">
              <ion-item
                button
                router-direction="root"
                :router-link="p.url"
                class="hydrated"
                :class="{ selected: selectedIndex === i }"
              >
                <ion-icon slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>
</template>

<script lang="ts">
import {
  IonContent,
  IonIcon,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  IonMenu,
  IonMenuToggle,
} from "@ionic/vue";
import { computed, defineComponent} from "vue"
import { mapGetters } from "vuex";
import { shirt, pricetags, settings, flashlightOutline } from "ionicons/icons";
import { useStore } from "@/store";
import { useRouter } from "vue-router";
import { hasPermission } from "@/authorization";

export default defineComponent({
  name: "Menu",
  components: {
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonTitle,
    IonLabel,
    IonList,
    IonToolbar,
    IonMenu,
    IonMenuToggle,
  },
  computed: {
    ...mapGetters({
      isUserAuthenticated: 'user/isUserAuthenticated'
    })
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const getValidMenuItems = (appPages: any) => {
      return appPages.filter((appPage: any) => (!appPage.meta || !appPage.meta.permissionId) || hasPermission(appPage.meta.permissionId));
    }

    const appPages = [
      {
        title: "Orders",
        url: "/orders",
        iosIcon: pricetags,
        mdIcon: pricetags,
        meta: {
          permissionId: "APP_ORDERS_VIEW"
        }
      },
      {
        title: "Products",
        url: "/products",
        childRoutes: ["/product-details/"],
        iosIcon: shirt,
        mdIcon: shirt,
        meta: {
          permissionId: "APP_PRODUCTS_VIEW"
        }
      },
      {
        title: "Audit",
        url: "/audit",
        childRoutes: ["/audit-product-details/"],
        iosIcon: flashlightOutline,
        mdIcon: flashlightOutline,
        meta: {
          permissionId: "APP_CATALOG_VIEW"
        }
      },
      {
        title: "Settings",
        url: "/settings",
        iosIcon: settings,
        mdIcon: settings,
      }
    ];

    const selectedIndex = computed(() => {
      const path = router.currentRoute.value.path
      return getValidMenuItems(appPages).findIndex((screen: any) => screen.url === path || screen.childRoutes?.includes(path) || screen.childRoutes?.some((route: any)=> path.includes(route)))
    })

    return {
      appPages,
      getValidMenuItems,
      pricetags,
      settings,
      selectedIndex,
      shirt,
      store
    };
  }
});
</script>
<style scoped>

ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-secondary);
}

ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-secondary);
}

</style>
