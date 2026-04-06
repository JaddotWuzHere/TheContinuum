import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { i18n } from "../../i18n"

const notFoundScript = `
function setup404Page() {
  const homeLink = document.getElementById("localized-home-link")
  const backLink = document.getElementById("localized-back-link")

  const fallbackHome = "/en/"
  let lang = "en"
  let first = window.location.pathname.replace(/^\\/+/, "").split("/")[0]

  if (first) {
    first = first.toLowerCase()
    if (first === "zh") lang = "zh"
    else if (first === "fr") lang = "fr"
    else if (first === "ja") lang = "ja"
  }

  const localizedHome =
    lang === "zh"
      ? "/zh/"
      : lang === "fr"
        ? "/fr/"
        : lang === "ja"
          ? "/ja/"
          : "/en/"

  if (homeLink) {
    homeLink.setAttribute("href", localizedHome)
  }

  if (backLink) {
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
        <div class="continuum-404-code">{t.code}</div>

        <div class="continuum-404-divider" />

        <h2 class="continuum-404-title">{t.title}</h2>

        <p class="continuum-404-text">
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
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.85);
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
  margin: 0 0 0.6rem 0;
}

.continuum-404-text {
  color: rgba(255,255,255,0.65);
  margin-bottom: 1.6rem;
}

.continuum-404-button {
  display: inline-block;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(186,154,86,0.4);
  text-decoration: none;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.85);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.continuum-404-button:hover {
  border-color: rgba(186,154,86,0.7);
  background: rgba(186,154,86,0.08);
}

body[data-slug="404"] .continuum-explorer-handle,
body[data-slug="404"] .continuum-settings-handle,
body[data-slug="404"] .continuum-explorer-scrim,
body[data-slug="404"] .continuum-settings-scrim,
body[data-slug="404"] .explorer,
body[data-slug="404"] .settings-panel {
  display: none !important;
}

.continuum-404-actions {
  display: flex;
  justify-content: center;
  gap: 0.7rem;
}
`

export default (() => NotFound) satisfies QuartzComponentConstructor