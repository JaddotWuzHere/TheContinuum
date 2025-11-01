export function localeFromSlug(slugOrPath: string): "en" | "zh" | "fr" {
  const s = (slugOrPath || "").replace(/^\/+/, "")
  const first = s.split("/")[0]?.toLowerCase()
  if (first === "zh") return "zh"
  if (first === "fr") return "fr"
  return "en"
}

import type { i18n } from "../i18n"

export function toI18nLocale(lang: "en" | "zh" | "fr"): Parameters<typeof i18n>[0] {
  switch (lang) {
    case "zh":
      return "zh-CN" as Parameters<typeof i18n>[0]
    case "fr":
      return "fr-FR" as Parameters<typeof i18n>[0]
    default:
      return "en-US" as Parameters<typeof i18n>[0]
  }
}

