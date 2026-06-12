import type { Language } from "./schemas";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
};

export const RTL_LANGUAGES: Language[] = ["ar", "ur"];

export function isRTL(lang: Language): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function dirFor(lang: Language): "rtl" | "ltr" {
  return isRTL(lang) ? "rtl" : "ltr";
}

/** Native language name used to instruct the model. */
export const LANGUAGE_NATIVE: Record<Language, string> = {
  en: "English",
  ar: "Arabic",
  ur: "Urdu",
};
