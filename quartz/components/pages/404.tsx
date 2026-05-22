import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { TRANSLATIONS, i18n } from "../../i18n"

const notFoundScript = `

const continuum404Copy = ${JSON.stringify({
  en: TRANSLATIONS["en-US"].pages,
  zh: TRANSLATIONS["zh-CN"].pages,
  fr: TRANSLATIONS["fr-FR"].pages,
  ja: TRANSLATIONS["ja-JP"].pages,
})}

function get404LangAndRest() {
  const parts = window.location.pathname
    .replace(/^\\/+/g, "")
    .replace(/\\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part)
      } catch (_) {
        return part
      }
    })

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

function htmlLangForSiteLang(lang) {
  if (lang === "zh") return "zh-CN"
  if (lang === "fr") return "fr-FR"
  if (lang === "ja") return "ja-JP"
  return "en-US"
}

function normalizeSlugForLookup(slug) {
  return slug
    .toString()
    .trim()
    .replace(/^\\/+/g, "")
    .replace(/\\/+/g, "/")
    .replace(/\\/index$/g, "")
    .replace(/\\/$/g, "")
}

function getContentIndexSlugs(contentIndex) {
  const slugs = new Set()

  for (const [key, value] of Object.entries(contentIndex || {})) {
    slugs.add(normalizeSlugForLookup(key))

    if (value && typeof value === "object" && typeof value.slug === "string") {
      slugs.add(normalizeSlugForLookup(value.slug))
    }
  }

  return slugs
}

async function fetchTranslationRegistry() {
  try {
    const response = await fetch("/static/translations.json")

    if (!response.ok) return {}

    return await response.json()
  } catch (_) {
    return {}
  }
}

function findEnglishVersionFromRegistry(contentIndex, translationRegistry, lang, rest) {
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

async function detectUntranslatedEnglishVersion(lang, rest) {
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

function set404Text(copy, englishHref) {
  const code = document.getElementById("continuum-404-code")
  const title = document.getElementById("continuum-404-title")
  const message = document.getElementById("continuum-404-message")
  const englishLink = document.getElementById("localized-english-link")

  if (code) code.textContent = copy.code
  if (title) title.textContent = copy.title
  if (message) message.textContent = copy.message

  if (englishLink) {
    if (englishHref) {
      englishLink.textContent = copy.viewEnglish
      englishLink.setAttribute("href", englishHref + window.location.hash)
      englishLink.removeAttribute("hidden")
    } else {
      englishLink.setAttribute("hidden", "")
      englishLink.removeAttribute("href")
    }
  }
}

async function setup404Page() {
  const homeLink = document.getElementById("localized-home-link")
  const backLink = document.getElementById("localized-back-link")

  const fallbackHome = "/en/"
  const { lang, rest } = get404LangAndRest()
  const copy = continuum404Copy[lang] || continuum404Copy.en

  const localizedHome =
    lang === "zh"
      ? "/zh/"
      : lang === "fr"
        ? "/fr/"
        : lang === "ja"
          ? "/ja/"
          : "/en/"

  document.documentElement.setAttribute("lang", htmlLangForSiteLang(lang))
  document.documentElement.setAttribute("dir", "ltr")
          
  if (homeLink) {
    homeLink.textContent = copy.error.returnToGenesis
    homeLink.setAttribute("href", localizedHome)
  }

  if (backLink) {
    backLink.textContent = copy.error.goBack
    backLink.setAttribute("href", localizedHome)

    const onBackClick = function (e) {
      e.preventDefault()
      e.stopPropagation()

      if (window.history.length > 1) {
        window.history.back()
        return
      }

      window.location.assign(localizedHome || fallbackHome)
    }

    backLink.addEventListener("click", onBackClick)
    window.addCleanup(() => backLink.removeEventListener("click", onBackClick))
  }

  const englishHref = await detectUntranslatedEnglishVersion(lang, rest)

  if (englishHref) {
    set404Text(copy.untranslated, englishHref)
    document.body.setAttribute("data-404-kind", "untranslated")
  } else {
    set404Text(copy.error, null)
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

document.addEventListener("nav", setup404Page)
setup404Page()
`

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const fallbackHome = "/en/"
  const t = i18n(cfg.locale).pages.error

  return (
    <article class="continuum-404 popover-hint">
      <div class="continuum-404-inner">
        <div id="continuum-404-code" class="continuum-404-code">{t.code}</div>

        <div class="continuum-404-divider" />

        <h2 id="continuum-404-title" class="continuum-404-title">{t.title}</h2>

        <p id="continuum-404-message" class="continuum-404-text">
          {t.message}
        </p>

        <div class="continuum-404-actions">
          <a
            id="localized-back-link"
            class="continuum-404-button"
            href={fallbackHome}
            data-router-ignore
          >
            {t.goBack}
          </a>

          <a
            id="localized-english-link"
            class="continuum-404-button"
            hidden
          >
            {i18n(cfg.locale).pages.untranslated.viewEnglish}
          </a>

          <a
            id="localized-home-link"
            class="continuum-404-button"
            href={fallbackHome}
          >
            {t.returnToGenesis}
          </a>
        </div>
      </div>
    </article>
  )
}

NotFound.afterDOMLoaded = notFoundScript

NotFound.css = `
.continuum-404 {
  display: flex;
  justify-content: center;
  padding: 4rem 1rem;
}

.continuum-404-inner {
  text-align: center;
  max-width: 480px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.continuum-404-code {
  font-size: 3rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1.1;
  color: rgba(255,255,255,0.88);
  text-shadow:
    0 0 8px rgba(255, 215, 120, 0.12),
    0 1px 0 rgba(0, 0, 0, 0.45);
}

.continuum-404-divider {
  width: 80px;
  height: 1px;
  margin: 1.2rem auto 1.4rem;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(186,154,86,0.6),
    transparent
  );
}

.continuum-404-title {
  font-size: 1.4rem;
  line-height: 1.25;
  margin: 0 0 0.6rem 0;
  color: rgba(255,255,255,0.9);
}

.continuum-404-text {
  color: rgba(255,255,255,0.68);
  margin: 0 0 1.6rem;
  line-height: 1.55;
}

.continuum-404-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.continuum-404-button {
  display: inline-block;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(186,154,86,0.45);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255,255,255,0.88);
  background: rgba(8, 8, 8, 0.18);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.continuum-404-button:hover {
  border-color: rgba(210,180,105,0.78);
  background: rgba(186,154,86,0.1);
  color: rgba(255,255,255,0.96);
  box-shadow: 0 0 12px rgba(210,180,105,0.08);
}

.continuum-404-button[hidden] {
  display: none !important;
}

body[data-slug="404"] .continuum-404 {
  min-height: min(54vh, 32rem);
  align-items: center;
  padding: 4.5rem 1rem 3rem;
}

body[data-slug="404"] .continuum-404-inner {
  width: min(42rem, calc(100vw - 3rem));
  max-width: min(42rem, calc(100vw - 3rem));
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

html[lang|="en"] .continuum-404,
html[lang|="fr"] .continuum-404 {
  font-family: "EBGaramond", serif;
}

html[lang|="zh"] .continuum-404 {
  font-family: "EBGaramond", "LXGWWenKai", serif;
}

html[lang|="zh"] .continuum-404-code {
  font-family: "EBGaramond", "STXINGKA", "SentyWEN2017", serif;
  letter-spacing: 0.08em;
}

html[lang|="zh"] .continuum-404-title,
html[lang|="zh"] .continuum-404-text,
html[lang|="zh"] .continuum-404-button {
  font-family: "EBGaramond", "LXGWWenKai", serif;
}

html[lang|="ja"] .continuum-404 {
  font-family:
    "EBGaramond",
    "Hiragino Mincho ProN",
    "Yu Mincho",
    "YuMincho",
    "Noto Serif JP",
    serif;
}

html[lang|="ja"] .continuum-404-code,
html[lang|="ja"] .continuum-404-title,
html[lang|="ja"] .continuum-404-text,
html[lang|="ja"] .continuum-404-button {
  font-family:
    "EBGaramond",
    "Hiragino Mincho ProN",
    "Yu Mincho",
    "YuMincho",
    "Noto Serif JP",
    serif;
}

body[data-slug="404"] .continuum-explorer-handle,
body[data-slug="404"] .continuum-settings-handle,
body[data-slug="404"] .continuum-explorer-scrim,
body[data-slug="404"] .continuum-settings-scrim,
body[data-slug="404"] .explorer,
body[data-slug="404"] .settings-panel {
  display: none !important;
}

@media all and (max-width: 700px) {
  body[data-slug="404"] .continuum-404 {
    padding: 3.25rem 1rem 2.25rem;
  }

  .continuum-404-code {
    font-size: 2.45rem;
  }

  .continuum-404-title {
    font-size: 1.2rem;
  }
}
`

export default (() => NotFound) satisfies QuartzComponentConstructor