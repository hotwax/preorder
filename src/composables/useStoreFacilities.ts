import { computed } from 'vue';
import { useSeedData } from '@common/db';
import { useProductStore } from '@/store/productStore';

export interface FacilityOption {
  facilityId: string;
  facilityName: string;
}

/**
 * The facilities of the menu's product store that stock arrives at (warehouses and stores, never a virtual facility
 * such as parking), by name, from the app db's `productStoreFacilities` and `facilities` seed tables. A store with no
 * facilities assigned offers every such facility, as its lists then show every facility's rows. `synced` is true
 * once both tables hold this login's sync, so an empty list then really is empty.
 */
export function useStoreFacilities() {
  const seed = useSeedData();
  const productStore = useProductStore();

  const isReceiving = (facilityId: string, facilityTypeId?: string) => {
    const typeId = facilityTypeId || seed.facility(facilityId)?.facilityTypeId;
    return typeId !== 'VIRTUAL_FACILITY' && seed.facilityType(typeId || '')?.parentTypeId !== 'VIRTUAL_FACILITY';
  };

  const storeRows = computed(() => seed.productStoreFacilities.withSync(productStore.getCurrentProductStoreId));
  const allRows = computed(() => seed.facilities.withSync());
  const synced = computed(() => storeRows.value.synced && allRows.value.synced);

  const facilityOptions = computed<FacilityOption[]>(() => {
    const own = storeRows.value.data.filter((row: any) => isReceiving(row.facilityId, row.facilityTypeId));
    // Still syncing reads as none yet, not as a store without facilities
    const rows = own.length || !storeRows.value.synced ? own : allRows.value.data.filter((row: any) => isReceiving(row.facilityId, row.facilityTypeId));
    return rows
      .map((row: any) => ({ facilityId: row.facilityId as string, facilityName: (row.facilityName || seed.facilityName(row.facilityId)) as string }))
      .sort((a, b) => a.facilityName.localeCompare(b.facilityName));
  });

  return { facilityOptions, synced };
}
