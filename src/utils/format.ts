import { DateTime, type DateTimeFormatOptions } from 'luxon';
// Read straight from common's i18n: this module moves into common next, where it imports the same file.
import { i18n } from '@common/core/i18n';

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

/** "Sep 22, 2026, 2:33 PM", or "Sep 22, 2:33 PM" without the year where a list is dense. */
export const formatDateTime = (value: any, { year = true } = {}) =>
  format(value, year ? DateTime.DATETIME_MED : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** "3 days ago", "in 2 hours". */
export function formatRelative(value: any): string {
  const millis = toMillis(value);
  if (millis === undefined) return '';
  return DateTime.fromMillis(millis).toRelative({ locale: locale() }) || '';
}

/** A timestamp or ISO string as YYYY-MM-DD, the value `<ion-input type="date">` binds. */
export function toDateInputValue(value: any): string {
  if (!value) return '';
  const dt = /^\d+$/.test(String(value)) ? DateTime.fromMillis(Number(value)) : DateTime.fromISO(String(value));
  return dt.isValid ? dt.toISODate() ?? '' : '';
}
