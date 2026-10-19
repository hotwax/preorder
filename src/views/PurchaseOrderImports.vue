<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ translate('PO imports') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ translate('Upload a file') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          {{ translate('Purchase order CSVs create or update purchase orders, one row per line. Future inventory CSVs create or update batches to sell before stock arrives. Each upload is queued, imported by the Data Manager, and tracked below.') }}
        </ion-card-content>
        <div class="upload-row ion-padding-horizontal ion-padding-bottom">
          <ion-select v-model="uploadConfigId" :label="translate('Import type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option v-for="config in uploadableConfigs" :key="config.configId" :value="config.configId">{{ translate(config.label) }}</ion-select-option>
          </ion-select>
          <ion-button fill="outline" @click="downloadTemplateFile">
            <ion-icon slot="start" :icon="downloadOutline" />
            {{ translate('Template') }}
          </ion-button>
          <ion-button fill="outline" @click="fileInput?.click()">
            <ion-icon slot="start" :icon="documentAttachOutline" />
            {{ selectedFile?.name || translate('Choose CSV') }}
          </ion-button>
          <ion-button :disabled="!selectedFile || uploading || !canUpdate" @click="upload">
            <ion-icon slot="start" :icon="cloudUploadOutline" />
            {{ translate('Upload') }}
          </ion-button>
          <input ref="fileInput" class="file-input" type="file" accept=".csv,text/csv" @change="pickFile" />
        </div>
      </ion-card>

      <SearchFilterCard v-model="logIdQuery" :placeholder="translate('Exact log ID')" :show-clear="false">
        <UniformFilterLayout @clear="clearFilters">
          <ion-select v-model="filters.configId" :label="translate('Import type')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All imports') }}</ion-select-option>
            <ion-select-option v-for="config in IMPORT_CONFIGS" :key="config.configId" :value="config.configId">{{ translate(config.label) }}</ion-select-option>
          </ion-select>
          <ion-select v-model="filters.statusId" :label="translate('Status')" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="All">{{ translate('All statuses') }}</ion-select-option>
            <ion-select-option v-for="status in importStatuses" :key="status.statusId" :value="status.statusId">{{ status.description || status.statusId }}</ion-select-option>
          </ion-select>
          <DateFilterSelect v-model="filters.createdDateFrom" :label="translate('Created from')" :max="filters.createdDateThru" outlined />
          <DateFilterSelect v-model="filters.createdDateThru" :label="translate('Created through')" :min="filters.createdDateFrom" outlined />
        </UniformFilterLayout>
      </SearchFilterCard>

      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ErrorState v-if="error" :title="translate('Could not load imports')" :message="error" retryable @retry="load" />

      <ion-list v-else>
        <ion-list-header v-if="visibleLogs.length">
          <ion-label>{{ translate('{count} imports', { count: visibleLogs.length }) }}</ion-label>
          <ion-button fill="clear" size="small" :aria-label="translate('Refresh')" @click="load">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-list-header>
        <div v-for="log in visibleLogs" :key="log.logId" class="list-item import-row">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="documentTextOutline" />
            <ion-label>
              {{ log.fileName || log.logId }}
              <p>{{ [log.logId, configLabel(log.configId)].filter(Boolean).join(' - ') }}</p>
            </ion-label>
          </ion-item>
          <ion-label class="tablet">
            <ion-badge :color="statusColor(log.statusId)">{{ seed.statusDescription(log.statusId) }}</ion-badge>
            <p v-if="log.totalRecordCount !== undefined && log.totalRecordCount !== null">{{ translate('{total} records, {failed} failed', { total: log.totalRecordCount, failed: log.failedRecordCount ?? 0 }) }}</p>
          </ion-label>
          <ion-label class="tablet">
            {{ formatDateTime(log.createdDate) }}
            <p>{{ log.createdByUserLogin || translate('System') }}</p>
          </ion-label>
          <ion-label class="tablet">
            <template v-if="log.finishDateTime">
              {{ formatDateTime(log.finishDateTime) }}
              <p>{{ translate('Finished') }}</p>
            </template>
            <template v-else>{{ log.startDateTime ? translate('Running') : translate('Not started') }}</template>
          </ion-label>
          <div class="import-row-end">
            <ion-button fill="clear" size="small" :disabled="!log.logContentId" @click="downloadFile(log, false)">{{ translate('File') }}</ion-button>
            <ion-button fill="clear" size="small" color="danger" :disabled="!log.errorLogContentId" @click="downloadFile(log, true)">{{ translate('Errors') }}</ion-button>
          </div>
        </div>
      </ion-list>

      <EmptyState
        v-if="!loading && loaded && !error && !visibleLogs.length"
        :title="translate('No imports')"
        :message="translate('Purchase order and future inventory imports from CSV uploads and NetSuite show here.')"
      />

      <ion-infinite-scroll :disabled="!hasMore" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-spinner="crescent" :loading-text="translate('Loading more imports')" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon,
  IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonListHeader, IonMenuButton, IonPage,
  IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar, onIonViewWillEnter,
} from '@ionic/vue';
import { cloudUploadOutline, documentAttachOutline, documentTextOutline, downloadOutline, refreshOutline } from 'ionicons/icons';
import { computed, reactive, ref, watch } from 'vue';
import { translate } from '@common';
import { useSeedData } from '@common/db';
import { IMPORT_CONFIGS, useImports, type ImportLog } from '@/composables/useImports';
import { useUserStore } from '@/store/user';
import SearchFilterCard from '@/components/common/SearchFilterCard.vue';
import UniformFilterLayout from '@/components/common/UniformFilterLayout.vue';
import DateFilterSelect from '@/components/common/DateFilterSelect.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import { showToast } from '@/utils';
import { downloadText } from '@/utils/download';
import { formatDateTime } from '@/utils/format';
import { statusColor } from '@/utils/statusColors';
import { errorMessage } from '@/utils/response';
import Actions from '@/authorization/actions';

const PAGE_SIZE = 20;

const seed = useSeedData();
const userStore = useUserStore();
const { fetchLogs, uploadFile, downloadLogFile, downloadTemplate } = useImports();

const uploadableConfigs = IMPORT_CONFIGS.filter((config) => config.uploadable);
const importStatuses = computed(() => seed.statusItemsByType('DataManagerLog'));
const canUpdate = computed(() => userStore.hasPermission(Actions.APP_PO_UPDATE));

const filters = reactive({ configId: 'All', statusId: 'All', createdDateFrom: '', createdDateThru: '' });
const logIdQuery = ref('');
const logs = ref<ImportLog[]>([]);
const pageIndex = ref(0);
const hasMore = ref(false);
const loading = ref(false);
const loaded = ref(false);
const error = ref('');

const uploadConfigId = ref(uploadableConfigs[0].configId);
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File>();
const uploading = ref(false);

const visibleLogs = computed(() => logs.value);

const configLabel = (configId: string) => translate(IMPORT_CONFIGS.find((config) => config.configId === configId)?.label || configId);

/** Each load takes a number; only the latest one's answer lands, and a next page under older filters is dropped. */
let loadRequest = 0;

async function load() {
  const request = ++loadRequest;
  loading.value = true;
  error.value = '';
  try {
    const rows = await fetchLogs({ ...filters, logId: logIdQuery.value.trim() }, 0, PAGE_SIZE);
    if (request !== loadRequest) return;
    logs.value = rows;
    pageIndex.value = 0;
    hasMore.value = rows.length === PAGE_SIZE;
    loaded.value = true;
  } catch (err) {
    if (request !== loadRequest) return;
    error.value = errorMessage(err, translate('Failed to load imports.'));
  } finally {
    if (request === loadRequest) loading.value = false;
  }
}

const loadingMore = ref(false);

async function loadMore(event: CustomEvent) {
  if (loadingMore.value || loading.value) return (event.target as HTMLIonInfiniteScrollElement).complete();
  const request = loadRequest;
  loadingMore.value = true;
  try {
    const rows = await fetchLogs({ ...filters, logId: logIdQuery.value.trim() }, pageIndex.value + 1, PAGE_SIZE);
    if (request !== loadRequest) return;
    logs.value = [...logs.value, ...rows];
    pageIndex.value += 1;
    hasMore.value = rows.length === PAGE_SIZE;
  } catch (err) {
    await showToast(errorMessage(err, translate('Could not load more imports. Scroll to try again.')));
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
  Object.assign(filters, { configId: 'All', statusId: 'All', createdDateFrom: '', createdDateThru: '' });
  logIdQuery.value = '';
}

function pickFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0];
}

async function upload() {
  if (!selectedFile.value) return;
  uploading.value = true;
  try {
    const logId = await uploadFile(uploadConfigId.value, selectedFile.value);
    await showToast(translate('File uploaded as import {logId}.', { logId }));
    selectedFile.value = undefined;
    if (fileInput.value) fileInput.value.value = '';
    await load();
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to upload the file.')));
  } finally {
    uploading.value = false;
  }
}

async function downloadTemplateFile() {
  try {
    downloadText(`${uploadConfigId.value}-template.csv`, await downloadTemplate(uploadConfigId.value));
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to download the template.')));
  }
}

async function downloadFile(log: ImportLog, errors: boolean) {
  const logContentId = errors ? log.errorLogContentId : log.logContentId;
  if (!logContentId) return;
  try {
    const name = (errors ? log.errorFileName : log.fileName) || `${log.logId}${errors ? '-errors' : ''}`;
    downloadText(name.endsWith('.csv') ? name : `${name}.csv`, await downloadLogFile(log.configId, logContentId));
  } catch (err) {
    await showToast(errorMessage(err, translate('Failed to download the file.')));
  }
}
</script>

<style scoped>
.upload-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer-sm);
}

.upload-row ion-select {
  flex: 1 1 16rem;
}

.file-input {
  display: none;
}

.import-row {
  --columns-desktop: 5;
  --columns-tablet: 5;
  min-height: 4rem;
  border-block-start: var(--border-medium);
  padding-inline-end: var(--spacer-sm);
}

.import-row > ion-label {
  width: 100%;
}

.import-row-end {
  display: flex;
}
</style>
