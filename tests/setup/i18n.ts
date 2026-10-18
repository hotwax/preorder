import { createDxpI18n } from '@common/core/i18n';
import enUS from '@/locales/en-US.json';

// Specs that don't mock @common translate through the app's real en-US messages, plurals included.
createDxpI18n({ 'en-US': enUS });
