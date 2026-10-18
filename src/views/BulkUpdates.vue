<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('Bulk updates') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-content>
          {{ translate('When a batch\'s promise date changes, the orders waiting on it are updated in bulk: the change is queued, then the Data Manager moves each waiting line to the new date and sends its delay email. Each row is one batch\'s date change; a line that could not be updated is in its error file.') }}
        </ion-card-content>
        <ion-item lines="none">
          <ion-label>{{ translate('Date changes waiting to be queued') }}</ion-label>
          <ion-note slot="end">{{ waitingCount === undefined ? '-' : formatNumber(waitingCount) }}</ion-note>
        </ion-item>
      </ion-card>

      <SearchFilterCard v-model="logIdQuery" :placeholder="translate('Exact log ID')" :show-clear="false">
        <UniformFilterLayout @clear="clearFilters">
          <ion-select v-model="filters.statusId" :label="translate('Status')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All statuses') }}</ion-select-option>
            <ion-select-option v-for="status in importStatuses" :key="status.statusId" :value="status.statusId">{{ status.description || status.statusId }}</ion-select-option>
          </ion-select>
          <DateFilterSelect v-model="filters.createdDateFrom" :label="translate('Created from')" :max="filters.createdDateThru" outlined />
          <DateFilterSelect v-model="filters.createdDateThru" :label="translate('Created through')" :min="filters.createdDateFrom" outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load bulk updates')" :message="error" retryable @retry="load" />

      <ion-list v-else>
        <ion-list-header v-if="logs.length">
          <ion-label>{{ translate('{count} bulk updates', { count: logs.length }) }}</ion-label>
          <ion-button fill="clear" size="small" :aria-label="translate('Refresh')" @click="load">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-list-header>
        <div v-for="log in logs" :key="log.logId" class="list-item bulk-row">
          <ion-item lines="none" :button="!!batchOf(log)" :detail="false" :router-link="batchOf(log) ? `/future-inventory/${encodeURIComponent(batchOf(log))}` : undefined">
            <ion-icon slot="start" :icon="calendarOutline" />
            <ion-label>
              {{ batchOf(log) || log.fileName || log.logId }}
              <p>{{ translate('Promise date change, import {logId}', { logId: log.logId }) }}</p>
            </ion-label>
          </ion-item>
          <ion-label class="tablet">
            <ion-badge :color="statusColor(log.statusId)">{{ seed.statusDescription(log.statusId) }}</ion-badge>
            <p v-if="log.totalRecordCount !== undefined && log.totalRecordCount !== null">{{ translate('{total} lines, {failed} failed', { total: log.totalRecordCount, failed: log.failedRecordCount ?? 0 }) }}</p>
          </ion-label>
          <ion-label class="tablet">
            {{ formatDateTime(log.createdDate) }}
            <p>{{ translate('Queued') }}</p>
          </ion-label>
          <ion-label class="tablet">
            <template v-if="log.finishDateTime">
              {{ formatDateTime(log.finishDateTime) }}
              <p>{{ translate('Finished') }}</p>
            </template>
            <template v-else>{{ log.startDateTime ? translate('Running') : translate('Not started') }}</template>
          </ion-label>
          <div class="bulk-row-end">
            <ion-button fill="clear" size="small" :disabled="!log.logContentId" @click="downloadFile(log, false)">{{ translate('Lines') }}</ion-button>
            <ion-button fill="clear" size="small" color="danger" :disabled="!log.errorLogContentId" @click="downloadFile(log, true)">{{ translate('Errors') }}</ion-button>
          </div>
        </div>
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !logs.length"
        :title="translate('No bulk updates')"
        :message="translate('A batch promise date change with orders waiting on it shows here once it is queued.')"
      />

      <ion-infinite-scroll :disabled="!hasMore" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more bulk updates')" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonListHeader, IonMenuButton, IonNote, IonPage, IonProgressBar,
  IonSelect, IonSelectOption, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { calendarOutline, refreshOutline } from 'ionicons/icons';
import { computed, reactive, ref, watch } from 'vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { BULK_UPDATE_CONFIGS, useImports, type ImportLog } from '@/composables/useImports';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import { showToast } from '@/utils';
import { downloadText } from '@/utils/download';
import { formatDateTime, formatNumber } from '@/utils/format';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';

const PAGE_SIZE = 20;
const PROMISE_DATE = BULK_UPDATE_CONFIGS[0];

const seed = useSeedData();
const { fetchLogs, downloadLogFile, countWaitingMessages } = useImports();

const importStatuses = computed(() => seed.statusItemsByType('DataManagerLog'));

const filters = reactive({ statusId: 'All', createdDateFrom: '', createdDateThru: '' });
const logIdQuery = ref('');
const logs = ref<ImportLog[]>([]);
const waitingCount = ref<number>();
const pageIndex = ref(0);
const hasMore = ref(false);
const loading = ref(false);
const loaded = ref(false);
const error = ref('');

/** The batch a promise date import is for: its file is FI_PROMISE_DATE_<batch>_<message>.json. */
const batchOf = (log: ImportLog) => /^FI_PROMISE_DATE_(.+)_[^_]+\.json$/.exec(log.fileName || '')?.[1] || '';

const query = () => ({ ...filters, configId: PROMISE_DATE.configId, logId: logIdQuery.value.trim() });

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [rows, waiting] = await Promise.all([
      fetchLogs(query(), 0, PAGE_SIZE, BULK_UPDATE_CONFIGS),
      countWaitingMessages(PROMISE_DATE.messageTypeId).catch(() => undefined),
    ]);
    logs.value = rows;
    waitingCount.value = waiting;
    pageIndex.value = 0;
    hasMore.value = rows.length === PAGE_SIZE;
    loaded.value = true;
  } catch (err) {
    error.value = errorMessage(err, translate('Failed to load bulk updates.'));
  } finally {
    loading.value = false;
  }
}

const loadingMore = ref(false);

async function loadMore(event: CustomEvent) {
  if (loadingMore.value) return (event.target as HTMLIonInfiniteScrollElement).complete();
  loadingMore.value = true;
  try {
    const rows = await fetchLogs(query(), pageIndex.value + 1, PAGE_SIZE, BULK_UPDATE_CONFIGS);
    logs.value = [...logs.value, ...rows];
    pageIndex.value += 1;
    hasMore.value = rows.length === PAGE_SIZE;
  } catch (err) {
    await showToast(errorMessage(err, translate('Could not load more bulk updates. Scroll to try again.')));
  } finally {
    loadingMore.value = false;
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }
}

watch(filters, load, { deep: true });
let logIdDebounce: ReturnType<typeof setTimeout> | undefined;
watch(logIdQuery, () => {
  if (logIdDebounce) clearTimeout(logIdDebounce);
  logIdDebounce = setTimeout(load, 300);
});
onIonViewWillEnter(load);

function clearFilters() {
  Object.assign(filters, { statusId: 'All', createdDateFrom: '', createdDateThru: '' });
  logIdQuery.value = '';
}

async function downloadFile(log: ImportLog, errors: boolean) {
  const logContentId = errors ? log.errorLogContentId : log.logContentId;
  if (!logContentId) return;
  try {
    const name = (errors ? log.errorFileName : log.fileName) || `${log.logId}${errors ? '-errors' : ''}.json`;
    downloadText(name, await downloadLogFile(log.configId, logContentId), 'application/json;charset=utf-8');
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to download the file.')));
  }
}
</script>

<style scoped>
.bulk-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  min-height: 4rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.bulk-row > ion-label {
  width: 100%;
}

.bulk-row-end {
  display: flex;
}
</style>
