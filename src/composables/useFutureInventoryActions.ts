import { api } from '@common';
import { ensureOk, ensureResponse } from '@/utils/response';
import { readEntityList, whereEquals, whereIn, withPaging } from '@/utils/query';
import { useStoreFacilitiesStore } from '@/store/storeFacilities';
import type { FutureInventoryBatch, FutureInventoryBatchDetail, FutureInventoryLedgerRow, FutureInventoryWaitingLine } from '@/types';

const batchUrl = (id: string) => `oms/futureInventoryItems/${encodeURIComponent(id)}`;

/** Future inventory batch requests: one batch, its ledger and waiting lines, and the batch actions. */
export function useFutureInventoryActions() {
  /** One batch (the entity with its product and purchase order header and line), plus the units reserved on it. */
  async function fetchBatch(id: string): Promise<FutureInventoryBatchDetail> {
    const batch = await ensureOk(api({ url: batchUrl(id), method: 'get' }), 'Failed to load the batch.');
    return { ...batch, reservedQuantity: Number(batch.quantityOnOrderTotal || 0) - Number(batch.availableToPromiseTotal || 0) };
  }

  /** The batch's ledger, newest first. */
  async function fetchLedger(id: string, pageIndex = 0, pageSize = 100) {
    const params: Record<string, string | number> = {};
    withPaging(params, { orderBy: '-createdDate', tieBreaker: '-futureInventoryItemDetailSeqId', pageIndex, pageSize });
    const resp = await ensureResponse(api({ url: `${batchUrl(id)}/details`, method: 'get', params }), 'Failed to load the ledger.');
    return readEntityList<FutureInventoryLedgerRow>(resp);
  }

  /** The order lines still waiting on the batch, oldest order first. */
  async function fetchWaitingLines(id: string, pageIndex = 0, pageSize = 100) {
    const params: Record<string, string | number> = {};
    withPaging(params, { orderBy: 'orderDate', tieBreaker: 'orderId,orderItemSeqId', pageIndex, pageSize });
    const resp = await ensureResponse(api({ url: `${batchUrl(id)}/lines`, method: 'get', params }), 'Failed to load the waiting lines.');
    return readEntityList<FutureInventoryWaitingLine>(resp);
  }

  /** The ACTIVE batches of a product at the store's facilities (every facility when it has none): the batches an order of that store can hold. */
  async function fetchActiveBatches(productId: string, productStoreId?: string): Promise<FutureInventoryBatch[]> {
    const { facilityIds } = await useStoreFacilitiesStore().scopeFor(productStoreId);
    const params: Record<string, string | number> = {};
    whereEquals(params, 'productId', productId);
    whereEquals(params, 'statusId', 'FUTURE_INV_ACTIVE');
    whereIn(params, 'facilityId', facilityIds);
    withPaging(params, { orderBy: 'promiseDate', tieBreaker: 'futureInventoryItemId', pageIndex: 0, pageSize: 50 });
    const resp = await ensureResponse(api({ url: 'oms/futureInventoryItems', method: 'get', params }), 'Failed to load batches.');
    return readEntityList<FutureInventoryBatch>(resp).rows;
  }

  /** Updates a batch: one ledger row with a quantity change (`quantityDiff`), a new promise date ('yyyy-MM-dd'), or both. */
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

