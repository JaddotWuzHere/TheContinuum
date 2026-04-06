import { Translation } from "./locales/definition"
import enUs from "./locales/en-US"
import fr from "./locales/fr-FR"
import ja from "./locales/ja-JP"
import zh from "./locales/zh-CN"

export const TRANSLATIONS = {
  "en-US": enUs,
  "fr-FR": fr,
  "ja-JP": ja,
  "zh-CN": zh,
} as const

export const defaultTranslation = "en-US"
export const i18n = (locale: ValidLocale): Translation => TRANSLATIONS[locale ?? defaultTranslation]
export type ValidLocale = keyof typeof TRANSLATIONS