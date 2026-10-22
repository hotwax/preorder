import { commonUtil } from '@common';

/** The response data of a request, or an Error carrying the server's message (or `message`). */
export async function ensureOk(request: Promise<any>, message: string) {
  const resp: any = await request;
  if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || message);
  return resp.data;
}

/** The whole response of a request (list totals ride in its headers), or an Error carrying the server's message (or `message`). */
export async function ensureResponse(request: Promise<any>, message: string) {
  const resp: any = await request;
  if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || message);
  return resp;
}

/** The server's message from a failed request, for a toast. */
export function errorMessage(error: any, fallback: string): string {
  let errors = error?.response?.data?.errors;
  if (Array.isArray(errors)) errors = errors.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()).join('; ');
  if (typeof errors === 'string' && errors.trim()) return errors.trim();
  return typeof error?.message === 'string' && error.message ? error.message : fallback;
}
