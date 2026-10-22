import { alertController, modalController } from '@ionic/vue';
import { translate } from '@common';
import DatePromptModal from '@/components/common/DatePromptModal.vue';

/** The questions a page asks before a change: a confirmation, a date, a number. */
export function usePrompts() {
  /** Asks before a change that saves at once and cannot be taken back: Cancel first, then the action's verb. */
  async function confirmAction(header: string, message: string, confirmText: string): Promise<boolean> {
    const alert = await alertController.create({
      header,
      message,
      buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: confirmText, role: 'confirm' }],
    });
    await alert.present();
    return (await alert.onDidDismiss()).role === 'confirm';
  }

  /** Asks for a date ('yyyy-MM-dd') in a modal calendar, from today on; undefined when cancelled. */
  async function promptForDate(header: string, message: string, confirmText: string, value = ''): Promise<string | undefined> {
    const modal = await modalController.create({ component: DatePromptModal, componentProps: { header, message, confirmText, value } });
    await modal.present();
    const { role, data } = await modal.onWillDismiss();
    return role === 'confirm' && data ? String(data) : undefined;
  }

  /** Asks for a number in an alert; undefined when cancelled or not a number. */
  async function promptForNumber(header: string, message: string, confirmText: string, placeholder = ''): Promise<number | undefined> {
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

  /**
   * Asks for one choice in an alert, the first preselected, before a change that can't be taken back; the chosen value,
   * or undefined when cancelled.
   */
  async function promptForChoice(header: string, message: string, confirmText: string, choices: { value: string; label: string }[]): Promise<string | undefined> {
    const alert = await alertController.create({
      header,
      message,
      inputs: choices.map((choice, index) => ({ type: 'radio' as const, label: choice.label, value: choice.value, checked: index === 0 })),
      buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: confirmText, role: 'confirm' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    return role === 'confirm' && data?.values ? String(data.values) : undefined;
  }

  return { confirmAction, promptForDate, promptForNumber, promptForChoice };
}
