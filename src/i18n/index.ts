import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
import th from './th.json';
import zhHans from './zh-Hans.json';

// All the dictionaries the app knows about
const i18n = new I18n({ en, ja, ko, th, 'zh-Hans': zhHans });

// Works out which dictionary to use from the phone's language
function pickLanguage() {
  const locale = 'getLocales()[0]';
  if (!locale) return 'en';

  // Chinese comes in two writing systems. We only have Simplified so far,
  // so Traditional (Taiwan, Hong Kong, Macau) falls back to English.
  if (locale.languageCode === 'zh') {
    const tag = locale.languageTag; // e.g. "zh-Hans-CN" or "zh-Hant-TW"
    const traditional = tag.includes('Hant') || /-(TW|HK|MO)\b/.test(tag);
    return traditional ? 'zh-Hant' : 'zh-Hans';
  }

  return locale.languageCode ?? 'en';
}

i18n.locale = pickLanguage();
i18n.locale = 'ja';

// If a word is missing in that language, show English instead
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// t('home.title') -> the text in the right language
export const t = i18n.t.bind(i18n);