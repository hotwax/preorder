import { api } from '@common';
import { ensureOk } from '@/utils/response';

/** The Data Manager configs this app tracks: purchase order and future inventory imports. */
export const IMPORT_CONFIGS = [
  { configId: 'IMPORT_PO', label: 'Purchase orders (CSV)', uploadable: true },
  { configId: 'SYNC_PREORDER', label: 'Future inventory (CSV)', uploadable: true },
  { configId: 'IMP_NS_PURCHASE_ORDER', label: 'Purchase orders (NetSuite)', uploadable: false },
  { configId: 'IMP_NS_INB_SHIPMENT', label: 'Inbound shipments (NetSuite)', uploadable: false },
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
  async function fetchLogs(filters: { configId: string; statusId: string; createdDateFrom: string; createdDateThru: string }, pageIndex: number, pageSize: number): Promise<ImportLog[]> {
    const configIds = filters.configId && filters.configId !== 'All' ? [filters.configId] : IMPORT_CONFIGS.map((config) => config.configId);
    const params: Record<string, any> = { configId: configIds.join(','), configId_op: 'in', pageIndex, pageSize, orderByField: '-createdDate' };
    if (filters.statusId && filters.statusId !== 'All') params.statusId = filters.statusId;
    if (filters.createdDateFrom) params.createdDate_from = `${filters.createdDateFrom} 00:00:00`;
    if (filters.createdDateThru) params.createdDate_thru = `${filters.createdDateThru} 23:59:59`;
    const data = await ensureOk(api({ url: 'admin/dataManager/details', method: 'get', params }), 'Failed to load imports.');
    return data.dataManagerLogs || [];
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

  return { fetchLogs, uploadFile, downloadLogFile, downloadTemplate };
}
