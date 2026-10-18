import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { readList } from '@/utils/query';

export interface PreorderEmailSetting {
  emailType: string;
  description?: string;
  wired: boolean;
  triggerDescription?: string;
  exists: boolean;
  enabled: boolean;
  subject?: string;
  systemMessageRemoteId?: string;
  gatewayAuthId?: string;
  gatewayConfigured: boolean;
}

export interface CommunicationEventRow {
  communicationEventId: string;
  emailType?: string;
  statusId?: string;
  datetimeStarted?: number | string;
  subject?: string;
  toString?: string;
  partyIdTo?: string;
  orderId?: string;
}

/** Pre-order email settings (the on/off switch per email type) and the emails OMS has sent. */
export function useCommunications() {
  async function fetchEmailSettings(productStoreId: string): Promise<PreorderEmailSetting[]> {
    const data = await ensureOk(api({ url: 'preorder/emailSettings', method: 'get', params: { productStoreId } }), 'Failed to load email settings.');
    return data.emailSettings || [];
  }

  async function setEmailEnabled(productStoreId: string, emailType: string, enabled: boolean) {
    return ensureOk(api({ url: `preorder/emailSettings/${encodeURIComponent(emailType)}`, method: 'post', data: { productStoreId, enabled } }), 'Failed to update the email setting.');
  }

  async function fetchEvents(params: Record<string, any>) {
    const data = await ensureOk(api({ url: 'preorder/communicationEvents', method: 'get', params }), 'Failed to load communication events.');
    return readList<CommunicationEventRow>(data, 'communicationEvents');
  }

  async function fetchCounts(productStoreId: string, fromDate: string): Promise<{ emailType?: string; statusId?: string; count: number }[]> {
    const data = await ensureOk(api({ url: 'preorder/communicationEventCounts', method: 'get', params: { productStoreId, fromDate } }), 'Failed to load email counts.');
    return data.counts || [];
  }

  return { fetchEmailSettings, setEmailEnabled, fetchEvents, fetchCounts };
}
