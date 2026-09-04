export const EUROPEAN_LANGUAGES = [
  { code: "sq", nativeName: "Shqip", dateLocale: "sq-AL", flag: "al" },
  { code: "eu", nativeName: "Euskara", dateLocale: "eu-ES", flag: "es" },
  { code: "be", nativeName: "Беларуская", dateLocale: "be-BY", flag: "by" },
  { code: "bs", nativeName: "Bosanski", dateLocale: "bs-BA", flag: "ba" },
  { code: "bg", nativeName: "Български", dateLocale: "bg-BG", flag: "bg" },
  { code: "ca", nativeName: "Català", dateLocale: "ca-ES", flag: "es" },
  { code: "cs", nativeName: "Čeština", dateLocale: "cs-CZ", flag: "cz" },
  { code: "cy", nativeName: "Cymraeg", dateLocale: "cy-GB", flag: "gb-wls" },
  { code: "da", nativeName: "Dansk", dateLocale: "da-DK", flag: "dk" },
  { code: "de", nativeName: "Deutsch", dateLocale: "de-DE", flag: "de" },
  { code: "el", nativeName: "Ελληνικά", dateLocale: "el-GR", flag: "gr" },
  { code: "en", nativeName: "English", dateLocale: "en-GB", flag: "gb" },
  { code: "es", nativeName: "Español", dateLocale: "es-ES", flag: "es" },
  { code: "et", nativeName: "Eesti", dateLocale: "et-EE", flag: "ee" },
  { code: "fi", nativeName: "Suomi", dateLocale: "fi-FI", flag: "fi" },
  { code: "fo", nativeName: "Føroyskt", dateLocale: "fo-FO", flag: "fo" },
  { code: "fr", nativeName: "Français", dateLocale: "fr-FR", flag: "fr" },
  { code: "ga", nativeName: "Gaeilge", dateLocale: "ga-IE", flag: "ie" },
  { code: "gd", nativeName: "Gàidhlig", dateLocale: "gd-GB", flag: "gb-sct" },
  { code: "gl", nativeName: "Galego", dateLocale: "gl-ES", flag: "es" },
  { code: "hr", nativeName: "Hrvatski", dateLocale: "hr-HR", flag: "hr" },
  { code: "hu", nativeName: "Magyar", dateLocale: "hu-HU", flag: "hu" },
  { code: "is", nativeName: "Íslenska", dateLocale: "is-IS", flag: "is" },
  { code: "it", nativeName: "Italiano", dateLocale: "it-IT", flag: "it" },
  { code: "lb", nativeName: "Lëtzebuergesch", dateLocale: "lb-LU", flag: "lu" },
  { code: "lt", nativeName: "Lietuvių", dateLocale: "lt-LT", flag: "lt" },
  { code: "lv", nativeName: "Latviešu", dateLocale: "lv-LV", flag: "lv" },
  { code: "mk", nativeName: "Македонски", dateLocale: "mk-MK", flag: "mk" },
  { code: "mt", nativeName: "Malti", dateLocale: "mt-MT", flag: "mt" },
  { code: "nb", nativeName: "Norsk", dateLocale: "nb-NO", flag: "no" },
  { code: "nl", nativeName: "Nederlands", dateLocale: "nl-NL", flag: "nl" },
  { code: "pl", nativeName: "Polski", dateLocale: "pl-PL", flag: "pl" },
  { code: "pt", nativeName: "Português", dateLocale: "pt-PT", flag: "pt" },
  { code: "rm", nativeName: "Rumantsch", dateLocale: "rm-CH", flag: "ch" },
  { code: "ro", nativeName: "Română", dateLocale: "ro-RO", flag: "ro" },
  { code: "ru", nativeName: "Русский", dateLocale: "ru-RU", flag: "ru" },
  { code: "sk", nativeName: "Slovenčina", dateLocale: "sk-SK", flag: "sk" },
  { code: "sl", nativeName: "Slovenščina", dateLocale: "sl-SI", flag: "si" },
  { code: "sr", nativeName: "Srpski", dateLocale: "sr-RS", flag: "rs" },
  { code: "sv", nativeName: "Svenska", dateLocale: "sv-SE", flag: "se" },
  { code: "tr", nativeName: "Türkçe", dateLocale: "tr-TR", flag: "tr" },
  { code: "uk", nativeName: "Українська", dateLocale: "uk-UA", flag: "ua" },
] as const;

export type AppLanguage = (typeof EUROPEAN_LANGUAGES)[number]["code"];
export type LanguagePreference = "system" | AppLanguage;

const byCode = new Map<string, (typeof EUROPEAN_LANGUAGES)[number]>(
  EUROPEAN_LANGUAGES.map((language) => [language.code, language]),
);

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return !!value && byCode.has(value);
}

export function languageNativeName(code: string): string {
  return byCode.get(code)?.nativeName ?? code;
}

export function languageDateLocale(code: string): string {
  return byCode.get(code)?.dateLocale ?? "en-GB";
}

export function languageFlagCode(code: string): string | undefined {
  return byCode.get(code)?.flag;
}

export function normalizeDeviceLanguage(code: string | null | undefined): AppLanguage {
  const raw = code?.toLowerCase() ?? "en";
  if (raw === "no" || raw === "nn") return "nb";
  if (isAppLanguage(raw)) return raw;
  return "en";
}
