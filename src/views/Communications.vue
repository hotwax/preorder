<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Communications') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="section-header ion-padding-horizontal">
        <h1>{{ translate('Pre-order emails') }}</h1>
        <p>{{ translate('When a pre-order event happens, OMS queues the email and sends it through the store\'s email gateway within about a minute. Edit what each email sends, or turn it off for this store.') }}</p>
      </div>

      <ion-progress-bar v-if="settingsLoading" type="indeterminate" />
      <ErrorState v-if="settingsError" :title="translate('Could not load email settings')" :message="settingsError" retryable @retry="loadSettings" />

      <section v-else class="email-settings">
        <ion-card v-for="setting in settings" :key="setting.emailType">
          <ion-card-header>
            <ion-card-title>{{ emailTypeLabel(setting.emailType) }}</ion-card-title>
            <p v-if="seed.enumDescription(setting.emailType) !== setting.emailType">{{ seed.enumDescription(setting.emailType) }}</p>
          </ion-card-header>
          <ion-list lines="none">
            <ion-item :disabled="!canUpdate || !setting.wired || toggling === setting.emailType">
              <ion-toggle :key="`${setting.emailType}-${settingsRevision}`" :checked="setting.wired && setting.exists && setting.enabled" @ionChange="toggle(setting, $event.detail.checked)">
                {{ setting.wired ? (setting.exists && setting.enabled ? translate('Sending') : translate('Off')) : translate('Not wired') }}
              </ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate('When') }}</p>
                {{ setting.triggerDescription || translate('No OMS event sends this email yet.') }}
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon slot="start" :icon="setting.gatewayConfigured ? checkmarkCircleOutline : alertCircleOutline" :color="setting.gatewayConfigured ? 'success' : 'warning'" />
              <ion-label class="ion-text-wrap">
                {{ setting.gatewayConfigured ? translate('Gateway set') : translate('No gateway set') }}
                <p v-if="setting.gatewayConfigured">{{ gatewayLabel(setting.systemMessageRemoteId) }}</p>
                <p v-else>{{ translate('Set the gateway and its auth ID, or the email cannot reach the email provider.') }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="setting.subject">
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate('Subject') }}</p>
                {{ setting.subject }}
              </ion-label>
            </ion-item>
            <ion-item v-if="setting.fromAddress">
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate('From') }}</p>
                {{ setting.fromAddress }}
                <p v-if="setting.ccAddress || setting.bccAddress">
                  {{ [setting.ccAddress && translate('CC {address}', { address: setting.ccAddress }), setting.bccAddress && translate('BCC {address}', { address: setting.bccAddress })].filter(Boolean).join(', ') }}
                </p>
              </ion-label>
            </ion-item>
            <ion-item button :detail="true" :disabled="!canUpdate" @click="edit(setting)">
              <ion-icon slot="start" :icon="createOutline" />
              <ion-label>{{ translate('Edit email settings') }}</ion-label>
            </ion-item>
          </ion-list>
          <ion-card-content class="email-counts">
            <StatCard :title="translate('Last 7 days')" :stat="sentCount(setting.emailType, 7)" />
            <StatCard :title="translate('Last 30 days')" :stat="sentCount(setting.emailType, 30)" />
          </ion-card-content>
        </ion-card>
      </section>

      <hr />

      <div class="section-header ion-padding-horizontal">
        <h1>{{ translate('Recent emails') }}</h1>
      </div>

      <SearchFilterCard v-model="orderQuery" :placeholder="translate('Order ID')" :show-clear="false">
        <UniformFilterLayout @clear="clearEventFilters">
          <ion-select v-model="eventFilters.emailType" :label="translate('Email type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All email types') }}</ion-select-option>
            <ion-select-option v-for="type in emailTypeOptions" :key="type.value" :value="type.value">{{ type.label }}</ion-select-option>
          </ion-select>
          <ion-select v-model="eventFilters.statusId" :label="translate('Status')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All statuses') }}</ion-select-option>
            <ion-select-option value="COM_COMPLETE">{{ emailStatusLabel('COM_COMPLETE') }}</ion-select-option>
            <ion-select-option value="COM_BOUNCED">{{ emailStatusLabel('COM_BOUNCED') }}</ion-select-option>
          </ion-select>
          <DateFilterSelect v-model="eventFilters.fromDate" :label="translate('Sent from')" :max="eventFilters.thruDate" outlined />
          <DateFilterSelect v-model="eventFilters.thruDate" :label="translate('Sent through')" :min="eventFilters.fromDate" outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="eventsLoading" type="indeterminate" />
      <ErrorState v-if="eventsError" :title="translate('Could not load emails')" :message="eventsError" retryable @retry="loadEvents" />

      <ion-list v-else>
        <ion-list-header v-if="events.length">
          <ion-label>{{ translate('{shown} of {count} emails', { shown: events.length, count: eventsTotal }) }}</ion-label>
        </ion-list-header>
        <div
          v-for="event in events"
          :key="event.communicationEventId"
          class="list-item event-row"
          :role="event.orderId ? 'link' : undefined"
          :tabindex="event.orderId ? 0 : undefined"
          @click="openOrder(event.orderId)"
          @keydown.enter.prevent="openOrder(event.orderId)"
        >
          <ion-item lines="none">
            <ion-icon slot="start" :icon="mailOutline" />
            <ion-label>
              {{ event.toString || event.partyIdTo || translate('Unknown recipient') }}
              <p>{{ event.subject }}</p>
            </ion-label>
          </ion-item>
          <ion-label class="tablet">
            {{ emailTypeLabel(event.emailType) }}
            <p>{{ translate('Email type') }}</p>
          </ion-label>
          <ion-label class="tablet">
            {{ event.orderId || '-' }}
            <p>{{ translate('Order') }}</p>
          </ion-label>
          <ion-label class="tablet">
            <ion-badge :color="statusColor(event.statusId)">{{ emailStatusLabel(event.statusId) }}</ion-badge>
          </ion-label>
          <ion-label class="ion-text-end">
            {{ formatDateTime(event.datetimeStarted) }}
            <p>{{ formatRelative(event.datetimeStarted) }}</p>
          </ion-label>
        </div>
      </ion-list>

      <EmptyState
        v-if="!eventsLoading && eventsLoaded && !eventsError && !events.length"
        :title="translate('No emails sent')"
        :message="translate('Emails OMS sends for this store\'s orders show here, with their type.')"
      />

      <ion-infinite-scroll :disabled="events.length >= eventsTotal || !!eventsError" @ionInfinite="loadMoreEvents">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more emails')" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent,
  IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonListHeader, IonMenuButton,
  IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar, modalController, onIonViewWillEnter,
} from '@ionic/vue';
import { alertCircleOutline, checkmarkCircleOutline, createOutline, mailOutline } from 'ionicons/icons';
import { DateTime } from 'luxon';
import { computed, reactive, ref, watch } from 'vue';
import { StatCard, translate } from '@common';
import { useSeedData } from '@common/db';
import { useCommunications, type CommunicationEventRow, type EmailGateway, type EmailSettingChanges, type PreorderEmailSetting } from '@/composables/useCommunications';
import EmailSettingModal from '@/components/communications/EmailSettingModal.vue';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user';
import router from '@/router';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import { showToast } from '@/utils';
import { formatDateTime, formatRelative } from '@/utils/format';
import { toListParams } from '@/utils/query';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';

/** Events sent before OMS recorded the email type have none; the backend matches them with this. */
const UNKNOWN_EMAIL_TYPE = '_NA_';
const PAGE_SIZE = 20;

const seed = useSeedData();
const productStore = useProductStore();
const userStore = useUserStore();
const { fetchEmailSettings, setEmailEnabled, updateEmailSetting, fetchEmailGateways, fetchEvents, fetchCounts } = useCommunications();

const productStoreId = computed(() => productStore.getCurrentProductStore?.productStoreId || '');
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_COMMS_UPDATE));

const settings = ref<PreorderEmailSetting[]>([]);
const settingsLoading = ref(false);
const settingsError = ref('');
const toggling = ref('');
/** Re-keys the toggles after each save, so a failed one shows the server's state again. */
const settingsRevision = ref(0);
const gateways = ref<EmailGateway[]>([]);
const counts7 = ref<{ emailType?: string; statusId?: string; count: number }[]>([]);
const counts30 = ref<{ emailType?: string; statusId?: string; count: number }[]>([]);

const eventFilters = reactive({ emailType: 'All', statusId: 'All', fromDate: '', thruDate: '' });
const orderQuery = ref('');
const events = ref<CommunicationEventRow[]>([]);
const eventsTotal = ref(0);
const eventsPage = ref(0);
const eventsLoading = ref(false);
const eventsLoaded = ref(false);
const eventsError = ref('');

/** An email type by its short name ("Pre-Order Delivery Date Change"), not its long description. */
const emailTypeLabel = (emailType?: string) => {
  if (!emailType) return translate('Unknown type');
  const enumRow = seed.enums().find((row: any) => row.enumId === emailType);
  return enumRow?.enumName || enumRow?.description || emailType;
};

const emailTypeOptions = computed(() => [
  ...settings.value.map((setting) => ({ value: setting.emailType, label: emailTypeLabel(setting.emailType) })),
  { value: UNKNOWN_EMAIL_TYPE, label: translate('Unknown type') },
]);

const sentCount = (emailType: string, days: number) => (days === 7 ? counts7.value : counts30.value)
  .filter((row) => row.emailType === emailType && row.statusId !== 'COM_BOUNCED')
  .reduce((sum, row) => sum + Number(row.count || 0), 0);

/** Email statuses as a sender reads them; seed data may not carry the communication statuses. */
const EMAIL_STATUS_LABELS: Record<string, string> = { COM_COMPLETE: 'Sent', COM_BOUNCED: 'Bounced', COM_IN_PROGRESS: 'Sending' };
const emailStatusLabel = (statusId?: string) => {
  if (!statusId) return translate('Unknown');
  const label = seed.statusDescription(statusId);
  return label !== statusId ? label : translate(EMAIL_STATUS_LABELS[statusId] || statusId);
};

const daysAgo = (days: number) => DateTime.now().minus({ days }).toISODate() as string;

const gatewayLabel = (systemMessageRemoteId?: string) =>
  gateways.value.find((gateway) => gateway.systemMessageRemoteId === systemMessageRemoteId)?.description || systemMessageRemoteId || '';

async function loadSettings() {
  if (!productStoreId.value) return;
  settingsLoading.value = true;
  settingsError.value = '';
  try {
    const [rows, week, month, gatewayRows] = await Promise.all([
      fetchEmailSettings(productStoreId.value),
      fetchCounts(productStoreId.value, daysAgo(7)),
      fetchCounts(productStoreId.value, daysAgo(30)),
      fetchEmailGateways().catch(() => [] as EmailGateway[]),
    ]);
    settings.value = rows;
    gateways.value = gatewayRows;
    counts7.value = week;
    counts30.value = month;
  } catch (err) {
    settingsError.value = errorMessage(err, translate('Failed to load email settings.'));
  } finally {
    settingsLoading.value = false;
  }
}

function eventParams(pageIndex: number) {
  return {
    ...toListParams({ ...eventFilters, orderId: orderQuery.value.trim(), productStoreId: productStoreId.value }),
    pageIndex,
    pageSize: PAGE_SIZE,
  };
}

async function loadEvents() {
  if (!productStoreId.value) return;
  eventsLoading.value = true;
  eventsError.value = '';
  try {
    const { rows, total } = await fetchEvents(eventParams(0));
    events.value = rows;
    eventsTotal.value = total;
    eventsPage.value = 0;
    eventsLoaded.value = true;
  } catch (err) {
    eventsError.value = errorMessage(err, translate('Failed to load emails.'));
  } finally {
    eventsLoading.value = false;
  }
}

const eventsLoadingMore = ref(false);

async function loadMoreEvents(event: CustomEvent) {
  if (eventsLoadingMore.value) return (event.target as HTMLIonInfiniteScrollElement).complete();
  eventsLoadingMore.value = true;
  try {
    const { rows, total } = await fetchEvents(eventParams(eventsPage.value + 1));
    events.value = [...events.value, ...rows];
    eventsTotal.value = total;
    eventsPage.value += 1;
  } catch (err) {
    await showToast(errorMessage(err, translate('Could not load more emails. Scroll to try again.')));
  } finally {
    eventsLoadingMore.value = false;
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(orderQuery, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(loadEvents, 300);
});
watch(eventFilters, loadEvents, { deep: true });
watch(productStoreId, () => {
  void loadSettings();
  void loadEvents();
});

onIonViewWillEnter(() => {
  void loadSettings();
  void loadEvents();
});

function openOrder(orderId?: string) {
  if (orderId) router.push(`/preorders/${encodeURIComponent(orderId)}`);
}

function clearEventFilters() {
  Object.assign(eventFilters, { emailType: 'All', statusId: 'All', fromDate: '', thruDate: '' });
  orderQuery.value = '';
}

async function edit(setting: PreorderEmailSetting) {
  const modal = await modalController.create({
    component: EmailSettingModal,
    componentProps: { header: emailTypeLabel(setting.emailType), setting, gateways: gateways.value },
  });
  await modal.present();
  const { data, role } = await modal.onDidDismiss<EmailSettingChanges>();
  if (role !== 'confirm' || !data || !Object.keys(data).length) return;
  try {
    await updateEmailSetting(productStoreId.value, setting.emailType, data);
    await showToast(translate('{email} settings saved.', { email: emailTypeLabel(setting.emailType) }));
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to update the email setting.')));
  } finally {
    await loadSettings();
    settingsRevision.value += 1;
  }
}

async function toggle(setting: PreorderEmailSetting, enabled: boolean) {
  if ((setting.exists && setting.enabled) === enabled) return;
  toggling.value = setting.emailType;
  try {
    await setEmailEnabled(productStoreId.value, setting.emailType, enabled);
    await showToast(enabled ? translate('{email} turned on.', { email: emailTypeLabel(setting.emailType) }) : translate('{email} turned off.', { email: emailTypeLabel(setting.emailType) }));
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to update the email setting.')));
  } finally {
    toggling.value = '';
    await loadSettings();
    settingsRevision.value += 1;
  }
}
</script>

<style scoped>
.email-settings {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: repeat(auto-fill, minmax(min(22rem, 100%), 1fr));
  padding: var(--spacer-sm);
}

.email-settings ion-card {
  margin: 0;
}

.email-counts {
  display: grid;
  gap: var(--spacer-sm);
  grid-template-columns: 1fr 1fr;
}

.event-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  min-height: 4rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.event-row > ion-label {
  width: 100%;
}
</style>
