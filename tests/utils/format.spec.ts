import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTime, Settings } from 'luxon';
import { translate } from '@common/core/i18n';
import {
  countParams, dayBound, daysFromToday, formatQuantity, formatRelativeDay, setUserZone, toDateInputValue, toDay, todayValue, userZone,
} from '@/utils/format';

describe('day boundaries', () => {
  it("bounds a day in the user's time zone, written for each API", () => {
    expect(dayBound('2026-11-30', 'start', 'iso', 'Asia/Kolkata')).toBe('2026-11-29T18:30:00.000Z');
    expect(dayBound('2026-11-30', 'end', 'iso', 'Asia/Kolkata')).toBe('2026-11-30T18:29:59.999Z');
    expect(dayBound('2026-11-30', 'start', 'timestamp', 'America/New_York')).toBe('2026-11-30 00:00:00.000');
    expect(dayBound('2026-11-30', 'end', 'timestamp', 'America/New_York')).toBe('2026-11-30 23:59:59.999');
    expect(dayBound('2026-11-30', 'end', 'date', 'America/New_York')).toBe('2026-11-30');
  });

  it('takes a moment as the day it falls on in the zone', () => {
    // 02:00 UTC on Dec 1 is still Nov 30 in New York
    const moment = DateTime.fromISO('2026-12-01T02:00:00Z');
    expect(dayBound(moment, 'start', 'date', 'America/New_York')).toBe('2026-11-30');
    expect(dayBound(moment.toMillis(), 'start', 'date', 'Asia/Kolkata')).toBe('2026-12-01');
    expect(dayBound('2026-12-01T02:00:00Z', 'end', 'iso', 'America/New_York')).toBe('2026-12-01T04:59:59.999Z');
  });

  it('gives nothing for an empty or unreadable day', () => {
    expect(dayBound('', 'start', 'iso')).toBe('');
    expect(dayBound(undefined, 'end', 'date')).toBe('');
    expect(dayBound('not a date', 'start', 'timestamp')).toBe('');
    expect(toDay('2026-02-30')).toBeUndefined();
  });

  it("is today in the user's time zone", () => {
    expect(todayValue('UTC')).toBe(DateTime.utc().toISODate());
    expect(toDateInputValue('2026-11-30T18:30:00Z')).toBe(dayBound('2026-11-30T18:30:00Z', 'start', 'date'));
  });
});

describe('relative days', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T23:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts calendar days, not hours', () => {
    // 17 hours ago in UTC is still yesterday by the calendar, and 1 hour ahead is tomorrow
    expect(daysFromToday('2026-10-19T06:00:00Z', 'UTC')).toBe(0);
    expect(daysFromToday('2026-10-18T23:30:00Z', 'UTC')).toBe(-1);
    expect(daysFromToday('2026-10-20T00:30:00Z', 'UTC')).toBe(1);
    expect(daysFromToday('2026-10-16', 'UTC')).toBe(-3);
    expect(daysFromToday(undefined, 'UTC')).toBeUndefined();
  });

  it("follows the user's time zone", () => {
    // 23:00 UTC on Oct 19 is already Oct 20 in Kolkata
    expect(daysFromToday('2026-10-20', 'Asia/Kolkata')).toBe(0);
    expect(daysFromToday('2026-10-20', 'UTC')).toBe(1);
  });

  it('says today, tomorrow and whole days', () => {
    const zone = userZone();
    setUserZone('UTC');
    try {
      expect(formatRelativeDay('2026-10-19')).toBe('today');
      expect(formatRelativeDay('2026-10-20T00:30:00Z')).toBe('tomorrow');
      expect(formatRelativeDay('2026-10-22')).toBe('in 3 days');
      expect(formatRelativeDay('2026-10-16T22:00:00Z')).toBe('3 days ago');
      expect(formatRelativeDay('')).toBe('');
    } finally {
      setUserZone(zone);
    }
  });

  it("changes Luxon's default zone with the user's", () => {
    const zone = userZone();
    setUserZone('Asia/Kolkata');
    try {
      expect(Settings.defaultZone.name).toBe('Asia/Kolkata');
      expect(userZone()).toBe('Asia/Kolkata');
    } finally {
      setUserZone(zone);
    }
  });
});

describe('quantities', () => {
  it('formats quantities in the user\'s number format, without trailing zeros', () => {
    expect(formatQuantity(12)).toBe('12');
    expect(formatQuantity('12.500000')).toBe('12.5');
    expect(formatQuantity(1204)).toBe('1,204');
    expect(formatQuantity(-3)).toBe('-3');
    expect(formatQuantity(undefined)).toBe('0');
    expect(formatQuantity('abc')).toBe('0');
  });

  it('picks the plural form by the number while showing the formatted count', () => {
    expect(countParams('1.000')).toEqual({ count: '1', n: 1 });
    expect(translate('{count} units', countParams(1))).toBe('1 unit');
    expect(translate('{count} units', countParams(1204))).toBe('1,204 units');
    expect(translate('{count} units', countParams(0))).toBe('0 units');
  });
});
