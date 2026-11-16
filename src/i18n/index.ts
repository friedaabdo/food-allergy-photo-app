import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import en from "./en.json";

// All the dictionaries the app knows about
const i18n = new I18n({ en });

// Use the phone's language (e.g. "ja" for Japanese)
i18n.locale = getLocales()[0]?.languageCode ?? "en";

// If a word is missing in that language, show English instead
i18n.enableFallback = true;
i18n.defaultLocale = "en";

// t('home.title') -> the text in the right language
export const t = i18n.t.bind(i18n);
