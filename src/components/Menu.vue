<template>
  <ion-menu content-id="main-content" type="overlay" :disabled="!isUserAuthenticated">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t("Preorder Management")}}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list id="preorder-list">
        <ion-menu-toggle auto-hide="false" v-for="(p, i) in appPages" :key="i">
          <ion-item
            button
            @click="selectedIndex = i"
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

    <ion-footer>
      <ion-toolbar>
        <ion-item lines="none">
          <ion-label class="ion-text-wrap">
            <p class="overline">{{ instanceUrl }}</p>
            {{ brand.name }}
          </ion-label>
          <ion-note slot="end">{{ userProfile.userTimeZone }}</ion-note>
        </ion-item>
      </ion-toolbar>
    </ion-footer>
  </ion-menu>
</template>

<script lang="ts">
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonTitle,
  IonToolbar
} from "@ionic/vue";
import { defineComponent, ref } from "vue";
import { mapGetters } from "vuex";

import { albums ,shirt, pricetags, settings } from "ionicons/icons";
import { useStore } from "@/store";

export default defineComponent({
  name: "Menu",
  components: {
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonItem,
    IonTitle,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonNote,
    IonToolbar,
  },
  created() {
    // When open any specific page it should show that page selected
    // TODO Find a better way
    this.selectedIndex = this.appPages.findIndex((page) => {
      return page.url === this.$router.currentRoute.value.path;
    })
  },
  computed: {
    ...mapGetters({
      isUserAuthenticated: 'user/isUserAuthenticated',
      userProfile: 'user/getUserProfile',
      instanceUrl: 'user/getInstanceUrl',
      selectedBrand: 'user/getSelectedBrand'
    })
  },
  watch:{
    $route (to) {
      // When logout and login it should point to Oth index
      // TODO Find a better way
      if (to.path === '/login') {
        this.selectedIndex = 0;
      }
    },
  }, 
  setup() {
    const store = useStore();
    const selectedIndex = ref(0);
    const appPages = [
      {
        title: "Orders",
        url: "/orders",
        iosIcon: pricetags,
        mdIcon: pricetags,
      },
      {
        title: "Products",
        url: "/products",
        iosIcon: shirt,
        mdIcon: shirt,
      },
      {
        title: "Pre-order catalog",
        url: "/catalog",
        iosIcon: albums,
        mdIcon: albums,
      },
      {
        title: "Settings",
        url: "/settings",
        iosIcon: settings,
        mdIcon: settings,
      },
    ];
    return {
      selectedIndex,
      appPages,
      albums,
      shirt,
      pricetags,
      settings,
      store
    };
  },
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
