<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="lg">
      <Menu v-if="router.currentRoute.value.name !== 'Login'" />
      <ion-router-outlet id="main-content" />
    </ion-split-pane>
    <!-- Fast Travel: Cmd/Ctrl+K app switcher + deep-link router across the HotWax suite -->
    <FastTravel current-app="preorder" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSplitPane, loadingController } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Settings } from 'luxon';
import { emitter, FastTravel, translate } from '@common';
import { useAuth } from '@common/composables/useAuth';
import { startAppDbSync } from '@/db/appDbSync';
import Menu from '@/components/layout/Menu.vue';
import router from './router';
import { useUserStore } from '@/store/user';

const loader = ref<HTMLIonLoadingElement | null>(null);
const { isAuthenticated } = useAuth();
const userStore = useUserStore();
const userProfile = computed(() => userStore.getUserProfile);

async function presentLoader(options = { message: '', backdropDismiss: true }) {
  if (options.message && loader.value) dismissLoader();

  if (!loader.value) {
    loader.value = await loadingController.create({
      message: options.message ? translate(options.message) : translate("Click the backdrop to dismiss."),
      translucent: true,
      backdropDismiss: options.backdropDismiss
    });
  }

  loader.value.present();
}

function dismissLoader() {
  if (loader.value) {
    loader.value.dismiss();
    loader.value = null;
  }
}

onMounted(async () => {
  loader.value = await loadingController.create({
    message: translate("Click the backdrop to dismiss."),
    translucent: true,
    backdropDismiss: true
  });
  emitter.on('presentLoader', presentLoader);
  emitter.on('dismissLoader', dismissLoader);

  const timeZone = userProfile.value?.timeZone || userProfile.value?.userTimeZone;
  if (timeZone) Settings.defaultZone = timeZone;

});

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    userStore.fetchPermissions().catch(() => undefined);
    void startAppDbSync();
  }
}, { immediate: true });

onUnmounted(() => {
  emitter.off('presentLoader', presentLoader);
  emitter.off('dismissLoader', dismissLoader);
});
</script>
