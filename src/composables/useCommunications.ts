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
  fromAddress?: string;
  ccAddress?: string;
  bccAddress?: string;
  systemMessageRemoteId?: string;
  gatewayAuthId?: string;
  gatewayConfigured: boolean;
}

/** The fields of a setting a save changes; an empty string clears one. */
export type EmailSettingChanges = Partial<Record<'subject' | 'fromAddress' | 'ccAddress' | 'bccAddress' | 'systemMessageRemoteId' | 'gatewayAuthId', string>>
  & { enabled?: boolean };

/** A Unigate remote some store's email setting is sent through. */
export interface EmailGateway {
  systemMessageRemoteId: string;
  description: string;
  sendUrl?: string;
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

/** Pre-order email settings (on/off, subject, addresses and gateway per email type) and the emails OMS has sent. */
export function useCommunications() {
  async function fetchEmailSettings(productStoreId: string): Promise<PreorderEmailSetting[]> {
    const data = await ensureOk(api({ url: 'preorder/emailSettings', method: 'get', params: { productStoreId } }), 'Failed to load email settings.');
    return data.emailSettings || [];
  }

  async function updateEmailSetting(productStoreId: string, emailType: string, changes: EmailSettingChanges) {
    return ensureOk(api({ url: `preorder/emailSettings/${encodeURIComponent(emailType)}`, method: 'put', data: { productStoreId, ...changes } }), 'Failed to update the email setting.');
  }

  const setEmailEnabled = (productStoreId: string, emailType: string, enabled: boolean) => updateEmailSetting(productStoreId, emailType, { enabled });

  async function fetchEmailGateways(): Promise<EmailGateway[]> {
    const data = await ensureOk(api({ url: 'preorder/emailGateways', method: 'get' }), 'Failed to load email gateways.');
    return data.gateways || [];
  }

  async function fetchEvents(params: Record<string, any>) {
    const data = await ensureOk(api({ url: 'preorder/communicationEvents', method: 'get', params }), 'Failed to load communication events.');
    return readList<CommunicationEventRow>(data, 'communicationEvents');
  }

  async function fetchCounts(productStoreId: string, fromDate: string): Promise<{ emailType?: string; statusId?: string; count: number }[]> {
    const data = await ensureOk(api({ url: 'preorder/communicationEventCounts', method: 'get', params: { productStoreId, fromDate } }), 'Failed to load email counts.');
    return data.counts || [];
  }

  return { fetchEmailSettings, setEmailEnabled, updateEmailSetting, fetchEmailGateways, fetchEvents, fetchCounts };
}
