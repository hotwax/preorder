import { api } from '@common';
import { ensureOk, ensureResponse } from '@/utils/response';
import { readEntityList, whereEquals, whereIn, withPaging } from '@/utils/query';
import { toEmailSetting, toEntityFields } from '@/utils/emailSettings';

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

const emailSettingUrl = (productStoreId: string, emailType?: string) =>
  `oms/productStoreEmailSettings/${encodeURIComponent(productStoreId)}/emailSettings${emailType ? `/${encodeURIComponent(emailType)}` : ''}`;

/** The email types the app manages: `PreorderAppEmail` catalog rows (relatedEnumId is the email type, optionIndicator Y that something sends it). */
async function fetchCatalog() {
  const params: Record<string, string | number> = {};
  whereEquals(params, 'enumTypeId', 'PreorderAppEmail');
  withPaging(params, { orderBy: 'sequenceNum', tieBreaker: 'enumId', pageIndex: 0, pageSize: 100 });
  const catalog = readEntityList<{ enumId: string; relatedEnumId?: string; optionIndicator?: string; description?: string }>(
    await ensureResponse(api({ url: 'admin/enums', method: 'get', params }), 'Failed to load the email catalog.')).rows;
  return catalog.filter((entry) => entry.relatedEnumId);
}

/**
 * Pre-order email settings (on/off, subject, addresses and gateway per email type) and the emails OMS has sent. A store's
 * settings are `ProductStoreEmailSetting` rows read through `oms/productStoreEmailSettings`; the catalog says which email
 * types exist and which are wired. `enabled` reads the setting's `disabled` flag, which the entity only carries once the
 * order email queue (oms#1195) is in: until then every existing setting reads as enabled and a toggle changes nothing.
 */
export function useCommunications() {
  async function fetchEmailSettings(productStoreId: string): Promise<PreorderEmailSetting[]> {
    const catalog = await fetchCatalog();
    const types = catalog.map((entry) => entry.relatedEnumId as string);
    if (!types.length) return [];
    const typeParams: Record<string, string | number> = { pageSize: 100 };
    whereIn(typeParams, 'enumId', types);
    const settingParams: Record<string, string | number> = { pageSize: 100 };
    whereIn(settingParams, 'emailType', types);
    const [typeRows, settingRows] = await Promise.all([
      ensureResponse(api({ url: 'admin/enums', method: 'get', params: typeParams }), 'Failed to load the email types.'),
      ensureResponse(api({ url: emailSettingUrl(productStoreId), method: 'get', params: settingParams }), 'Failed to load email settings.'),
    ]);
    const descriptionByType = new Map(readEntityList<{ enumId: string; description?: string }>(typeRows).rows.map((row) => [row.enumId, row.description]));
    const settingByType = new Map(readEntityList<any>(settingRows).rows.map((row) => [row.emailType, row]));
    return catalog.map((entry) => toEmailSetting(entry, descriptionByType.get(entry.relatedEnumId as string), settingByType.get(entry.relatedEnumId as string)));
  }

  /**
   * Changes the fields given and no others; an empty string clears one. A store with no setting for the type gets one, with the
   * type's name as its subject unless one is given, and enabled unless `enabled` is false.
   */
  async function updateEmailSetting(productStoreId: string, emailType: string, changes: EmailSettingChanges) {
    const existing = readEntityList<any>(await ensureResponse(api({ url: emailSettingUrl(productStoreId), method: 'get', params: { emailType } }), 'Failed to load the email setting.')).rows[0];
    const { enabled, ...fields } = changes;
    const data: Record<string, any> = { ...toEntityFields(fields) };
    if (enabled !== undefined) data.disabled = enabled ? 'N' : 'Y';
    if (!existing) {
      if (enabled === false) return { emailType, enabled: false };
      if (data.subject === undefined) {
        const type = readEntityList<{ enumName?: string; description?: string }>(await ensureResponse(api({ url: 'admin/enums', method: 'get', params: { enumId: emailType } }), 'Failed to load the email type.')).rows[0];
        data.subject = type?.enumName || type?.description || emailType;
      }
      if (enabled === undefined) data.disabled = 'N';
    }
    await ensureOk(api({ url: emailSettingUrl(productStoreId, emailType), method: 'put', data }), 'Failed to update the email setting.');
    return { emailType, enabled: data.disabled ? data.disabled !== 'Y' : existing?.disabled !== 'Y' };
  }

  const setEmailEnabled = (productStoreId: string, emailType: string, enabled: boolean) => updateEmailSetting(productStoreId, emailType, { enabled });

  /** The Unigate remotes a setting can be sent through, by id and description only. */
  async function fetchEmailGateways(): Promise<EmailGateway[]> {
    const data = await ensureOk(api({ url: 'oms/emailGateways', method: 'get' }), 'Failed to load email gateways.');
    return data.gateways || [];
  }

  /** The store's email log (`oms/communicationEvents` with a store, newest first) and its total. */
  async function fetchEvents(params: Record<string, any>) {
    const data = await ensureOk(api({ url: 'oms/communicationEvents', method: 'get', params }), 'Failed to load communication events.');
    const rows: CommunicationEventRow[] = Array.isArray(data?.communicationEventList) ? data.communicationEventList : [];
    const total = Number(data?.communicationEventsCount ?? rows.length);
    return { rows, total: Number.isFinite(total) ? total : rows.length };
  }

  async function fetchCounts(productStoreId: string, fromDate: string): Promise<{ emailType?: string; statusId?: string; count: number }[]> {
    const data = await ensureOk(api({ url: 'oms/communicationEvents/counts', method: 'get', params: { productStoreId, fromDate } }), 'Failed to load email counts.');
    return data.counts || [];
  }

  return { fetchEmailSettings, setEmailEnabled, updateEmailSetting, fetchEmailGateways, fetchEvents, fetchCounts };
}
