/**
 * Request parameter helpers for the find pages: one place that turns a page's filter state into the
 * query string the oms and poorti list resources read, so every find page drops "All" and empty values the
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
