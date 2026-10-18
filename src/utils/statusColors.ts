import { commonUtil } from '@common';

/**
 * Colors for the statuses this app shows that common's status map does not know: future inventory
 * batches, purchase shipments and Data Manager imports. Anything else falls back to common's map.
 */
const STATUS_COLORS: Record<string, string> = {
  FUTURE_INV_ACTIVE: 'success',
  FUTURE_INV_EXPIRED: 'warning',
  FUTURE_INV_RECEIVED: 'medium',
  FUTURE_INV_CANCELLED: 'danger',
  FUTURE_INV_INACTIVE: 'medium',
  PURCH_SHIP_CREATED: 'medium',
  PURCH_SHIP_SHIPPED: 'primary',
  PURCH_SHIP_RECEIVED: 'success',
  PURCH_SHIP_CANCELLED: 'danger',
  DmlsPending: 'medium',
  DmlsQueued: 'medium',
  DmlsRunning: 'primary',
  DmlsFinished: 'success',
  DmlsFailed: 'danger',
  DmlsCrashed: 'danger',
  DmlsCancelled: 'medium',
  DmlsCancelRequested: 'warning',
  COM_COMPLETE: 'success',
  COM_BOUNCED: 'danger',
  COM_IN_PROGRESS: 'primary',
};

export function statusColor(statusId?: string): string {
  if (!statusId) return 'medium';
  return STATUS_COLORS[statusId] || commonUtil.getStatusColor(statusId);
}
