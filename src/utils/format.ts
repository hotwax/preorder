import { ref } from 'vue';
import { DateTime, Settings, type DateTimeFormatOptions } from 'luxon';
// Read straight from common's i18n: this module moves into common next, where it imports the same file.
import { i18n } from '@common/core/i18n';

/**
 * How the app shows money, quantities, dates and times: one place, in the user's language and time
 * zone, so every screen reads the same. Staged here to move into common for the other apps.
 */

/** The language the app is showing, so numbers and dates read like the text around them. */
export const locale = (): string | undefined => {
  const current = i18n?.global?.locale;
  return (typeof current === 'string' ? current : current?.value) || undefined;
};

/** Bumped when the user's time zone changes, so a template that formats a date renders again in the new zone. */
const zoneVersion = ref(0);

/** Shows dates in a time zone from now on (the user's): Luxon's default zone, and every date on screen renders again. */
export function setUserZone(zone?: string) {
  if (!zone) return;
  Settings.defaultZone = zone;
  zoneVersion.value += 1;
}

/** The user's time zone (Luxon's default zone). Every formatter reads it here, so a date in a template follows a change to it. */
export function userZone(): string {
  void zoneVersion.value;
  return Settings.defaultZone.name;
}

/**
 * Epoch millis for the date shapes OMS mixes: epoch millis, epoch seconds (10 digits or
 * fewer, so dates before 2001 still read as seconds), SQL timestamps and ISO strings.
 * undefined when the value is empty or unparseable.
 */
export function toMillis(value: any): number | undefined {
  if (!value) return undefined;
  if (DateTime.isDateTime(value)) return value.isValid ? value.toMillis() : undefined;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return String(value).length <= 10 ? numericValue * 1000 : numericValue;
  }

  const stringValue = String(value);
  const sqlDate = DateTime.fromSQL(stringValue, { zone: userZone() });
  if (sqlDate.isValid) return sqlDate.toMillis();

  const isoDate = DateTime.fromISO(stringValue, { zone: userZone() });
  return isoDate.isValid ? isoDate.toMillis() : undefined;
}

/**
 * An amount in the currency the server returned for its order or return: "$1,234.50",
 * "CA$361.00", "¥1,200". An unknown currency code still shows the number, with the code after it.
 */
export function formatMoney(amount: unknown, currency?: string): string {
  const value = Number(amount ?? 0);
  const number = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: currency || 'USD' }).format(number);
  } catch {
    return `${new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)} ${currency}`;
  }
}

/** A number in the user's language: "1,204", "1.204", "+3". */
export function formatNumber(value: unknown, options?: Intl.NumberFormatOptions): string {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat(locale(), options).format(Number.isFinite(number) ? number : 0);
}

/** A quantity as a number, to 4 decimal places: OMS sends "12.000000" for 12. */
export const toQuantity = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Number(number.toFixed(4)) : 0;
};

/** A quantity in the user's language, without trailing zeros: "1,204", "12.5", "-3". */
export const formatQuantity = (value: unknown): string => formatNumber(toQuantity(value), { maximumFractionDigits: 4 });

/**
 * The params of a counted message ("{count} units"): the count as the user reads numbers, and `n`, the
 * number vue-i18n picks the message's plural form by. vue-i18n picks it by a numeric `count` before `n`,
 * so the count goes in as text.
 */
export const countParams = (value: unknown, name = 'count') => ({ [name]: formatQuantity(value), n: toQuantity(value) });

function format(value: any, options: DateTimeFormatOptions): string {
  const millis = toMillis(value);
  if (millis === undefined) return '';
  const date = DateTime.fromMillis(millis, { zone: userZone() });
  return (locale() ? date.setLocale(locale()!) : date).toLocaleString(options);
}

/** "Sep 22, 2026", or "Tuesday, Sep 22, 2026" with the weekday. */
export const formatDate = (value: any, { weekday = false } = {}) =>
  format(value, weekday ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' } : DateTime.DATE_MED);

/** "Sep 22, 2026, 2:33 PM", or "Sep 22, 2:33 PM" without the year where a list is dense. */
export const formatDateTime = (value: any, { year = true } = {}) =>
  format(value, year ? DateTime.DATETIME_MED : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** A moment against now, for a value with a time: "3 days ago", "in 2 hours". A date-only value uses `formatRelativeDay`. */
export function formatRelative(value: any): string {
  const millis = toMillis(value);
  if (millis === undefined) return '';
  return DateTime.fromMillis(millis, { zone: userZone() }).toRelative({ locale: locale() }) || '';
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The day a value falls on in a time zone (the user's), at its start: a 'yyyy-MM-dd' is that day, and a
 * moment (epoch millis, an ISO or SQL timestamp, a DateTime) the day it is there. undefined when empty or unreadable.
 */
export function toDay(value: any, zone = userZone()): DateTime | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && DAY.test(value)) {
    const day = DateTime.fromISO(value, { zone });
    return day.isValid ? day : undefined;
  }
  const millis = toMillis(value);
  return millis === undefined ? undefined : DateTime.fromMillis(millis, { zone }).startOf('day');
}

/** Today in a time zone (the user's) as 'yyyy-MM-dd': the earliest promise or arrival date a calendar offers. */
export const todayValue = (zone = userZone()): string => DateTime.now().setZone(zone).toISODate() as string;

/**
 * How a date-range bound is written for the API it goes to:
 * - `date`: 'yyyy-MM-dd', for the preorder resources, which bound the day themselves in the user's time zone;
 * - `timestamp`: 'yyyy-MM-dd HH:mm:ss.SSS' in the user's time zone, for Moqui entity search parameters (`_from` / `_thru`);
 * - `iso`: the UTC ISO instant, for Solr.
 */
export type DayBoundFormat = 'date' | 'timestamp' | 'iso';

/**
 * The start or end of a day in the user's time zone, written the way the API reads a date-range bound. The day is a
 * 'yyyy-MM-dd' (a date filter's value) or a moment (a DateTime, millis, an ISO string), taken as its day in the zone.
 * '' when the day is empty or unreadable.
 */
export function dayBound(day: any, edge: 'start' | 'end', boundFormat: DayBoundFormat, zone = userZone()): string {
  const start = toDay(day, zone);
  if (!start) return '';
  const bound = edge === 'end' ? start.endOf('day') : start;
  if (boundFormat === 'date') return bound.toISODate() as string;
  if (boundFormat === 'timestamp') return bound.toFormat('yyyy-MM-dd HH:mm:ss.SSS');
  return bound.toUTC().toISO() as string;
}

/**
 * Whole calendar days from today to a date in the user's time zone: 0 today, 1 tomorrow, -3 three days ago. A
 * promise or arrival date is a day, so one at any time today is today, not "17 hours ago". undefined when empty.
 */
export function daysFromToday(value: any, zone = userZone()): number | undefined {
  const day = toDay(value, zone);
  if (!day) return undefined;
  return Math.round(day.diff(DateTime.now().setZone(zone).startOf('day'), 'days').days);
}

/** A date-only value (a promise or arrival date) against today, by calendar day: "today", "tomorrow", "in 3 days", "3 days ago". */
export function formatRelativeDay(value: any): string {
  const zone = userZone();
  const day = toDay(value, zone);
  if (!day) return '';
  return day.toRelativeCalendar({ base: DateTime.now().setZone(zone), unit: 'days', locale: locale() }) || '';
}

/** A date as the 'yyyy-MM-dd' day it is in the user's time zone: the value `<ion-datetime>` and the date prompts bind. */
export const toDateInputValue = (value: any): string => dayBound(value, 'start', 'date');
