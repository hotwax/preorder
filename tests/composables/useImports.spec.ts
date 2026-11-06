import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => vi.fn());
vi.mock('@common', () => ({ api, commonUtil: { hasError: () => false } }));
import { useImports } from '@/composables/useImports';

beforeEach(() => { vi.useFakeTimers(); api.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

it.each(['DmlsFinished', 'DmlsFailed', 'DmlsCancelled', 'DmlsCrashed'])('returns a terminal %s import without polling until timeout', async statusId => {
  const log = { logId: '101713', statusId };
  api.mockResolvedValue({ data: { dataManagerLogs: [log] } });
  const pending = useImports().waitForImport(log.logId, 1000);
  await vi.runAllTimersAsync();
  expect(await pending).toEqual(log);
  expect(api).toHaveBeenCalledTimes(1);
});

it('keeps polling a running import and returns its final crashed state', async () => {
  api.mockResolvedValueOnce({ data: { dataManagerLogs: [{ logId: 'L1', statusId: 'DmlsRunning' }] } });
  api.mockResolvedValue({ data: { dataManagerLogs: [{ logId: 'L1', statusId: 'DmlsCrashed' }] } });
  const pending = useImports().waitForImport('L1', 2000);
  await vi.runAllTimersAsync();
  expect((await pending)?.statusId).toBe('DmlsCrashed');
  expect(api).toHaveBeenCalledTimes(2);
});
