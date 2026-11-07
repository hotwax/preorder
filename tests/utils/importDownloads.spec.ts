import { expect, it } from 'vitest';
import { importDownload } from '@/utils/importDownloads';

it.each([
  [{ logId: '111645', configId: 'IMP_NS_PURCHASE_ORDER', fileName: 'orders.json' }, false, 'orders.json', 'application/json;charset=utf-8'],
  [{ logId: '111645', configId: 'IMP_NS_PURCHASE_ORDER', errorFileName: 'Error_orders.json' }, true, 'Error_orders.json', 'application/json;charset=utf-8'],
  [{ logId: '111833', configId: 'IMPORT_PO', fileName: 'Batch_updates.csv' }, false, 'Batch_updates.csv', 'text/csv;charset=utf-8'],
  [{ logId: '111833', configId: 'IMPORT_PO', fileName: 'Batch_updates' }, false, 'Batch_updates.csv', 'text/csv;charset=utf-8'],
  [{ logId: '111645', configId: 'IMP_NS_PURCHASE_ORDER' }, true, '111645-errors.json', 'application/json;charset=utf-8'],
  [{ logId: '1', configId: 'IMP_NS_PURCHASE_ORDER', fileName: 'orders.CSV' }, false, 'orders.CSV', 'text/csv;charset=utf-8'],
  [{ logId: '1', configId: 'IMPORT_PO', fileName: 'source.xml' }, false, 'source.xml', 'application/octet-stream'],
])('preserves import file names and formats: %j', (log, errors, fileName, contentType) => {
  expect(importDownload(log as any, errors as boolean)).toEqual({ fileName, contentType });
});
