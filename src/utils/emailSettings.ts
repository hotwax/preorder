import type { PreorderEmailSetting } from '@/composables/useCommunications';

/**
 * One row of the email settings list: a catalog entry (the email type, whether something sends it, when it is sent) joined to the
 * store's `ProductStoreEmailSetting` row, if it has one. `exists` is a row; `enabled` is a row that is not disabled;
 * `gatewayConfigured` is a row naming both a remote and gateway credentials.
 */
export function toEmailSetting(
  entry: { relatedEnumId?: string; optionIndicator?: string; description?: string },
  typeDescription: string | undefined,
  setting?: Record<string, any>,
): PreorderEmailSetting {
  return {
    emailType: entry.relatedEnumId as string,
    description: typeDescription,
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
    gatewayConfigured: !!(setting?.systemMessageRemoteId && setting?.gatewayAuthId),
  };
}

/** The fields of a save, with an empty string sent as null so the field clears (the store resource leaves an empty string alone). */
export function toEntityFields(fields: Record<string, string | undefined>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  Object.entries(fields).forEach(([key, value]) => { if (value !== undefined) out[key] = value === '' ? null : value; });
  return out;
}
