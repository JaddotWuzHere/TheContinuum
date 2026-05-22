import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/search.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { localeFromSlug, toI18nLocale } from "../util/locale"

export interface SearchOptions {
  enablePreview: boolean
}

const defaultOptions: SearchOptions = {
  enablePreview: true,
}

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const opts = { ...defaultOptions, ...userOpts }

  const lang =
    fileData.frontmatter?.lang ??
    localeFromSlug(fileData.slug ?? "/en/")

  const locale = toI18nLocale(lang as "en" | "zh" | "fr" | "ja")
  const t = i18n(locale).components.search

    return (
      <div class={classNames(displayClass, "search")}>
        <button class="search-button">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
            <title>{t.title}</title>
            <g class="search-path" fill="none">
              <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
              <circle cx="8" cy="8" r="7" />
            </g>
          </svg>
          <p>{t.title}</p>
        </button>

        <div class="search-container">
          <div class="search-space">
            <div class="search-header">
              <button
                class="search-close-button"
                type="button"
                aria-label={t.returnButton}
              >
                <span class="search-close-button-icon" aria-hidden="true">↶</span>
                <span class="search-close-button-label">{t.returnButton}</span>
              </button>
            </div>

            <div class="search-bar-frame">
              <div class="search-bar-runic-line search-bar-runic-line-top" />
              <div class="search-bar-runic-line search-bar-runic-line-bottom" />

              <input
                autocomplete="off"
                class="search-bar"
                name="search"
                type="text"
                aria-label={t.searchBarPlaceholder}
                placeholder={t.searchBarPlaceholder}
              />
            </div>

            <div class="search-layout" data-preview={opts.enablePreview}></div>
          </div>
        </div>
      </div>
    )
  }

  Search.afterDOMLoaded = script

  return Search
}) satisfies QuartzComponentConstructor