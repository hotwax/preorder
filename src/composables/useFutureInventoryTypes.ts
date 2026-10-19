import { computed } from 'vue';
import { useSeedData } from '@common/db';
import { futureInventoryTypeLabel } from '@/utils/labels';

/** The future inventory types (FUTURE_INV_ITEM_TYPE enums, from the app db): their names and the filter options. */
export function useFutureInventoryTypes() {
  const seed = useSeedData();
  const typeLabel = (typeId?: string) => futureInventoryTypeLabel(typeId, typeId ? seed.enumDescription(typeId) : undefined);
  const typeOptions = computed(() => seed.enumsByType('FUTURE_INV_ITEM_TYPE').map((type: any) => ({ value: type.enumId as string, label: typeLabel(type.enumId) })));
  return { typeLabel, typeOptions };
}
