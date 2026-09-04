import { getLocales } from "expo-localization";
import * as SecureStore from "expo-secure-store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "../locales/resources";
import {
  isAppLanguage,
  languageDateLocale,
  normalizeDeviceLanguage,
  type AppLanguage,
  type LanguagePreference,
} from "./languages";

export type { AppLanguage, LanguagePreference };
export {
  EUROPEAN_LANGUAGES,
  languageNativeName,
  isAppLanguage,
} from "./languages";

export const LANG_STORAGE_KEY = "mushroomradar.language";

export function deviceLanguage(): AppLanguage {
  return normalizeDeviceLanguage(getLocales()[0]?.languageCode);
}

export function dateLocale(language = i18n.language): string {
  const code = language?.split("-")[0] ?? "en";
  return languageDateLocale(code);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export async function hydrateLanguage(): Promise<void> {
  const stored = await SecureStore.getItemAsync(LANG_STORAGE_KEY);
  if (isAppLanguage(stored)) {
    await i18n.changeLanguage(stored);
  } else {
    await i18n.changeLanguage(deviceLanguage());
  }
}

export async function getLanguagePreference(): Promise<LanguagePreference> {
  const stored = await SecureStore.getItemAsync(LANG_STORAGE_KEY);
  return isAppLanguage(stored) ? stored : "system";
}

export async function setLanguagePreference(pref: LanguagePreference): Promise<void> {
  if (pref === "system") {
    await SecureStore.deleteItemAsync(LANG_STORAGE_KEY);
    await i18n.changeLanguage(deviceLanguage());
    return;
  }
  await SecureStore.setItemAsync(LANG_STORAGE_KEY, pref);
  await i18n.changeLanguage(pref);
}

export function mushroomCommonName(mushroom: {
  id?: string;
  name?: string | null;
  names?: Record<string, string | null | undefined>;
  speciesName?: string | null;
  scientificName?: string | null;
  commonName?: string | null;
}): string {
  const lang = (i18n.language || "en").split("-")[0];
  const fromMap = mushroom.names?.[lang]?.trim() || mushroom.names?.en?.trim();
  if (fromMap) return fromMap;
  const lookup: Record<string, string> = {
    porcini: "mushrooms.porcini",
    porcino: "mushrooms.porcini",
    "boletus edulis": "mushrooms.porcini",
    galletto: "mushrooms.galletto",
    chanterelle: "mushrooms.galletto",
    "cantharellus cibarius": "mushrooms.galletto",
    morchella: "mushrooms.morchella",
    morel: "mushrooms.morchella",
    spugnola: "mushrooms.morchella",
    "funghi allucinogeni": "mushrooms.psilocybe",
    "psilocybe cubensis": "mushrooms.psilocybe",
    psilocybe: "mushrooms.psilocybe",
  };
  const candidates = [
    mushroom.id,
    mushroom.name,
    mushroom.speciesName,
    mushroom.commonName,
    mushroom.scientificName,
  ];
  for (const value of candidates) {
    const key = value?.trim().toLowerCase();
    if (key && lookup[key]) return i18n.t(lookup[key]);
  }
  return (
    mushroom.name?.trim() ||
    mushroom.speciesName?.trim() ||
    mushroom.commonName?.trim() ||
    mushroom.scientificName?.trim() ||
    ""
  );
}

export default i18n;
