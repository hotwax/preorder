import type { EmailSettingChanges, PreorderEmailSetting } from '@/types';

/** The enumeration type of the pre-order email catalog: one entry per email type the app lists, in sequenceNum order. */
export const PREORDER_EMAIL_CATALOG = 'PreorderAppEmail';

/** The ProductStoreEmailSetting fields a save may change; an empty string clears one. */
const SETTING_FIELDS = ['subject', 'fromAddress', 'ccAddress', 'bccAddress', 'systemMessageRemoteId', 'gatewayAuthId'] as const;

const bySequence = (a: any, b: any) => (Number(a.sequenceNum ?? Infinity) - Number(b.sequenceNum ?? Infinity)) || String(a.enumId).localeCompare(String(b.enumId));

/**
 * A store's pre-order email settings: one row per PreorderAppEmail catalog entry (in sequenceNum order) that names an
 * email type, joined with that type's own enumeration (`enums` holds both) and the store's ProductStoreEmailSetting rows.
 */
export function toEmailSettingRows(enums: any[], settings: any[]): PreorderEmailSetting[] {
  const enumById = new Map<string, any>(enums.map((row) => [row.enumId, row]));
  const settingByType = new Map<string, any>(settings.map((row) => [row.emailType, row]));
  return enums
    .filter((entry) => entry.enumTypeId === PREORDER_EMAIL_CATALOG && entry.relatedEnumId)
    .sort(bySequence)
    .map((entry) => {
      const setting = settingByType.get(entry.relatedEnumId);
      return {
        emailType: entry.relatedEnumId,
        description: enumById.get(entry.relatedEnumId)?.description,
        wired: entry.optionIndicator === 'Y',
        triggerDescription: entry.description,
        exists: !!setting,
        enabled: !!setting && setting.disabled !== 'Y',
        subject: setting?.subject,
        fromAddress: setting?.fromAddress,
        ccAddress: setting?.ccAddress,
        bccAddress: setting?.bccAddress,
        systemMessageRemoteId: setting?.systemMessageRemoteId,
        gatewayAuthId: setting?.gatewayAuthId,
        gatewayConfigured: !!setting?.systemMessageRemoteId && !!setting?.gatewayAuthId,
      };
    });
}

/**
 * The ProductStoreEmailSetting fields a save writes, or null when it writes nothing. Only the given fields change, an
 * empty string clearing one, and `enabled` is `disabled` N or Y. A store with no setting for the type gets one, turned on,
 * with the email type's name as its subject unless one is given; turning off a type the store has no setting for writes
 * nothing, since a missing setting sends nothing either.
 */
export function toEmailSettingPayload(changes: EmailSettingChanges, exists: boolean, emailTypeName?: string): Record<string, string> | null {
  const payload: Record<string, string> = {};
  SETTING_FIELDS.forEach((field) => {
    const value = changes[field];
    if (value !== undefined && value !== null) payload[field] = String(value).trim();
  });
  if (changes.enabled !== undefined) payload.disabled = changes.enabled ? 'N' : 'Y';
  if (exists) return Object.keys(payload).length ? payload : null;
  if (changes.enabled === false) return null;
  return { ...payload, subject: payload.subject || emailTypeName || '', disabled: 'N' };
}

/**
 * The payload fields a saved setting, read back after the save, doesn't hold: a backend without a field drops it and
 * still answers 200 (ProductStoreEmailSetting.disabled before oms#1195, preorder-maarg#97). `disabled` compares as the
 * screen reads it: anything but Y is on.
 */
export function unsavedSettingFields(payload: Record<string, string>, saved: Record<string, any> | undefined): string[] {
  return Object.keys(payload).filter((field) => {
    if (field === 'disabled') return (payload.disabled === 'Y') !== (saved?.disabled === 'Y');
    return String(saved?.[field] ?? '').trim() !== payload[field];
  });
}
