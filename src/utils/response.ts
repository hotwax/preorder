import { commonUtil } from '@common';

/** The response data of a request, or an Error carrying the server's message (or `message`). */
export async function ensureOk(request: Promise<any>, message: string) {
  const resp: any = await request;
  if (commonUtil.hasError(resp)) throw new Error(resp?.data?.errors || message);
  return resp.data;
}

/** The server's message from a failed request, for a toast. */
export function errorMessage(error: any, fallback: string): string {
  const errors = error?.response?.data?.errors ?? error?.message;
  return typeof errors === 'string' && errors ? errors : fallback;
}
