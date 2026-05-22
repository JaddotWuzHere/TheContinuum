import { TRANSLATIONS } from "../../i18n"

type SiteLang = "en" | "zh" | "fr" | "ja"

type ContentIndexEntry = {
  slug?: string
  [key: string]: unknown
}

type ContentIndex = Record<string, ContentIndexEntry>

type TranslationRegistryEntry = Partial<Record<SiteLang, string>>
type TranslationRegistry = Record<string, TranslationRegistryEntry>

declare const fetchData: Promise<ContentIndex>

const continuum404Copy = {
  en: TRANSLATIONS["en-US"].pages,
  zh: TRANSLATIONS["zh-CN"].pages,
  fr: TRANSLATIONS["fr-FR"].pages,
  ja: TRANSLATIONS["ja-JP"].pages,
}

function decodePathPart(part: string): string {
  try {
    return decodeURIComponent(part)
  } catch (_) {
    return part
  }
}

function get404LangAndRest(): { lang: SiteLang; rest: string } {
  const parts = window.location.pathname
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map(decodePathPart)

  const first = (parts[0] || "").toLowerCase()

  if (first === "zh" || first === "fr" || first === "ja" || first === "en") {
    return {
      lang: first,
      rest: parts.slice(1).join("/"),
    }
  }

  return {
    lang: "en",
    rest: parts.join("/"),
  }
}

function htmlLangForSiteLang(lang: SiteLang): string {
  if (lang === "zh") return "zh-CN"
  if (lang === "fr") return "fr-FR"
  if (lang === "ja") return "ja-JP"
  return "en-US"
}

function homeForSiteLang(lang: SiteLang): string {
  if (lang === "zh") return "/zh/"
  if (lang === "fr") return "/fr/"
  if (lang === "ja") return "/ja/"
  return "/en/"
}

function pageTitleSuffixForSiteLang(lang: SiteLang): string {
  if (lang === "zh") return " | 以魔为实"
  if (lang === "fr") return " | La magie devenue réalité"
  if (lang === "ja") return " | 魔法が現実となる"
  return " | Magic Made Reality"
}

function normalizeSlugForLookup(slug: string): string {
  return slug
    .toString()
    .trim()
    .replace(/^\/+/g, "")
    .replace(/\/+/g, "/")
    .replace(/\/index$/g, "")
    .replace(/\/$/g, "")
}

function getContentIndexSlugs(contentIndex: ContentIndex): Set<string> {
  const slugs = new Set<string>()

  for (const [key, value] of Object.entries(contentIndex || {})) {
    slugs.add(normalizeSlugForLookup(key))

    if (value && typeof value === "object" && typeof value.slug === "string") {
      slugs.add(normalizeSlugForLookup(value.slug))
    }
  }

  return slugs
}

async function fetchTranslationRegistry(): Promise<TranslationRegistry> {
  try {
    const response = await fetch("/static/translations.json")

    if (!response.ok) return {}

    const data = await response.json()

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {}
    }

    return data as TranslationRegistry
  } catch (_) {
    return {}
  }
}

function findEnglishVersionFromRegistry(
  contentIndex: ContentIndex,
  translationRegistry: TranslationRegistry,
  lang: SiteLang,
  rest: string,
): string | null {
  if (lang === "en") return null
  if (!rest) return null

  const requestedRest = normalizeSlugForLookup(rest)
  const existingSlugs = getContentIndexSlugs(contentIndex)

  for (const entry of Object.values(translationRegistry || {})) {
    if (!entry || typeof entry !== "object") continue

    const localizedSlug = entry[lang]
    const englishSlug = entry.en

    if (!localizedSlug || !englishSlug) continue

    const normalizedLocalizedSlug = normalizeSlugForLookup(localizedSlug)
    const normalizedEnglishSlug = normalizeSlugForLookup("en/" + englishSlug)

    if (normalizedLocalizedSlug !== requestedRest) continue

    if (existingSlugs.has(normalizedEnglishSlug)) {
      return "/" + normalizedEnglishSlug + "/"
    }
  }

  return null
}

async function detectUntranslatedEnglishVersion(
  lang: SiteLang,
  rest: string,
): Promise<string | null> {
  if (lang === "en") return null
  if (!rest) return null

  try {
    const [contentIndex, translationRegistry] = await Promise.all([
      fetchData,
      fetchTranslationRegistry(),
    ])

    return findEnglishVersionFromRegistry(contentIndex, translationRegistry, lang, rest)
  } catch (_) {
    return null
  }
}

function set404Text(
  copy: {
    code: string
    title: string
    message: string
    viewEnglish?: string
  },
  englishHref: string | null,
): void {
  const code = document.getElementById("continuum-404-code")
  const title = document.getElementById("continuum-404-title")
  const message = document.getElementById("continuum-404-message")
  const englishLink = document.getElementById("localized-english-link")

  if (code) code.textContent = copy.code
  if (title) title.textContent = copy.title
  if (message) message.textContent = copy.message

  if (englishLink) {
    if (englishHref) {
      englishLink.textContent = copy.viewEnglish ?? ""
      englishLink.setAttribute("href", englishHref + window.location.hash)
      englishLink.removeAttribute("hidden")
    } else {
      englishLink.setAttribute("hidden", "")
      englishLink.removeAttribute("href")
    }
  }
}

async function setup404Page(): Promise<void> {
  const pageRoot = document.querySelector(".continuum-404")
  if (!pageRoot) return

  const homeLink = document.getElementById("localized-home-link")
  const backLink = document.getElementById("localized-back-link")

  const { lang, rest } = get404LangAndRest()
  const copy = continuum404Copy[lang] || continuum404Copy.en
  const localizedHome = homeForSiteLang(lang)

  document.documentElement.setAttribute("lang", htmlLangForSiteLang(lang))
  document.documentElement.setAttribute("dir", "ltr")

  if (homeLink) {
    homeLink.textContent = copy.error.returnToGenesis
    homeLink.setAttribute("href", localizedHome)
  }

  if (backLink) {
    backLink.textContent = copy.error.goBack
    backLink.setAttribute("href", localizedHome)

    const onBackClick = (event: MouseEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      if (window.history.length > 1) {
        window.history.back()
        return
      }

      window.location.assign(localizedHome)
    }

    backLink.addEventListener("click", onBackClick)

    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => backLink.removeEventListener("click", onBackClick))
    }
  }

  const englishHref = await detectUntranslatedEnglishVersion(lang, rest)
  const pageTitleSuffix = pageTitleSuffixForSiteLang(lang)

  if (englishHref) {
    set404Text(copy.untranslated, englishHref)
    document.title = copy.untranslated.title + pageTitleSuffix
    document.body.setAttribute("data-404-kind", "untranslated")
  } else {
    set404Text(copy.error, null)
    document.title = copy.error.title + pageTitleSuffix
    document.body.setAttribute("data-404-kind", "missing")
  }

  const root = document.documentElement
  root.removeAttribute("data-explorer-open")
  root.removeAttribute("data-settings-open")
  root.removeAttribute("data-search-open")

  try {
    localStorage.setItem("continuum-explorer-drawer", "closed")
    localStorage.setItem("continuum-settings-drawer", "closed")
  } catch (_) {}
}

function setup404PageIfPresent(): void {
  if (!document.querySelector(".continuum-404")) return
  void setup404Page()
}

document.addEventListener("nav", setup404PageIfPresent)
setup404PageIfPresent()