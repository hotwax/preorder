import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { daysOverdue, formatDateRange, futureInventoryTypeLabel, overdueLabel, shownPartyId } from '@/utils/labels';

describe('labels', () => {
  it('shows a party id, but not the _NA_ placeholder', () => {
    expect(shownPartyId('CUST_1')).toBe('CUST_1');
    expect(shownPartyId('_NA_')).toBeUndefined();
    expect(shownPartyId(undefined)).toBeUndefined();
  });

  it('names future inventory types, falling back to the id', () => {
    expect(futureInventoryTypeLabel('FIT_PRE_ORDER')).toBe('Pre-order');
    expect(futureInventoryTypeLabel('FIT_BACK_ORDER')).toBe('Back-order');
    expect(futureInventoryTypeLabel('OTHER')).toBe('OTHER');
    expect(futureInventoryTypeLabel('FIT_NEW', 'New supply')).toBe('New supply');
    expect(futureInventoryTypeLabel('FIT_PRE_ORDER', 'Pre-Order Supply (New Style)')).toBe('Pre-order');
  });

  it('shows one date when a range has equal or missing ends', () => {
    const day = Date.UTC(2026, 10, 2, 12);
    expect(formatDateRange(day, day)).toBe(formatDateRange(day, undefined));
    expect(formatDateRange(undefined, day)).toBe(formatDateRange(day));
    expect(formatDateRange(day, day + 86400000 * 30)).toContain(' - ');
  });

  it('counts the calendar days a date has passed by', () => {
    expect(daysOverdue(DateTime.now().minus({ days: 3 }).toMillis())).toBe(3);
    expect(daysOverdue(DateTime.now().toMillis())).toBe(0);
    expect(daysOverdue(DateTime.now().plus({ days: 1 }).toMillis())).toBe(0);
    expect(daysOverdue(undefined)).toBe(0);
  });

  it('says how late a date is, in the plural form of its day count', () => {
    expect(overdueLabel(1)).toBe('Overdue by 1 day');
    expect(overdueLabel(3)).toBe('Overdue by 3 days');
    expect(overdueLabel(1200)).toBe('Overdue by 1,200 days');
  });
});
