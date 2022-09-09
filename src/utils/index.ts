import store from '@/store';
import { toastController } from '@ionic/vue';
import { DateTime } from "luxon";
// TODO Use separate files for specific utilities

// TODO Remove it when HC APIs are fully REST compliant
const hasError = (response: any) => {
    return !!response.data._ERROR_MESSAGE_ || !!response.data._ERROR_MESSAGE_LIST_;
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

const handleDateTimeInput = (dateTimeValue: any, inputType: string, inputFormat = 'yyyy-MM-dd') => {
  // TODO Handle it in a better way
  // Remove timezone and then convert to timestamp
  // Current date time picker picks browser timezone and there is no supprt to change it
  let dateTime;
  if (inputType === 'orderedBefore' || inputType === 'promisedBefore') {
    dateTime = (dateTimeValue ? DateTime.fromFormat(dateTimeValue, inputFormat).setZone(store.state.user.current.userTimeZone) : DateTime.now().setZone(store.state.user.current.userTimeZone)).endOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  } else {
    dateTime = (dateTimeValue ? DateTime.fromFormat(dateTimeValue, inputFormat).setZone(store.state.user.current.userTimeZone) : DateTime.fromFormat("0001-01-01", 'yyyy-MM-dd').setZone(store.state.user.current.userTimeZone)).startOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  }
  return dateTime;
}

export { handleDateTimeInput, showToast, hasError }