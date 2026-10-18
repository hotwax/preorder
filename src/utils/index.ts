import { alertController, modalController, toastController } from '@ionic/vue';
import { translate } from '@common';
import DatePromptModal from '@/components/common/DatePromptModal.vue';

export const showToast = async (message: string) => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
  })

  return toast.present();
}

/** A required field's label: the translated label and an asterisk, the one required marker. */
export const requiredLabel = (label: string) => `${translate(label)} *`;

/** Asks before a change that saves at once and cannot be taken back: Cancel first, then the action's verb. */
export const confirmAction = async (header: string, message: string, confirmText: string): Promise<boolean> => {
  const alert = await alertController.create({
    header,
    message,
    buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: confirmText, role: 'confirm' }],
  });
  await alert.present();
  return (await alert.onDidDismiss()).role === 'confirm';
}

/** Asks for a date ('yyyy-MM-dd') in a modal calendar; undefined when cancelled. */
export const promptForDate = async (header: string, message: string, confirmText: string, value = ''): Promise<string | undefined> => {
  const modal = await modalController.create({ component: DatePromptModal, componentProps: { header, message, confirmText, value } });
  await modal.present();
  const { role, data } = await modal.onWillDismiss();
  return role === 'confirm' && data ? String(data) : undefined;
}

/** Asks for a number in an alert; undefined when cancelled or not a number. */
export const promptForNumber = async (header: string, message: string, confirmText: string, placeholder = ''): Promise<number | undefined> => {
  const alert = await alertController.create({
    header,
    message,
    inputs: [{ name: 'value', type: 'number', placeholder }],
    buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: confirmText, role: 'confirm' }],
  });
  await alert.present();
  const { role, data } = await alert.onDidDismiss();
  const number = Number(data?.values?.value);
  return role === 'confirm' && data?.values?.value !== '' && Number.isFinite(number) ? number : undefined;
}
