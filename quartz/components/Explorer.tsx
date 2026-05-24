import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
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
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: OrderEntries[]
}

const defaultOptions: Options = {
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
      lang = seg0 === "zh" ? "zh" : seg0 === "fr" ? "fr" : seg0 === "ja" ? "ja" : "en"
    } catch {}

    const slug = (node.slug ?? "").replace(/^\/+/, "")
    const first = slug.split("/")[0]?.toLowerCase() || ""

    if (node.isFolder && ["en", "zh", "fr", "ja"].includes(node.displayName.toLowerCase())) {
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
      lang === "zh"
        ? "zh-CN"
        : lang === "fr"
          ? "fr-FR"
          : lang === "ja"
            ? "ja-JP"
            : "en-US"
    ) as I18nLocale

    return (
      <div
        class={classNames(displayClass, "explorer")}
        data-data-fns={JSON.stringify({
          order: opts.order,
          sortFn: opts.sortFn.toString(),
          filterFn: opts.filterFn.toString(),
          mapFn: opts.mapFn.toString(),
        })}
      >
        <div class="explorer-header">
          <h2 class="explorer-title">{i18n(locale).components.explorer.title}</h2>

          <div class="explorer-search-row">
            <SidebarSearch {...props} />
          </div>
        </div>

        <div id={id} class="explorer-content" role="group">
          <nav class="explorer-drill-header" aria-label={i18n(locale).components.explorer.folderPathAriaLabel}></nav>
          <OverflowList class="explorer-ul" />
        </div>
      </div>
    )
  }

  Explorer.afterDOMLoaded = concatenateResources(
    script,
    searchScript,
    overflowListAfterDOMLoaded,
  )

  return Explorer
}) satisfies QuartzComponentConstructor