import { describe, expect, it } from 'vitest';
import { toEmailSettingPayload, toEmailSettingRows } from '@/utils/emailSettings';

describe('email setting rows', () => {
  const enums = [
    { enumId: 'PAE_BACKORDER', enumTypeId: 'PreorderAppEmail', sequenceNum: 2, relatedEnumId: 'PRDS_ODR_BACKORDER', optionIndicator: 'N', description: 'Not sent yet' },
    { enumId: 'PAE_DATE_CHANGE', enumTypeId: 'PreorderAppEmail', sequenceNum: 1, relatedEnumId: 'PREORDER_DATE_CHANGE', optionIndicator: 'Y', description: 'Sent when a promise date moves' },
    { enumId: 'PAE_EMPTY', enumTypeId: 'PreorderAppEmail', sequenceNum: 3 },
    { enumId: 'PREORDER_DATE_CHANGE', enumTypeId: 'PRDS_EMAIL', enumName: 'Pre-Order Delivery Date Change', description: 'Date change email' },
    { enumId: 'PRDS_ODR_BACKORDER', enumTypeId: 'PRDS_EMAIL', description: 'Back-order email' },
  ];

  it('lists each catalog entry in sequence, joined with its email type and the store setting', () => {
    const rows = toEmailSettingRows(enums, [
      { productStoreId: 'STORE', emailType: 'PREORDER_DATE_CHANGE', subject: 'Your date moved', systemMessageRemoteId: 'UNIGATE', gatewayAuthId: 'AUTH', disabled: 'N' },
    ]);
    expect(rows.map((row) => row.emailType)).toEqual(['PREORDER_DATE_CHANGE', 'PRDS_ODR_BACKORDER']);
    expect(rows[0]).toMatchObject({
      description: 'Date change email', wired: true, triggerDescription: 'Sent when a promise date moves', exists: true, enabled: true,
      subject: 'Your date moved', systemMessageRemoteId: 'UNIGATE', gatewayAuthId: 'AUTH', gatewayConfigured: true,
    });
    expect(rows[1]).toMatchObject({ description: 'Back-order email', wired: false, exists: false, enabled: false, gatewayConfigured: false });
  });

  it('shows a disabled setting off, and a gateway without its auth ID as not set', () => {
    const [row] = toEmailSettingRows(enums, [{ emailType: 'PREORDER_DATE_CHANGE', disabled: 'Y', systemMessageRemoteId: 'UNIGATE' }]);
    expect(row).toMatchObject({ exists: true, enabled: false, gatewayConfigured: false });
  });
});

describe('email setting payload', () => {
  it('writes only the changed fields on a setting the store has, with enabled as disabled N or Y', () => {
    expect(toEmailSettingPayload({ subject: ' New subject ', ccAddress: '' }, true)).toEqual({ subject: 'New subject', ccAddress: '' });
    expect(toEmailSettingPayload({ enabled: false }, true)).toEqual({ disabled: 'Y' });
    expect(toEmailSettingPayload({ enabled: true }, true)).toEqual({ disabled: 'N' });
    expect(toEmailSettingPayload({}, true)).toBeNull();
  });

  it("creates a setting turned on, named after its email type unless a subject is given", () => {
    expect(toEmailSettingPayload({ enabled: true }, false, 'Pre-Order Delivery Date Change')).toEqual({ subject: 'Pre-Order Delivery Date Change', disabled: 'N' });
    expect(toEmailSettingPayload({ subject: 'Mine', fromAddress: 'a@b.co' }, false, 'Name')).toEqual({ subject: 'Mine', fromAddress: 'a@b.co', disabled: 'N' });
  });

  it('writes nothing to turn off a type the store has no setting for', () => {
    expect(toEmailSettingPayload({ enabled: false }, false, 'Name')).toBeNull();
  });
});
