import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useRowSelection } from '@/composables/useRowSelection';

const rows = (...ids: string[]) => ids.map((id) => ({ id }));

describe('useRowSelection', () => {
  it('selects, toggles and selects all rows', () => {
    const list = ref(rows('a', 'b', 'c'));
    const selection = useRowSelection(list, (row) => row.id);
    selection.setSelected('a', true);
    selection.toggleSelected('b');
    expect(selection.selectedIds.value).toEqual(['a', 'b']);
    expect(selection.selectedRows.value.map((row) => row.id)).toEqual(['a', 'b']);
    expect(selection.someSelected.value).toBe(true);
    expect(selection.allSelected.value).toBe(false);
    selection.toggleAll(true);
    expect(selection.allSelected.value).toBe(true);
    selection.setSelected('a', false);
    expect(selection.selectedIds.value).toEqual(['b', 'c']);
    selection.deselectAll();
    expect(selection.selectedIds.value).toEqual([]);
    expect(selection.someSelected.value).toBe(false);
  });

  it('clears the selection when select mode ends, and clears both on clearSelection', () => {
    const selection = useRowSelection(ref(rows('a', 'b')), (row) => row.id);
    selection.toggleSelectMode();
    selection.setSelected('a', true);
    selection.toggleSelectMode();
    expect(selection.selectMode.value).toBe(false);
    expect(selection.selectedIds.value).toEqual([]);
    selection.toggleSelectMode();
    selection.setSelected('b', true);
    selection.clearSelection();
    expect(selection.selectMode.value).toBe(false);
    expect(selection.selectedIds.value).toEqual([]);
  });

  it('drops a row that leaves the list from the selection', async () => {
    const list = ref(rows('a', 'b'));
    const selection = useRowSelection(list, (row) => row.id);
    selection.toggleAll(true);
    list.value = rows('b', 'c');
    await nextTick();
    expect(selection.selectedIds.value).toEqual(['b']);
  });

  it('is not all selected for an empty list', () => {
    expect(useRowSelection(ref<{ id: string }[]>([]), (row) => row.id).allSelected.value).toBe(false);
  });
});
