import { api } from '@/adapter';

const findFacility = async (payload: any): Promise <any>  => {
    return api({
            url: "facilities",
            method: "post",
            data: payload,
            cache: true
          });
}
export const FacilityService = {
    findFacility,
}