import { Translation, CalloutTranslation } from "./locales/definition"
import enUs from "./locales/en-US"
import fr from "./locales/fr-FR"
import ja from "./locales/ja-JP"
import de from "./locales/de-DE"
import ru from "./locales/ru-RU"
import ko from "./locales/ko-KR"
import zh from "./locales/zh-CN"

export const TRANSLATIONS = {
  "en-US": enUs,
  "fr-FR": fr,
  "ja-JP": ja,
  "de-DE": de,
  "ru-RU": ru,
  "ko-KR": ko,
  "zh-CN": zh,
} as const

export const defaultTranslation = "en-US"
export const i18n = (locale: ValidLocale): Translation => TRANSLATIONS[locale ?? defaultTranslation]
export type ValidLocale = keyof typeof TRANSLATIONS
export type ValidCallout = keyof CalloutTranslation
