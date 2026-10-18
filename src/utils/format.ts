import { DateTime, type DateTimeFormatOptions } from 'luxon';
// Read straight from common's i18n: this module moves into common next, where it imports the same file.
import { i18n, translate } from '@common/core/i18n';

/**
 * How the app shows money, dates and times: one place, in the user's language and time zone, so
 * every screen reads the same. Staged here to move into common for the other apps.
 */

/** The language the app is showing, so numbers and dates read like the text around them. */
export const locale = (): string | undefined => {
  const current = i18n?.global?.locale;
  return (typeof current === 'string' ? current : current?.value) || undefined;
};

/**
 * Epoch millis for the date shapes OMS mixes: epoch millis, epoch seconds (10 digits or
 * fewer, so dates before 2001 still read as seconds), SQL timestamps and ISO strings.
 * undefined when the value is empty or unparseable.
 */
export function toMillis(value: any): number | undefined {
  if (!value) return undefined;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return String(value).length <= 10 ? numericValue * 1000 : numericValue;
  }

  const stringValue = String(value);
  const sqlDate = DateTime.fromSQL(stringValue);
  if (sqlDate.isValid) return sqlDate.toMillis();

  const isoDate = DateTime.fromISO(stringValue);
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

/** The symbol a money input leads with: "$", "CA$", "€". The code itself when the currency is unknown. */
export function currencySymbol(currency?: string): string {
  try {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: currency || 'USD' })
      .formatToParts(0).find((part) => part.type === 'currency')?.value || '';
  } catch {
    return currency || '';
  }
}

/** A number in the user's language: "1,204", "1.204", "+3". */
export function formatNumber(value: unknown, options?: Intl.NumberFormatOptions): string {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat(locale(), options).format(Number.isFinite(number) ? number : 0);
}

function format(value: any, options: DateTimeFormatOptions): string {
  const millis = toMillis(value);
  if (millis === undefined) return '';
  const date = DateTime.fromMillis(millis);
  return (locale() ? date.setLocale(locale()!) : date).toLocaleString(options);
}

/** "Sep 22, 2026", or "Tuesday, Sep 22, 2026" with the weekday. */
export const formatDate = (value: any, { weekday = false } = {}) =>
  format(value, weekday ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' } : DateTime.DATE_MED);

/** "2:33 PM", or "2:33:14 PM" with seconds. */
export const formatTime = (value: any, { seconds = false } = {}) =>
  format(value, seconds ? DateTime.TIME_WITH_SECONDS : DateTime.TIME_SIMPLE);

/** "Sep 22, 2026, 2:33 PM", or "Sep 22, 2:33 PM" without the year where a list is dense. */
export const formatDateTime = (value: any, { year = true } = {}) =>
  format(value, year ? DateTime.DATETIME_MED : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** "September 2026". */
export const formatMonthYear = (value: any) => format(value, { month: 'long', year: 'numeric' });

/** "3 days ago", "in 2 hours". */
export function formatRelative(value: any): string {
  const millis = toMillis(value);
  if (millis === undefined) return '';
  return DateTime.fromMillis(millis).toRelative({ locale: locale() }) || '';
}

/** The calendar day a moment falls on in the user's time zone, for grouping by day. */
export const dayKey = (value: any) => {
  const millis = toMillis(value);
  return millis === undefined ? '' : DateTime.fromMillis(millis).toISODate() || '';
};

/** A timestamp or ISO string as YYYY-MM-DD, the value `<ion-input type="date">` binds. */
export function toDateInputValue(value: any): string {
  if (!value) return '';
  const dt = /^\d+$/.test(String(value)) ? DateTime.fromMillis(Number(value)) : DateTime.fromISO(String(value));
  return dt.isValid ? dt.toISODate() ?? '' : '';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type ElapsedUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes';

const UNIT_KEYS: Record<ElapsedUnit, string> = {
  years: '{count} years',
  months: '{count} months',
  days: '{count} days',
  hours: '{count} hours',
  minutes: '{count} minutes',
};

/**
 * The time between two moments in its two largest units, rounded at the second one, so
 * 1 day 18 hours 57 minutes reads "1 day 19 hours" and 59 minutes 40 seconds reads
 * "59 minutes". Empty under a minute, when a date is missing, or when the end comes first.
 */
export function formatElapsed(start?: number, end?: number): string {
  if (start === undefined || end === undefined) return '';
  const span = end - start;
  if (!(span >= MINUTE)) return '';
  if (span < HOUR) return translate(UNIT_KEYS.minutes, { count: Math.floor(span / MINUTE) });

  const byMinute = Math.round(span / MINUTE) * MINUTE;
  const units: ElapsedUnit[] = byMinute < DAY ? ['hours', 'minutes'] : ['years', 'months', 'days', 'hours'];
  const rounded = byMinute < DAY ? byMinute : Math.round(span / HOUR) * HOUR;
  const duration = DateTime.fromMillis(start + rounded).diff(DateTime.fromMillis(start), units).toObject();

  const index = units.findIndex((unit) => Math.floor(duration[unit] || 0) > 0);
  if (index < 0) return '';
  const parts = [translate(UNIT_KEYS[units[index]], { count: Math.floor(duration[units[index]] || 0) })];
  const next = units[index + 1];
  const nextCount = next ? Math.round(duration[next] || 0) : 0;
  if (next && nextCount > 0) parts.push(translate(UNIT_KEYS[next], { count: nextCount }));
  return parts.join(' ');
}
