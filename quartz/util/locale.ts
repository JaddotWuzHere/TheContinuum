export function localeFromSlug(slugOrPath: string): "en" | "zh" | "fr" | "ja" {
  const s = (slugOrPath || "").replace(/^\/+/, "")
  const first = s.split("/")[0]?.toLowerCase()

  if (first === "zh") return "zh"
  if (first === "fr") return "fr"
  if (first === "ja") return "ja"
  return "en"
}

import type { i18n } from "../i18n"

export function toI18nLocale(lang: "en" | "zh" | "fr" | "ja"): Parameters<typeof i18n>[0] {
  switch (lang) {
    case "zh":
      return "zh-CN"
    case "fr":
      return "fr-FR"
    case "ja":
      return "ja-JP"
    default:
      return "en-US"
  }
}