import { api } from '@common';
import { ensureOk } from '@/utils/response';
import type { FutureInventoryBatch } from '@/types';

export interface PreorderDashboard {
  openUnits: number;
  openLines: number;
  openOrders: number;
  openUnitsByType: Record<string, number>;
  parkedLines: number;
  supply: { activeBatches: number; quantityOnHand: number; availableToPromise: number; reserved: number };
  arrivingSoon: { count: number; quantity: number; reserved: number; batches: FutureInventoryBatch[] };
  pastDue: { count: number; batches: FutureInventoryBatch[] };
  exceptions: { count: number; batches: FutureInventoryBatch[] };
  overcommitted: { count: number; batches: FutureInventoryBatch[] };
  noPromiseDate: { count: number; lines: { orderId: string; orderItemSeqId: string; orderName?: string; productId: string; orderDate?: number | string }[] };
  demandTrend: { date: string; units: number }[];
  delayEmails: { count: number; trend: { date: string; count: number }[] };
  promiseDateChanges: number;
  topProducts: { productId: string; productName?: string; openUnits: number }[];
}

/** The dashboard's figures for a store, in one request. */
export function useDashboard() {
  async function fetchDashboard(productStoreId: string, days = 30, arrivalDays = 7): Promise<PreorderDashboard> {
    return ensureOk(api({ url: 'preorder/dashboard', method: 'get', params: { productStoreId, days, arrivalDays } }), 'Failed to load the dashboard.');
  }
  return { fetchDashboard };
}
