import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, simplifySlug } from "../util/path"
import { i18n } from "../i18n"
import { localeFromSlug, toI18nLocale } from "../util/locale"

// @ts-ignore
import script from "./scripts/mobileUtilityBar.inline"

type ContinuumLang = "en" | "zh" | "fr" | "ja"

function getLocale(fileData: QuartzComponentProps["fileData"], cfg: QuartzComponentProps["cfg"]) {
  const lang = fileData.frontmatter?.lang ?? localeFromSlug(fileData.slug ?? "/en/")
  return toI18nLocale(lang as ContinuumLang) ?? cfg.locale
}

export default (() => {
  const MobileUtilityBar: QuartzComponent = ({ fileData, allFiles, cfg }: QuartzComponentProps) => {
    const locale = getLocale(fileData, cfg)
    const t = i18n(locale)

    const toc = fileData.toc ?? []
    const slug = simplifySlug(fileData.slug!)
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug))

    const hasToc = toc.length > 0
    const hasBacklinks = backlinkFiles.length > 0

    return (
      <div class="mobile-utility-shell mobile-only">
        <nav class="mobile-utility-bar" aria-label={t.components.mobileUtilityBar.ariaLabel}>
          {hasToc && (
            <button
              type="button"
              class="mobile-utility-button"
              data-mobile-tool="outline"
              aria-expanded="false"
            >
              <span>{t.components.tableOfContents.title}</span>
            </button>
          )}

          {hasBacklinks && (
            <button
              type="button"
              class="mobile-utility-button"
              data-mobile-tool="references"
              aria-expanded="false"
            >
              <span>{t.components.backlinks.title}</span>
            </button>
          )}
        </nav>

        {hasToc && (
          <section class="mobile-tool-panel mobile-tool-panel-outline" data-mobile-panel="outline">
            <header class="mobile-tool-panel-header">
              <h2>{t.components.tableOfContents.title}</h2>
            </header>

            <ul class="mobile-tool-list mobile-tool-toc-list">
              {toc.map((tocEntry) => (
                <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
                  <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                    {tocEntry.text}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasBacklinks && (
          <section
            class="mobile-tool-panel mobile-tool-panel-references"
            data-mobile-panel="references"
          >
            <header class="mobile-tool-panel-header">
              <h2>{t.components.backlinks.title}</h2>
            </header>

            <ul class="mobile-tool-list mobile-tool-reference-list">
              {backlinkFiles.map((f) => (
                <li key={f.slug}>
                  <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
                    {f.frontmatter?.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  MobileUtilityBar.afterDOMLoaded = script

  return MobileUtilityBar
}) satisfies QuartzComponentConstructor
