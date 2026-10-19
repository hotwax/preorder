import { api } from '@common';
import { ensureOk } from '@/utils/response';
import { readList } from '@/utils/query';
import { PREORDER_EMAIL_CATALOG, toEmailSettingPayload, toEmailSettingRows } from '@/utils/emailSettings';
import type { CommunicationEventRow, EmailGateway, EmailSettingChanges, PreorderEmailSetting } from '@/types';

const settingsUrl = (productStoreId: string) => `oms/productStoreEmailSettings/${encodeURIComponent(productStoreId)}/emailSettings`;

/** An entity list response: Moqui answers an entity list with the rows themselves. */
const rowsOf = (data: any): any[] => (Array.isArray(data) ? data : []);

/** Pre-order email settings (on/off, subject, addresses and gateway per email type) and the emails OMS has sent. */
export function useCommunications() {
  /** The catalog with the email types it names (admin/enums), joined with the store's settings. */
  async function fetchEmailSettings(productStoreId: string): Promise<PreorderEmailSetting[]> {
    const [enums, settings] = await Promise.all([
      ensureOk(api({ url: 'admin/enums', method: 'get', params: { enumTypeId: `${PREORDER_EMAIL_CATALOG},PRDS_EMAIL`, enumTypeId_op: 'in' } }), 'Failed to load email settings.'),
      ensureOk(api({ url: settingsUrl(productStoreId), method: 'get' }), 'Failed to load email settings.'),
    ]);
    return toEmailSettingRows(rowsOf(enums), rowsOf(settings));
  }

  /**
   * Saves a store's setting for an email type the catalog lists (the screen only offers those): the changed fields, read
   * against the store's current setting, so one the store has no setting for yet gets one named after its email type.
   */
  async function updateEmailSetting(productStoreId: string, emailType: string, changes: EmailSettingChanges) {
    const existing = rowsOf(await ensureOk(api({ url: settingsUrl(productStoreId), method: 'get', params: { emailType } }), 'Failed to update the email setting.'));
    let emailTypeName: string | undefined;
    if (!existing.length && changes.enabled !== false) {
      const [emailTypeEnum] = rowsOf(await ensureOk(api({ url: 'admin/enums', method: 'get', params: { enumId: emailType } }), 'Failed to update the email setting.'));
      emailTypeName = emailTypeEnum?.enumName || emailTypeEnum?.description;
    }
    const payload = toEmailSettingPayload(changes, existing.length > 0, emailTypeName);
    if (!payload) return;
    return ensureOk(api({ url: `${settingsUrl(productStoreId)}/${encodeURIComponent(emailType)}`, method: 'put', data: payload }), 'Failed to update the email setting.');
  }

  const setEmailEnabled = (productStoreId: string, emailType: string, enabled: boolean) => updateEmailSetting(productStoreId, emailType, { enabled });

  /** The email gateways (Unigate remotes an email setting uses) a setting can be sent through, by description. */
  async function fetchEmailGateways(): Promise<EmailGateway[]> {
    const data = await ensureOk(api({ url: 'oms/emailGateways', method: 'get' }), 'Failed to load email gateways.');
    return rowsOf(data?.gateways)
      .map((gateway) => ({ systemMessageRemoteId: gateway.systemMessageRemoteId, description: gateway.description || gateway.systemMessageRemoteId }))
      .sort((a, b) => a.description.localeCompare(b.description));
  }

  /** A page of the store's email log; `params` carries productStoreId, which the log needs, and its filters. */
  async function fetchEvents(params: Record<string, any>) {
    const data = await ensureOk(api({ url: 'oms/communicationEvents', method: 'get', params }), 'Failed to load communication events.');
    const { rows } = readList<CommunicationEventRow>(data, 'communicationEventList');
    const total = Number(data?.communicationEventsCount ?? rows.length);
    return { rows, total: Number.isFinite(total) ? total : rows.length };
  }

  async function fetchCounts(productStoreId: string, fromDate: string): Promise<{ emailType?: string; statusId?: string; count: number }[]> {
    const data = await ensureOk(api({ url: 'oms/communicationEvents/counts', method: 'get', params: { productStoreId, fromDate } }), 'Failed to load email counts.');
    return data.counts || [];
  }

  return { fetchEmailSettings, setEmailEnabled, updateEmailSetting, fetchEmailGateways, fetchEvents, fetchCounts };
}
