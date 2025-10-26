import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { getLangFromSlug, swapLangPath } from "../util/i18n"

const LanguageSwitcher: QuartzComponent = ({ fileData }) => {
  const currentLang = getLangFromSlug(fileData.slug)

  // Simple anchors; we compute href on click so it keeps subpath.
  function go(target: "en" | "zh") {
    const href = swapLangPath(window.location.pathname, target)
    // optional fallback: if target page 404s, send to target home
    fetch(href, { method: "HEAD" }).then(r => {
      window.location.href = r.ok ? href : `/${target}/`
    }).catch(() => { window.location.href = `/${target}/` })
  }

  const active = (l: "en" | "zh") => currentLang === l ? { opacity: 0.5, pointerEvents: "none" } : undefined

  return (
    <div class="lang-switcher" style={{ display: "flex", gap: "0.5rem" }}>
      <button onClick={() => go("en")} style={active("en")}>EN</button>
      <button onClick={() => go("zh")} style={active("zh")}>中文</button>
    </div>
  )
}

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor

