<template>
  <IonApp>
    <IonSplitPane content-id="main-content" when="lg">
      <Menu />
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </IonSplitPane>
  </IonApp>
</template>

<script lang="ts">
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane
} from "@ionic/vue";
import Menu from '@/components/Menu.vue';
import { defineComponent, provide, ref } from "vue";
import { useI18n } from 'vue-i18n'
import TaskQueue from './task-queue';
import OfflineHelper from "./offline-helper"
import emitter from "@/event-bus"
import { loadingController } from '@ionic/vue';
import { mapGetters, useStore } from 'vuex';
import { Settings } from 'luxon'
import { initialise, resetConfig } from '@/adapter'
import { useRouter } from 'vue-router';
import { useProductIdentificationStore } from "@hotwax/dxp-components";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    IonSplitPane,
    Menu
  },
  data() {
    return {
      loader: null as any,
      maxAge: process.env.VUE_APP_CACHE_MAX_AGE ? parseInt(process.env.VUE_APP_CACHE_MAX_AGE) : 0
    }
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile',
      userToken: 'user/getUserToken',
      instanceUrl: 'user/getInstanceUrl',
      currentEComStore: 'user/getCurrentEComStore'
    })
  },
  methods: {
    async presentLoader() {
      if (!this.loader) {
        this.loader = await loadingController
          .create({
            message: this.$t("Click the backdrop to dismiss."),
            translucent: true,
            backdropDismiss: true
          });
      }
      this.loader.present();
    },
    dismissLoader() {
      if (this.loader) {
        this.loader.dismiss();
        this.loader = null as any;
      }
    },
    async unauthorised() {
      this.store.dispatch("user/logout");
      this.router.push("/login")
    }
  },
  created() {
    initialise({
      token: this.userToken,
      instanceUrl: this.instanceUrl,
      cacheMaxAge: this.maxAge,
      events: {
        unauthorised: this.unauthorised,
        responseError: () => {
          setTimeout(() => this.dismissLoader(), 100);
        },
        queueTask: (payload: any) => {
          emitter.emit("queueTask", payload);
        }
      }
    })
  },
  async mounted() {
    this.loader = await loadingController
      .create({
        message: this.$t("Click the backdrop to dismiss."),
        translucent: true,
        backdropDismiss: true
      });
    emitter.on('presentLoader', this.presentLoader);
    emitter.on('dismissLoader', this.dismissLoader);
    // Handles case when user resumes or reloads the app
    // Luxon timezzone should be set with the user's selected timezone
    if (this.userProfile && this.userProfile.userTimeZone) {
      Settings.defaultZone = this.userProfile.userTimeZone;
    }

    // Get product identification from api using dxp-component and set the state if eComStore is defined
    if (this.currentEComStore.productStoreId) {
      await useProductIdentificationStore().getIdentificationPref(this.currentEComStore.productStoreId)
        .catch((error) => console.log(error));
    }
  },
  unmounted() {
    emitter.off('presentLoader', this.presentLoader);
    emitter.off('dismissLoader', this.dismissLoader);
    resetConfig()
  },
  setup() {
    const store = useStore();
    TaskQueue.init();
    OfflineHelper.register();
    const { t, locale } = useI18n();
    const router = useRouter();

    /* Start Product Identifier */

    const productIdentificationStore = useProductIdentificationStore();

    // Reactive state for productIdentificationPref
    let productIdentificationPref = ref(
      productIdentificationStore.$state.productIdentificationPref
    );

    // Providing productIdentificationPref to child components
    provide('productIdentificationPref', productIdentificationPref);

    // Subscribing to productIdentificationStore state change and changing value productIdentificationPref 
    productIdentificationStore.$subscribe((mutation: any, state) => {
        productIdentificationPref.value = state.productIdentificationPref;
    }, {detached: true});

    /* End Product Identifier */

    return {
      router,
      TaskQueue,
      OfflineHelper,
      t,
      locale,
      store
    };
  },
});
</script>
<style scoped>

ion-split-pane {
  --side-width: 304px;
}

ion-item.selected {
  --color: var(--ion-color-secondary);
}
</style>
