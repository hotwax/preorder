import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { dayBound } from '@/utils/format';

/**
 * The Data Manager configs this app tracks: purchase order and future inventory imports. An uploadable one names
 * the app action (src/authorization/actions) an upload needs: a future inventory file creates or moves batches.
 */
export const IMPORT_CONFIGS: { configId: string; label: string; uploadable: boolean; uploadAction?: 'APP_PO_UPDATE' | 'APP_FI_UPDATE' }[] = [
  { configId: 'IMPORT_PO', label: 'Purchase orders (CSV)', uploadable: true, uploadAction: 'APP_PO_UPDATE' },
  { configId: 'SYNC_PREORDER', label: 'Future inventory (CSV)', uploadable: true, uploadAction: 'APP_FI_UPDATE' },
  { configId: 'IMP_NS_PURCHASE_ORDER', label: 'Purchase orders (NetSuite)', uploadable: false },
  { configId: 'IMP_NS_INB_SHIPMENT', label: 'Inbound shipments (NetSuite)', uploadable: false },
];

/** The bulk updates the app watches: Data Manager imports the OMS queues for itself, not uploads. */
export const BULK_UPDATE_CONFIGS = [
  { configId: 'IMP_FI_PROMISE_DATE', label: 'Promise date changes', messageTypeId: 'FutureInventoryPromiseDateChange' },
];

export interface ImportLog {
  logId: string;
  configId: string;
  description?: string;
  statusId: string;
  createdDate?: number | string;
  createdByUserLogin?: string;
  startDateTime?: number | string;
  finishDateTime?: number | string;
  totalRecordCount?: number;
  failedRecordCount?: number;
  fileName?: string;
  logContentId?: string;
  errorFileName?: string;
  errorLogContentId?: string;
}

/** Import tracking and CSV upload, through the Data Manager endpoints. */
export function useImports() {
  /**
   * A page of import logs, newest first. `total` is the matching count when the Data Manager sends one
   * (`dataManagerLogsCount`), else undefined: then a short page is the last one.
   */
  async function fetchLogs(filters: { configId: string; statusId: string; createdDateFrom: string; createdDateThru: string; logId?: string }, pageIndex: number, pageSize: number, configs: { configId: string }[] = IMPORT_CONFIGS): Promise<{ rows: ImportLog[]; total?: number }> {
    const configIds = filters.configId && filters.configId !== 'All' ? [filters.configId] : configs.map((config) => config.configId);
    const params: Record<string, any> = { configId: configIds.join(','), configId_op: 'in', pageIndex, pageSize, orderByField: '-createdDate' };
    if (filters.logId) params.logId = filters.logId;
    if (filters.statusId && filters.statusId !== 'All') params.statusId = filters.statusId;
    if (filters.createdDateFrom) params.createdDate_from = dayBound(filters.createdDateFrom, 'start', 'timestamp');
    if (filters.createdDateThru) params.createdDate_thru = dayBound(filters.createdDateThru, 'end', 'timestamp');
    const data = await ensureOk(api({ url: 'admin/dataManager/details', method: 'get', params }), 'Failed to load imports.');
    const total = Number(data.dataManagerLogsCount);
    return { rows: data.dataManagerLogs || [], total: data.dataManagerLogsCount !== undefined && data.dataManagerLogsCount !== null && Number.isFinite(total) ? total : undefined };
  }

  /** Uploads a CSV for a config; the Data Manager queues it and returns the new log id. */
  async function uploadFile(configId: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('contentFile', file, file.name);
    form.append('fileName', file.name.replace(/\.csv$/i, ''));
    form.append('configId', configId);
    const data = await ensureOk(api({ url: 'admin/uploadDataManagerFile', method: 'post', data: form, headers: { 'Content-Type': 'multipart/form-data;' } }), 'Failed to upload the file.');
    return data.logId;
  }

  /** The CSV text of an imported or error file. */
  async function downloadLogFile(configId: string, logContentId: string): Promise<string> {
    const data = await ensureOk(api({ url: 'admin/dataManager/downloadDataManagerFile', method: 'get', params: { configId, logContentId } }), 'Failed to download the file.');
    return typeof data === 'string' ? data : (data?.csvData ?? '');
  }

  /** The config's CSV header row, from its import service's parameters. */
  async function downloadTemplate(configId: string): Promise<string> {
    const data = await ensureOk(api({ url: `admin/dataManager/${encodeURIComponent(configId)}/downloadTemplate`, method: 'get' }), 'Failed to download the template.');
    return typeof data === 'string' ? data : '';
  }

  /** How many messages of a type are received and not yet consumed: changes still to be queued as a bulk update. */
  async function countWaitingMessages(systemMessageTypeId: string): Promise<number> {
    const data = await ensureOk(api({ url: 'admin/systemMessages', method: 'get', params: { systemMessageTypeId, statusId: 'SmsgReceived', isOutgoing: 'N', pageSize: 1 } }), 'Failed to load the waiting changes.');
    return Number(data.systemMessagesCount || 0);
  }

  return { fetchLogs, uploadFile, downloadLogFile, downloadTemplate, countWaitingMessages };
}
