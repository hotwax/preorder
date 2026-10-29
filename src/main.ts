import { createApp, watchEffect } from 'vue'
import App from './App.vue'
import router from './router';
import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Ionic Dark Mode */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import "@common/css/settings.css"
import "@common/css/theme.css"

import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { commonUtil, cookieHelper, createDxpI18n, faroUtil, initialiseConfig, logger } from '@common';
import { preorderDb } from './db/preorderDb';
import { useUserStore } from './store/user';
import localeMessages from './locales';

// Keeps commonUtil out of db/preorderDb.ts, and therefore out of the sync worker chunk.
preorderDb.setOmsInstanceResolver(() => commonUtil.getOMSInstanceName());

const pinia = createPinia().use(piniaPluginPersistedstate);
const i18n = createDxpI18n(localeMessages)
// Settings saves the chosen language in a cookie; start in it, and keep <html lang> in step so
// screen readers and the browser's spellcheck and hyphenation use the same language.
const savedLocale = cookieHelper().get('locale');
if(savedLocale && savedLocale in localeMessages) {i18n.global.locale.value = savedLocale;}
watchEffect(() => { document.documentElement.lang = i18n.global.locale.value; });

faroUtil.initialiseFaro()

const app = createApp(App)
  .use(IonicVue, {
    mode: 'md',
    innerHTMLTemplatesEnabled: true
  })
  .use(logger, {
    level: import.meta.env.VITE_DEFAULT_LOG_LEVEL,
    afterHooks: [faroUtil.faroLoggerHook]
  })
  .use(i18n)
  .use(pinia)

initialiseConfig({
  postLogin: useUserStore().postLogin,
  postLogout: useUserStore().postLogout,
  get oms() { return useUserStore().oms },
  set oms(val) { useUserStore().oms = val },
  get appVersion() { return useUserStore().appVersion },
  set appVersion(val) { useUserStore().appVersion = val },
  get current() { return useUserStore().current },
  set current(val) { useUserStore().current = val },
  router: router
})

app.use(router)

router.isReady().then(async () => {
  app.mount('#app');
});
