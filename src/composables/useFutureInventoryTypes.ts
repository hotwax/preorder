import { computed } from 'vue';
import { useSeedData } from '@common/db';
import { futureInventoryTypeLabel } from '@/utils/labels';

/** The future inventory types (FUTURE_INV_ITEM_TYPE enums, from the app db): their names and the filter options. */
export function useFutureInventoryTypes() {
  const seed = useSeedData();
  const typeLabel = (typeId?: string) => futureInventoryTypeLabel(typeId, typeId ? seed.enumDescription(typeId) : undefined);
  const toOption = (type: any) => ({ value: type.enumId as string, label: typeLabel(type.enumId) });
  const typeOptions = computed(() => seed.enumsByType('FUTURE_INV_ITEM_TYPE').map(toOption));
  /** The options once the enums are loaded, for a prompt that reads them once instead of rendering them. */
  const loadTypeOptions = async () => (await seed.getEnumsByType('FUTURE_INV_ITEM_TYPE')).map(toOption);
  return { typeLabel, typeOptions, loadTypeOptions };
}
