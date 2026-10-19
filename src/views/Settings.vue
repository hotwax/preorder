<template>
  <ion-page class="settings">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate("Settings") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="user-profile">
        <ion-card>
          <ion-item lines="full">
            <ion-avatar slot="start" v-if="userProfile?.partyImageUrl">
              <Image :src="userProfile.partyImageUrl"/>
            </ion-avatar>
            <ion-card-header class="ion-no-padding ion-padding-vertical">
              <ion-card-subtitle>{{ userProfile.username || userProfile.emailAddress || userProfile.userId }}</ion-card-subtitle>
              <ion-card-title>{{ userProfile.userFullName || userProfile.partyId || userProfile.userId || translate("User") }}</ion-card-title>
            </ion-card-header>
          </ion-item>
          <ion-button color="danger" @click="logout()">{{ translate("Logout") }}</ion-button>
          <ion-button fill="outline" @click="goToLaunchpad()">
            {{ translate("Go to Launchpad") }}
            <ion-icon slot="end" :icon="openOutline" />
          </ion-button>
        </ion-card>
      </div>

      <div class="section-header">
        <h1>{{ translate('OMS') }}</h1>
      </div>
      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ translate("OMS instance") }}</ion-card-subtitle>
            <ion-card-title>{{ omsInstance }}</ion-card-title>
            <ion-badge v-if="isOmsOffline" color="danger">{{ translate("Offline") }}</ion-badge>
          </ion-card-header>
          <ion-card-content>
            {{ translate("This is the name of the OMS you are connected to right now. Make sure that you are connected to the right instance before proceeding.") }}
          </ion-card-content>
          <ion-button v-if="!commonUtil.isMoqui()" fill="clear" :disabled="!userStore.hasPermission(Actions.APP_COMMERCE_VIEW)" @click="commonUtil.goToOms()">
            {{ translate("Go to OMS") }}
            <ion-icon slot="end" :icon="openOutline" />
          </ion-button>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ translate("Product store") }}</ion-card-subtitle>
            <ion-card-title>{{ translate("Store") }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ translate("A store represents a company or a unique catalog of products. If your OMS is connected to multiple eCommerce stores selling different collections of products, you may have multiple Product Stores set up in HotWax Commerce.") }}
          </ion-card-content>
          <ion-item lines="none">
            <ion-select :label="translate('Select store')" label-placement="stacked" interface="popover" :value="currentProductStoreId" @ionChange="setCurrentProductStore($event)">
              <ion-select-option v-for="store in productStores" :key="store.productStoreId" :value="store.productStoreId">
                {{ store.storeName || store.productStoreId }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-card>
      </section>
      <hr />
      <DxpAppVersionInfo />
      <section>
        <DxpProductIdentifier />

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate("Timezone") }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ translate("The timezone you select is used to ensure automations you schedule are always accurate to the time you select.") }}
          </ion-card-content>
          <ion-item v-if="showBrowserTimeZone">
            <ion-label>
              <p class="overline">{{ translate("Browser time zone") }}</p>
              {{ browserTimeZone.id }}
              <p v-if="showDateTime">{{ commonUtil.getCurrentTime(browserTimeZone.id, dateTimeFormat) }}</p>
            </ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-label>
              <p class="overline">{{ translate("Selected time zone") }}</p>
              {{ currentTimeZone }}
              <p v-if="showDateTime">{{ commonUtil.getCurrentTime(currentTimeZone, dateTimeFormat) }}</p>
            </ion-label>
            <ion-button id="time-zone-modal" slot="end" fill="outline" color="dark">
              {{ translate("Change") }}
            </ion-button>
          </ion-item>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate("Language") }}</ion-card-title>
          </ion-card-header>
          <ion-item lines="none">
            <ion-select :label="translate('Select language')" label-placement="stacked" interface="popover" :value="locale" @ionChange="setLocale($event.detail.value)">
              <ion-select-option value="en-US">English</ion-select-option>
              <ion-select-option value="es-ES">Español</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <div class="card-header">
              <div>
                <ion-card-title>{{ translate('Data fetch status') }}</ion-card-title>
                <ion-card-subtitle v-if="syncSubtitle">{{ syncSubtitle }}</ion-card-subtitle>
              </div>
              <ion-button fill="clear" size="small" :disabled="!!refreshing" @click="refreshAll()" :aria-label="translate('Refresh all data')" :title="translate('Refresh all data')">
                <ion-spinner v-if="refreshing === '*'" name="dots" slot="icon-only" />
                <ion-icon v-else slot="icon-only" :icon="syncOutline" />
              </ion-button>
            </div>
          </ion-card-header>
          <ion-list lines="none">
            <!-- Session data: held in memory, not in the local database. -->
            <ion-item v-for="item in sessionFetchStatus" :key="item.label">
              <ion-icon slot="start" :icon="getStatusIcon(item.status)" :color="getStatusColor(item.status)" />
              <ion-label>
                {{ item.label }}
                <p v-if="item.status === 'success' && item.count !== undefined">{{ translate('Fetched {count} records', { count: item.count }) }}</p>
                <p v-else>{{ translate(getStatusLabel(item.status)) }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" @click="item.refresh()" :aria-label="translate('Refresh {label}', { label: item.label })" :title="translate('Refresh {label}', { label: item.label })">
                <ion-icon slot="icon-only" :icon="syncOutline" />
              </ion-button>
            </ion-item>

            <!-- Local database (IndexedDB): live row counts straight from the database. -->
            <ion-item-divider>
              <ion-label>{{ translate('Local database: {count} records', { count: totalRows }) }}</ion-label>
            </ion-item-divider>
            <ion-item v-for="domain in domains" :key="domain.name">
              <ion-icon slot="start" :icon="getStatusIcon(domain.status)" :color="getStatusColor(domain.status)" />
              <ion-label>
                {{ translate(domain.label) }}
                <p>
                  {{ domainSyncLabel(domain) }}
                </p>
              </ion-label>
              <ion-button v-if="domain.syncClass !== 'C'" slot="end" fill="clear" :disabled="!!refreshing" @click="refreshDomain(domain.name)" :aria-label="translate('Refresh {label}', { label: translate(domain.label) })" :title="translate('Refresh {label}', { label: translate(domain.label) })">
                <ion-spinner v-if="refreshing === domain.name" name="dots" slot="icon-only" />
                <ion-icon v-else slot="icon-only" :icon="syncOutline" />
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card>
      </section>

      <ion-modal ref="timeZoneModal" trigger="time-zone-modal" @didPresent="search()" @didDismiss="clearSearch()">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeModal" :aria-label="translate('Close')" :title="translate('Close')">
                <ion-icon slot="icon-only" :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
            <ion-title>{{ translate("Select time zone") }}</ion-title>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar @ionFocus="selectSearchBarText($event)" :placeholder="translate('Search time zones')" v-model="queryString" @keyup.enter="findTimeZone()" />
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <ion-radio-group v-model="timeZoneId">
            <ion-list v-if="showBrowserTimeZone">
              <ion-list-header><ion-label>{{ translate("Browser time zone") }}</ion-label></ion-list-header>
              <ion-item>
                <ion-radio label-placement="end" justify="start" :value="browserTimeZone.id">
                  <ion-label>
                    {{ browserTimeZone.label }} ({{ browserTimeZone.id }})
                    <p v-if="showDateTime">{{ commonUtil.getCurrentTime(browserTimeZone.id, dateTimeFormat) }}</p>
                  </ion-label>
                </ion-radio>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header v-if="showBrowserTimeZone"><ion-label>{{ translate("Select a different time zone") }}</ion-label></ion-list-header>
              <ion-item v-if="isLoading" lines="none">
                <ion-spinner color="secondary" name="crescent" slot="start" />
                <ion-label>{{ translate("Fetching time zones") }}</ion-label>
              </ion-item>
              <ion-item v-else-if="filteredTimeZones.length === 0" lines="none">
                <ion-label>{{ translate("No time zone found") }}</ion-label>
              </ion-item>
              <template v-else>
                <ion-item v-for="timeZone in filteredTimeZones" :key="timeZone.id">
                  <ion-radio label-placement="end" justify="start" :value="timeZone.id">
                    <ion-label>
                      {{ timeZone.label }} ({{ timeZone.id }})
                      <p v-if="showDateTime">{{ commonUtil.getCurrentTime(timeZone.id, dateTimeFormat) }}</p>
                    </ion-label>
                  </ion-radio>
                </ion-item>
              </template>
            </ion-list>
          </ion-radio-group>

          <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="fab-vertical-bottom">
            <ion-fab-button :disabled="!timeZoneId || isSavingTimeZone" @click="saveUserTimeZone" :aria-label="translate('Save')">
              <ion-spinner v-if="isSavingTimeZone" name="crescent" />
              <ion-icon v-else :icon="saveOutline" />
            </ion-fab-button>
          </ion-fab>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonAvatar, IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonList, IonListHeader, IonMenuButton, IonModal, IonPage, IonRadio, IonRadioGroup, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue';
import { checkmarkCircle, closeCircle, closeOutline, openOutline, saveOutline, syncOutline } from 'ionicons/icons';
import { computed, onBeforeMount, ref } from 'vue';
import { commonUtil, cookieHelper, i18n, translate } from '@common';
import { catalogFrom, useDbStatus } from '@common/db';
import { useAuth } from '@common/composables/useAuth';
import { useUserStore } from '@/store/user';
import { useProductStore } from '@/store/productStore';
import { preorderDb } from '@/db/preorderDb';
import { resyncDomain, resyncReferenceData } from '@/db/appDbSync';
import { useProductStores } from '@/composables/useProductStores';
import DxpProductIdentifier from "@/components/settings/DxpProductIdentifier.vue";
import DxpAppVersionInfo from "@/components/settings/DxpAppVersionInfo.vue";
import Actions from "@/authorization/actions";
import { formatDateTime } from '@/utils/format';

const userStore = useUserStore();
const userProfile = computed(() => userStore.getUserProfile);
const { productStores, currentProductStoreId } = useProductStores();
const timeZones = computed(() => userStore.getAvailableTimeZones);
const currentTimeZone = computed(() => userStore.getUserTimeZone || userProfile.value?.userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone);
const omsInstance = computed(() => cookieHelper().get('oms') || userStore.oms);

const locale = computed(() => i18n.global.locale.value);

function setLocale(newLocale: string) {
  i18n.global.locale.value = newLocale;
  cookieHelper().set('locale', newLocale, 60 * 60 * 24 * 365);
}

const props = defineProps({
  showBrowserTimeZone: {
    type: Boolean,
    default: true
  },
  showDateTime: {
    type: Boolean,
    default: true
  },
  dateTimeFormat: {
    type: String,
    default: 't ZZZZ'
  }
});

const isLoading = ref(true);
const isSavingTimeZone = ref(false);
const isOmsOffline = ref(false);
const timeZoneModal = ref();
const queryString = ref('');
const filteredTimeZones = ref<any[]>([]);
const timeZoneId = ref(currentTimeZone.value);
const browserTimeZone = ref({
  label: '',
  id: Intl.DateTimeFormat().resolvedOptions().timeZone
});

onBeforeMount(async () => {
  isLoading.value = true;
  checkOmsConnection();
  await userStore.fetchAvailableTimeZones();
  timeZoneId.value = currentTimeZone.value;

  if (props.showBrowserTimeZone) {
    browserTimeZone.value.label = timeZones.value.find((timeZone: any) => timeZone.id.toLowerCase().match(browserTimeZone.value.id.toLowerCase()))?.label || browserTimeZone.value.id;
  }

  findTimeZone();
  isLoading.value = false;
});

async function checkOmsConnection() {
  if (!omsInstance.value) {
    isOmsOffline.value = true;
    return;
  }

  isOmsOffline.value = !(await userStore.isOmsReachable());
}

function setCurrentProductStore(event: CustomEvent) {
  if (event.detail.value && currentProductStoreId.value !== event.detail.value) {
    useProductStore().setProductStorePreference(event.detail.value)
  }
}

async function saveUserTimeZone() {
  isSavingTimeZone.value = true;
  try {
    await userStore.setUserTimeZone(timeZoneId.value);
    closeModal();
  } finally {
    isSavingTimeZone.value = false;
  }
}

function logout() {
  useAuth().logout({ isUserUnauthorised: false });
}

function goToLaunchpad() {
  window.location.href = `${import.meta.env.VITE_LAUNCHPAD_URL}`;
}

function closeModal() {
  timeZoneModal.value?.$el?.dismiss(null, 'cancel');
}

function findTimeZone() {
  const searchedString = queryString.value.toLowerCase();
  filteredTimeZones.value = timeZones.value.filter((timeZone: any) => timeZone.id.toLowerCase().match(searchedString) || timeZone.label.toLowerCase().match(searchedString));

  if (props.showBrowserTimeZone) {
    filteredTimeZones.value = filteredTimeZones.value.filter((timeZone: any) => !timeZone.id.toLowerCase().match(browserTimeZone.value.id.toLowerCase()));
  }
}

async function selectSearchBarText(event: any) {
  const element = await event.target.getInputElement();
  element.select();
}

function search() {
  timeZoneId.value = currentTimeZone.value;
  isLoading.value = true;
  findTimeZone();
  isLoading.value = false;
}

function clearSearch() {
  queryString.value = '';
  filteredTimeZones.value = [];
  isLoading.value = true;
}

// Live IndexedDB status
const {
  domains, refreshing, totalRows, oldestSyncedAt, lastSyncedAt, refreshDomain, refreshAll,
} = useDbStatus(
  preorderDb.client(),
  async () => catalogFrom((await import('@/workers/appSyncDomains')).appSyncDomains),
  {
    resyncDomain,
    resyncAll: resyncReferenceData,
  },
);

const formatSyncTime = (millis: number) => formatDateTime(millis);

const syncSubtitle = computed(() => {
  if (!lastSyncedAt.value) return translate("Database not synced yet");
  if (oldestSyncedAt.value && oldestSyncedAt.value !== lastSyncedAt.value) {
    return translate("Last sync: {time}, oldest: {oldest}", { time: formatSyncTime(lastSyncedAt.value), oldest: formatSyncTime(oldestSyncedAt.value) });
  }
  return translate("Last sync: {time}", { time: formatSyncTime(lastSyncedAt.value) });
});

/** "1,204 records, synced Sep 22, 2026, 2:33 PM", as one message so each language orders it. */
function domainSyncLabel(domain: { count: number; syncedAt?: number | null; syncClass?: string }) {
  if (domain.syncedAt) return translate("{count} records, synced {time}", { count: domain.count, time: formatSyncTime(domain.syncedAt) });
  if (domain.syncClass === "A") return translate("{count} records, live while in use", { count: domain.count });
  // Class C runs no pass of its own: rows arrive when a screen shows them (products).
  if (domain.syncClass === "C") return translate("{count} records, fetched when shown", { count: domain.count });
  return translate("{count} records, not synced yet", { count: domain.count });
}

const userFetchStatus = computed(() => userStore.fetchStatus);

const sessionFetchStatus = computed(() => [
  {
    label: translate("User profile"),
    status: userFetchStatus.value.profile,
    count: userProfile.value ? 1 : 0,
    refresh: () => userStore.fetchUserProfile()
  },
  {
    label: translate("Permissions"),
    status: userFetchStatus.value.permissions,
    count: userStore.permissions?.length || 0,
    refresh: () => userStore.fetchPermissions()
  }
]);

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return checkmarkCircle;
    case 'error': return closeCircle;
    case 'pending': return syncOutline;
    default: return syncOutline;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'success';
    case 'error': return 'danger';
    case 'pending': return 'medium';
    default: return 'medium';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'success': return 'Success';
    case 'error': return 'Error';
    case 'pending': return 'Pending';
    default: return 'Not fetched';
  }
};
</script>

<style scoped>
ion-card > ion-button {
  margin: var(--spacer-xs);
}
section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(18.75rem, 100%), 1fr));
  align-items: start;
}
.user-profile {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(25rem, 100%), 1fr));
}
hr {
  border-top: var(--border-medium);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacer-xs) var(--spacer-xs) 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
