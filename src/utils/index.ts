import { translate } from '@common';

/** A required field's label: the translated label and an asterisk, the one required marker. */
export const requiredLabel = (label: string) => `${translate(label)} *`;
