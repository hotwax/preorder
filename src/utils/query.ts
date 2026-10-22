/**
 * Request parameter helpers for the find pages: one place that turns a page's filter state into the
 * query string the preorder REST resources read, so every find page drops "All" and empty values the
 * same way and sends multi-selects as the comma lists the backend splits.
 */

export type FilterValue = string | string[] | boolean | number | null | undefined;

/** The value a select uses for "no filter". */
export const ALL = 'All';

/** Drops empty and "All" values, joins arrays with commas and sends `true` as "Y". */
export function toListParams(filters: Record<string, FilterValue>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === ALL || value === false) return;
    if (Array.isArray(value)) {
      const values = value.filter((entry) => entry && entry !== ALL);
      if (values.length) params[key] = values.join(',');
      return;
    }
    params[key] = value === true ? 'Y' : (value as string | number);
  });
  return params;
}

/**
 * Entity REST lists (`oms/futureInventoryItems`, `oms/orders/futureInventory`, ...) answer a bare array, with the unpaged
 * total in the `X-Total-Count` header, and read their filters straight from field names: `field`, `field_op`
 * (equals, like, contains, begins, empty, in), `field_ic=Y` to ignore case, `field_not=Y`, `field_from` / `field_thru`
 * (inclusive ranges; a bare date is its whole day) and `orderByField` (comma list, `-` for descending), with
 * `pageIndex` / `pageSize`. The helpers below add one filter each to a params object; an empty or "All" value adds nothing.
 */
export type EntityParams = Record<string, string | number>;

const isBlank = (value: unknown) => value === undefined || value === null || value === '' || value === ALL;

export function whereEquals(params: EntityParams, field: string, value?: string | number | null) {
  if (!isBlank(value)) params[field] = value as string | number;
}

/** One value is a plain equals; several are an `in`. A comma string splits, as the legacy resources took it. */
export function whereIn(params: EntityParams, field: string, values?: string | string[] | null) {
  const list = (Array.isArray(values) ? values : String(values ?? '').split(',')).map((value) => value.trim()).filter((value) => value && value !== ALL);
  if (list.length === 1) params[field] = list[0];
  else if (list.length > 1) { params[field] = list.join(','); params[`${field}_op`] = 'in'; }
}

/** Case-insensitive contains. */
export function whereContains(params: EntityParams, field: string, text?: string | null) {
  const value = String(text ?? '').trim();
  if (!value) return;
  params[field] = value; params[`${field}_op`] = 'contains'; params[`${field}_ic`] = 'Y';
}

/** Inclusive range; either end may be empty. */
export function whereBetween(params: EntityParams, field: string, from?: string | number | null, thru?: string | number | null) {
  if (!isBlank(from)) params[`${field}_from`] = from as string | number;
  if (!isBlank(thru)) params[`${field}_thru`] = thru as string | number;
}

/** Ordering and paging; the order always ends on a unique field so pages never repeat or skip rows. */
export function withPaging(params: EntityParams, { orderBy, tieBreaker, pageIndex, pageSize }: { orderBy?: string; tieBreaker?: string; pageIndex?: number; pageSize?: number }) {
  const order = [orderBy, tieBreaker].filter(Boolean).join(',');
  if (order) params.orderByField = order;
  if (pageIndex !== undefined) params.pageIndex = pageIndex;
  if (pageSize !== undefined) params.pageSize = pageSize;
}

/** The rows of an entity REST list response and its unpaged total (the row count when the header is absent). */
export function readEntityList<T = any>(resp: any): { rows: T[]; total: number } {
  const rows: T[] = Array.isArray(resp?.data) ? resp.data : [];
  const total = Number(resp?.headers?.['x-total-count'] ?? NaN);
  return { rows, total: Number.isFinite(total) ? total : rows.length };
}

/** The list and its total from a `{ <name>: [...], <name>Count: n }` response. */
export function readList<T = any>(data: any, name: string): { rows: T[]; total: number } {
  const rows = Array.isArray(data?.[name]) ? data[name] : [];
  const total = Number(data?.[`${name}Count`] ?? rows.length);
  return { rows, total: Number.isFinite(total) ? total : rows.length };
}

/** Rows as CSV text, quoting every value, with the given columns in order. */
export function toCsv(rows: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const quote = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((column) => quote(column.label)).join(',');
  const lines = rows.map((row) => columns.map((column) => quote(row[column.key])).join(','));
  return [header, ...lines].join('\n');
}
