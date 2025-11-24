import { toastController } from '@ionic/vue';
import { DateTime } from "luxon";
import { useUserStore } from "@hotwax/dxp-components";
// TODO Use separate files for specific utilities

// TODO Remove it when HC APIs are fully REST compliant
const hasError = (response: any) => {
    return typeof response.data != "object" || !!response.data._ERROR_MESSAGE_ || !!response.data._ERROR_MESSAGE_LIST_ || !!response.data.error;
}

const showToast = async (message: string) => {
    const toast = await toastController
        .create({
          message,
          duration: 3000,
          position: 'bottom',
        })
      return toast.present();
}
const handleDateTimeInput = (dateTimeValue: any) => {
  // TODO Handle it in a better way
  // Remove timezone and then convert to timestamp
  // Current date time picker picks browser timezone and there is no supprt to change it
  const dateTime = DateTime.fromISO(dateTimeValue, { setZone: true}).toFormat("yyyy-MM-dd'T'HH:mm:ss")
  return DateTime.fromISO(dateTime).toMillis()
}

const getFeature = (productFeatures: any, featureKey: string) => {
  let  featureValue = ''
  if (productFeatures) {
    const feature = productFeatures.find((featureItem: any) => featureItem.startsWith(featureKey))
    const featureSplit = feature ? feature.split('/') : [];
    featureValue = featureSplit[1] ? featureSplit[1] : '';
  }
  return featureValue;
}

const getProductStoreId = () => {
  const currentEComStore: any = useUserStore().getCurrentEComStore;
  return currentEComStore.productStoreId
};

export { handleDateTimeInput, getProductStoreId, showToast, hasError, getFeature }