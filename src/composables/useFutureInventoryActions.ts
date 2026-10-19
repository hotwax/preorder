import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { readList } from '@/utils/query';
import type { FutureInventoryBatch, FutureInventoryBatchDetail } from '@/types';

const batchUrl = (id: string) => `preorder/futureInventory/${encodeURIComponent(id)}`;

/** Future inventory batch requests: one batch, its ledger and waiting lines, and the batch actions. */
export function useFutureInventoryActions() {
  async function fetchBatch(id: string): Promise<FutureInventoryBatchDetail> {
    return (await ensureOk(api({ url: batchUrl(id), method: 'get' }), 'Failed to load the batch.')).futureInventoryItem;
  }

  async function fetchLedger(id: string, pageIndex = 0, pageSize = 100) {
    return readList(await ensureOk(api({ url: `${batchUrl(id)}/details`, method: 'get', params: { pageIndex, pageSize } }), 'Failed to load the ledger.'), 'details');
  }

  async function fetchWaitingLines(id: string, pageIndex = 0, pageSize = 100) {
    return readList(await ensureOk(api({ url: `${batchUrl(id)}/lines`, method: 'get', params: { pageIndex, pageSize } }), 'Failed to load the waiting lines.'), 'lines');
  }

  /** The ACTIVE batches of a product at the store's facilities: the batches an order of that store can hold. */
  async function fetchActiveBatches(productId: string, productStoreId?: string): Promise<FutureInventoryBatch[]> {
    const data = await ensureOk(api({ url: 'preorder/futureInventoryItems', method: 'get', params: { productId, productStoreId, statusId: 'FUTURE_INV_ACTIVE', pageSize: 50 } }), 'Failed to load batches.');
    return readList<FutureInventoryBatch>(data, 'futureInventoryItems').rows;
  }

  /** Updates a batch (PUT futureInventory/{id}): one FID_ADJUSTED ledger row with a quantity change, a new promise date ('yyyy-MM-dd'), or both. */
  async function updateBatch(id: string, change: { quantityDiff?: number; promiseDate?: string; description?: string }) {
    return ensureOk(api({ url: batchUrl(id), method: 'put', data: change }), 'Failed to update the batch.');
  }

  async function cancelBatch(id: string, description?: string) {
    return ensureOk(api({ url: `${batchUrl(id)}/cancel`, method: 'post', data: { description } }), 'Failed to cancel the batch.');
  }

  /** Runs an action on each batch, counting what worked and what failed. */
  async function forEachBatch(ids: string[], action: (id: string) => Promise<any>) {
    let done = 0; let failed = 0;
    for (const id of ids) {
      try { await action(id); done++; } catch { failed++; }
    }
    return { done, failed };
  }

  return { fetchBatch, fetchLedger, fetchWaitingLines, fetchActiveBatches, updateBatch, cancelBatch, forEachBatch };
}
