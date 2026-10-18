<template>
  <div class="section-header">
    <div>
      <h1>{{ translate('App') }}</h1>
      <p class="overline">{{ translate("Version: {appVersion}", { appVersion }) }}</p>
    </div>
    <div class="ion-text-end">
      <p class="overline">{{ translate("Built: {builtDateTime}", { builtDateTime: getDateTime(appInfo.builtTime) }) }}</p>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { translate } from '@common';
import { formatDateTime } from '@/utils/format';

const appInfo = (import.meta.env.VITE_APP_VERSION_INFO ? JSON.parse(import.meta.env.VITE_APP_VERSION_INFO as string) : {}) as any;
const appVersion = appInfo.branch ? (appInfo.branch + "-" + appInfo.revision) : appInfo.tag ? appInfo.tag : "";
// The app runs in the user's time zone, so the build time reads in it.
const getDateTime = (time: any) => formatDateTime(time);
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacer-xs) 10px 0px;
}
</style>
