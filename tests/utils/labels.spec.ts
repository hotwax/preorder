import { describe, expect, it } from 'vitest';
import { formatDateRange, formatQuantity, futureInventoryTypeLabel, isPast, shownPartyId } from '@/utils/labels';

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

  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity(12)).toBe(12);
    expect(formatQuantity('12.500')).toBe(12.5);
    expect(formatQuantity(undefined)).toBe(0);
  });

  it('knows a past date', () => {
    expect(isPast(Date.now() - 1000)).toBe(true);
    expect(isPast(Date.now() + 86400000)).toBe(false);
    expect(isPast(undefined)).toBe(false);
  });
});
