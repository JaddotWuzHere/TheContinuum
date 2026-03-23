import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/explorer.scss"
import searchStyle from "./styles/search.scss"
import { localeFromSlug } from "../util/locale"

// @ts-ignore
import script from "./scripts/explorer.inline"
// @ts-ignore
import searchScript from "./scripts/search.inline"

import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { FileTrieNode } from "../util/fileTrie"
import OverflowListFactory from "./OverflowList"
import SearchFactory from "./Search"
import { concatenateResources } from "../util/resources"

type OrderEntries = "sort" | "filter" | "map"

export interface Options {
  title?: string
  folderDefaultState: "collapsed" | "open"
  folderClickBehavior: "collapse" | "link"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: OrderEntries[]
}

const defaultOptions: Options = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  mapFn: (node) => node,
  sortFn: (a, b) => {
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }
    return !a.isFolder && b.isFolder ? 1 : -1
  },

  filterFn: (node) => {
    if (node.slugSegment === "tags") return false

    let lang = "en"
    try {
      const seg0 = window.location.pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase()
      lang = seg0 === "zh" ? "zh" : seg0 === "fr" ? "fr" : "en"
    } catch {}

    const slug = (node.slug ?? "").replace(/^\/+/, "")
    const first = slug.split("/")[0]?.toLowerCase() || ""

    if (node.isFolder && ["en", "zh", "fr"].includes(node.displayName)) {
      return node.displayName.toLowerCase() === lang
    }

    return first === lang
  },

  order: ["filter", "map", "sort"],
}

let numExplorers = 0

export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()
  const SidebarSearch = SearchFactory()

  const Explorer: QuartzComponent = (props: QuartzComponentProps) => {
    const { displayClass, fileData } = props
    const id = `explorer-${numExplorers++}`

    const lang = localeFromSlug(fileData?.slug ?? "/en/")
    type I18nLocale = Parameters<typeof i18n>[0]
    const locale = (
      lang === "zh" ? "zh-CN" :
      lang === "fr" ? "fr-FR" :
      "en-US"
    ) as I18nLocale

    return (
      <div
        class={classNames(displayClass, "explorer")}
        data-behavior={opts.folderClickBehavior}
        data-collapsed={opts.folderDefaultState}
        data-savestate={opts.useSavedState}
        data-data-fns={JSON.stringify({
          order: opts.order,
          sortFn: opts.sortFn.toString(),
          filterFn: opts.filterFn.toString(),
          mapFn: opts.mapFn.toString(),
        })}
      >
        <div class="explorer-header">
          <h2 class="explorer-title">Explorer</h2>

          <div class="explorer-search-row">
            <SidebarSearch {...props} />
          </div>
        </div>

        <div id={id} class="explorer-content" aria-expanded={false} role="group">
          <OverflowList class="explorer-ul" />
        </div>

        <template id="template-file">
          <li>
            <a href="#"></a>
          </li>
        </template>

        <template id="template-folder">
          <li>
            <div class="folder-container">
              <button
                class="folder-toggle"
                type="button"
                aria-label="Toggle folder"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="5 8 14 8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="folder-icon"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div>
                <button class="folder-button">
                  <span class="folder-title"></span>
                </button>
              </div>
            </div>
            <div class="folder-outer">
              <ul class="content"></ul>
            </div>
          </li>
        </template>
      </div>
    )
  }

  Explorer.css = concatenateResources(style, searchStyle)
  Explorer.afterDOMLoaded = concatenateResources(
    script,
    searchScript,
    overflowListAfterDOMLoaded,
  )

  return Explorer
}) satisfies QuartzComponentConstructor