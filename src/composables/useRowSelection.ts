import { computed, ref, watch, type Ref } from 'vue';

/**
 * Select mode for a list's rows (Pre-orders, Future inventory, Purchase orders): the mode itself, the selected ids and
 * the rows they name. A row that leaves the list leaves the selection, so a bulk action never runs on a row that is
 * no longer shown.
 */
export function useRowSelection<T>(rows: Ref<T[]>, idOf: (row: T) => string) {
  const selectMode = ref(false);
  const selectedIds = ref<string[]>([]);

  const selectedRows = computed(() => rows.value.filter((row) => selectedIds.value.includes(idOf(row))));
  const allSelected = computed(() => rows.value.length > 0 && rows.value.every((row) => selectedIds.value.includes(idOf(row))));
  const someSelected = computed(() => rows.value.some((row) => selectedIds.value.includes(idOf(row))));

  watch(rows, () => {
    const ids = new Set(rows.value.map(idOf));
    selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
  });

  function setSelected(id: string, checked: boolean) {
    const next = new Set(selectedIds.value);
    if (checked) next.add(id);
    else next.delete(id);
    selectedIds.value = [...next];
  }

  const toggleSelected = (id: string) => setSelected(id, !selectedIds.value.includes(id));

  function toggleAll(checked: boolean) {
    selectedIds.value = checked ? rows.value.map(idOf) : [];
  }

  /** Unselects every row and stays in select mode. */
  const deselectAll = () => toggleAll(false);

  /** Leaves select mode with nothing selected. */
  function clearSelection() {
    selectMode.value = false;
    selectedIds.value = [];
  }

  function toggleSelectMode() {
    selectMode.value = !selectMode.value;
    if (!selectMode.value) selectedIds.value = [];
  }

  return { selectMode, selectedIds, selectedRows, allSelected, someSelected, setSelected, toggleSelected, toggleAll, deselectAll, clearSelection, toggleSelectMode };
}
