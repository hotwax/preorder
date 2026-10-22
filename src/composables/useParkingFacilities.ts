import { computed } from 'vue';
import { useSeedData } from '@common/db';
import { shapeOrder, summarizePreorderLines } from '@/utils/preorders';
import type { PreorderOrder } from '@/types';

/** The facility types orders wait in: pre-order and back-order parking (PreorderTypes.PARKING_FACILITY_TYPES in OMS). */
const PARKING_FACILITY_TYPES = ['PRE_ORDER', 'BACKORDER'];

/** Which facilities are parking, from the seed facilities, and the order figures that depend on it. */
export function useParkingFacilities() {
  const seed = useSeedData();
  const parkingIds = computed(() => new Set<string>(seed.facilities()
    .filter((facility: any) => PARKING_FACILITY_TYPES.includes(facility.facilityTypeId))
    .map((facility: any) => facility.facilityId)));
  const isParking = (facilityId?: string) => !!facilityId && parkingIds.value.has(facilityId);
  const summarize = (order: Pick<PreorderOrder, 'lines'>) => summarizePreorderLines(order.lines || [], isParking);
  /** The order with its lines marked at parking or not and the counts they add up to (the list and the detail show these). */
  const shape = (order: PreorderOrder) => shapeOrder(order, isParking);
  return { isParking, summarize, shape };
}
