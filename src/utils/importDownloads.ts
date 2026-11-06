import type { ImportLog } from '@/composables/useImports';

/** Download metadata for the original Data Manager file, which may be CSV or NetSuite JSON. */
export function importDownload(log: Pick<ImportLog, 'logId' | 'configId' | 'fileName' | 'errorFileName'>, errors: boolean) {
  const suppliedName = (errors ? log.errorFileName : log.fileName) || `${log.logId}${errors ? '-errors' : ''}`;
  const extension = log.configId === 'IMP_NS_PURCHASE_ORDER' || log.configId === 'IMP_NS_INB_SHIPMENT' ? '.json' : '.csv';
  const fileName = /\.[^./\\]+$/.test(suppliedName) ? suppliedName : `${suppliedName}${extension}`;
  const contentType = /\.json$/i.test(fileName) ? 'application/json;charset=utf-8'
    : /\.csv$/i.test(fileName) ? 'text/csv;charset=utf-8' : 'application/octet-stream';
  return { fileName, contentType };
}
