import { ref } from 'vue';

/**
 * A page's bulk action in progress: `running` is true while one runs, so the page can turn its other
 * bulk actions and its select toggle off until the per-row requests have all answered.
 */
export function useBulkAction() {
  const running = ref(false);
  async function runBulk<T>(work: () => Promise<T>): Promise<T> {
    running.value = true;
    try {
      return await work();
    } finally {
      running.value = false;
    }
  }
  return { running, runBulk };
}
