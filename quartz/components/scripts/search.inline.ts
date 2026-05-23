import FlexSearch from "flexsearch"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { registerEscapeHandler, removeAllChildren, lockPageScroll, unlockPageScroll } from "./util"
import { FullSlug, normalizeRelativeURLs, resolveRelative } from "../../util/path"
import { i18n } from "../../i18n"
import { localeFromSlug, toI18nLocale } from "../../util/locale"
import { slug as slugAnchor } from "github-slugger"
import {
  filterIgnoredSearchSectionHeadings,
  isIgnoredSearchSectionHeading,
  loadIgnoredSearchSectionHeadings,
} from "../../util/search-ignored-sections"

type ContentIndex = Record<FullSlug, ContentDetails>

type SearchResultKind = "page" | "section"

interface IndexedDocument {
  id: number
  slug: FullSlug
  title: string
  aliases: string
  headings: string
  content: string
  [key: string]: any
}

interface Item extends IndexedDocument {
  resultKey: string
  kind: SearchResultKind
  matchedHeading?: string
}

declare global {
  interface Window {
    __continuumSearchContainer?: HTMLElement
    __continuumSearchInitialized?: boolean
    __continuumSearchHide?: ((options?: { skipFocus?: boolean }) => Promise<void>) | null
  }
}

type SearchType = "basic"
let searchType: SearchType = "basic"
let currentSearchTerm: string = ""
let activeSearchSlug: FullSlug | null = null

const CJK_CHAR_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u

const encoder = (str: string) => {
  const normalized = str.toLowerCase().normalize("NFKC")
  const tokens: string[] = []
  let latinBuffer = ""
  let cjkBuffer = ""

  const flushLatin = () => {
    const words = latinBuffer
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)

    tokens.push(...words)
    latinBuffer = ""
  }

  const flushCJK = () => {
    if (cjkBuffer.length === 0) return

    tokens.push(...Array.from(cjkBuffer))

    const chars = Array.from(cjkBuffer)
    for (let i = 0; i < chars.length - 1; i++) {
      tokens.push(chars[i] + chars[i + 1])
    }

    tokens.push(cjkBuffer)

    cjkBuffer = ""
  }

  for (const char of normalized) {
    if (CJK_CHAR_RE.test(char)) {
      flushLatin()
      cjkBuffer += char
    } else {
      flushCJK()
      latinBuffer += char
    }
  }

  flushLatin()
  flushCJK()

  return [...new Set(tokens)]
}

const shouldMatchSearchToken = (textToken: string, searchToken: string) => {
  const lowerTextToken = textToken.toLowerCase()
  const lowerSearchToken = searchToken.toLowerCase()

  if (CJK_CHAR_RE.test(lowerSearchToken)) {
    return lowerTextToken.includes(lowerSearchToken)
  }

  return lowerTextToken.startsWith(lowerSearchToken)
}

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

let index = new FlexSearch.Document<IndexedDocument>({
  encode: encoder,
  document: {
    id: "id",
    index: [
      {
        field: "title",
        tokenize: "forward",
      },
      {
        field: "aliases",
        tokenize: "forward",
      },
      {
        field: "headings",
        tokenize: "forward",
      },
    ],
  },
})

function getCurrentSearchLocale() {
  return localeFromSlug(activeSearchSlug ?? window.location.pathname)
}

function isSlugInCurrentSearchLocale(slug: FullSlug) {
  return localeFromSlug(slug) === getCurrentSearchLocale()
}

function getSearchI18n() {
  return i18n(toI18nLocale(getCurrentSearchLocale())).components.search
}

const p = new DOMParser()
const fetchContentCache: Map<FullSlug, Element[]> = new Map()
const contextWindowWords = 30
const numSearchResults = 8
const rawSearchResultLimit = numSearchResults * 24
const SEARCH_RENDER_DEBOUNCE_MS = 315
type ResultAnimationMode = "full" | "soft" | "none"

const ignoredPreviewSelector = [
  "script",
  "style",
  ".breadcrumb-container",
  ".tag-link",
  ".external-icon",
  `.callout[data-callout="epigraph"]`,
].join(", ")

const ignoredPreviewRootSelector = `.callout[data-callout="epigraph"]`

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

const tokenizeTerm = (term: string) => {
  const tokens = term.split(/\s+/).filter((t) => t.trim() !== "")
  const tokenLen = tokens.length

  if (tokenLen > 1) {
    for (let i = 1; i < tokenLen; i++) {
      tokens.push(tokens.slice(0, i + 1).join(" "))
    }
  }

  return tokens.sort((a, b) => b.length - a.length)
}

function closeExplorerDrawer() {
  document.documentElement.removeAttribute("data-explorer-open")
  unlockPageScroll()

  try {
    localStorage.setItem("continuum-explorer-drawer", "closed")
  } catch {
  }
}

function closeSettingsDrawer() {
  document.documentElement.removeAttribute("data-settings-open")
  unlockPageScroll()

  try {
    localStorage.setItem("continuum-settings-drawer", "closed")
  } catch {
  }
}

function highlight(searchTerm: string, text: string, trim?: boolean) {
  const tokenizedTerms = tokenizeTerm(searchTerm)
  let tokenizedText = text.split(/\s+/).filter((t) => t !== "")

  let startIndex = 0
  let endIndex = tokenizedText.length - 1

  if (trim) {
    const includesCheck = (tok: string) =>
      tokenizedTerms.some((term) => shouldMatchSearchToken(tok, term))

    const occurrencesIndices = tokenizedText.map(includesCheck)

    let bestSum = 0
    let bestIndex = 0

    for (let i = 0; i < Math.max(tokenizedText.length - contextWindowWords, 0); i++) {
      const window = occurrencesIndices.slice(i, i + contextWindowWords)
      const windowSum = window.reduce((total, cur) => total + (cur ? 1 : 0), 0)

      if (windowSum >= bestSum) {
        bestSum = windowSum
        bestIndex = i
      }
    }

    startIndex = Math.max(bestIndex - contextWindowWords, 0)
    endIndex = Math.min(startIndex + 2 * contextWindowWords, tokenizedText.length - 1)
    tokenizedText = tokenizedText.slice(startIndex, endIndex)
  }

  const originalLength = tokenizedText.length
  const slice = tokenizedText
    .map((tok) => {
      for (const searchTok of tokenizedTerms) {
        if (shouldMatchSearchToken(tok, searchTok)) {
          const regex = new RegExp(escapeRegExp(searchTok), "gi")
          return tok.replace(regex, `<span class="highlight">$&</span>`)
        }
      }

      return tok
    })
    .join(" ")

  return `${startIndex === 0 ? "" : "..."}${slice}${endIndex === originalLength - 1 ? "" : "..."}`
}

const escapeHTML = (text: string) => {
  const span = document.createElement("span")
  span.textContent = text
  return span.innerHTML
}

const stripMarkdown = (text: string) => {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const truncateText = (text: string, maxLength = 150) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}

const normalizeHeadingText = (text: string) => {
  return text
    .normalize("NFKD")
    .replace(/[¶#]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

const headingScore = (rendered: string, target: string) => {
  if (!rendered || !target) return 0
  if (rendered === target) return 100
  if (rendered.includes(target)) return 90
  if (target.includes(rendered)) return 80

  const renderedWords = new Set(rendered.split(" ").filter(Boolean))
  const targetWords = target.split(" ").filter(Boolean)

  if (targetWords.length === 0) return 0

  const matchedWords = targetWords.filter((word) => renderedWords.has(word)).length
  return matchedWords / targetWords.length
}

async function setupSearch(searchElement: Element, currentSlug: FullSlug, data: ContentIndex) {
  activeSearchSlug = currentSlug

  let container = searchElement.querySelector(".search-container") as HTMLElement
  if (!container) return

  if (window.__continuumSearchContainer && window.__continuumSearchContainer !== container) {
    container.remove()
    container = window.__continuumSearchContainer
  } else {
    window.__continuumSearchContainer = container
  }

  const searchButton = searchElement.querySelector(".search-button") as HTMLButtonElement
  if (!searchButton) return

  const closeButton = container.querySelector(".search-close-button") as HTMLButtonElement | null

  const searchBar = container.querySelector(".search-bar") as HTMLInputElement
  if (!searchBar) return

  const searchLayout = container.querySelector(".search-layout") as HTMLElement
  if (!searchLayout) return

  const sidebar = searchElement.closest(".sidebar") as HTMLElement | null

  const searchSpace = container.querySelector(".search-space") as HTMLElement
  if (!searchSpace) return

  const scheduleViewportSync = () => {
  }

  if (container.parentElement !== document.body) {
    document.body.appendChild(container)
  }

  const dataMap = data
  const idDataMap = Object.keys(dataMap) as FullSlug[]

  const appendLayout = (el: HTMLElement) => {
    searchLayout.appendChild(el)
  }

  let isClosing = false
  let openRaf = 0
  let previewToken = 0
  let searchDebounceTimer: number | null = null
  let searchRequestToken = 0
  let hasRenderedSearchResults = false
  let selectedResult: HTMLElement | null = null
  let currentHover: HTMLElement | null = null

  const isHoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches
  const shouldAutoPreviewResults = isHoverCapable

  const enablePreview = searchLayout.dataset.preview === "true"
  let previewInner: HTMLDivElement | null = null

  const existingResults = searchLayout.querySelector(".results-container") as HTMLDivElement | null
  const results: HTMLDivElement = existingResults ?? (() => {
    const el = document.createElement("div")
    el.className = "results-container"
    appendLayout(el)
    return el
  })()

  const existingPreview = searchLayout.querySelector(".preview-container") as HTMLDivElement | null
  let preview: HTMLDivElement | undefined = existingPreview ?? undefined

  if (enablePreview && !preview) {
    const el = document.createElement("div")
    el.className = "preview-container"
    appendLayout(el)
    preview = el
  }

  const applySearchChromeLabels = () => {
    const t = getSearchI18n()

    results.dataset.resultIndex = t.resultIndex

    if (preview) {
      preview.dataset.awaitingSelection = t.awaitingSelection
    }
  }

  applySearchChromeLabels()

  function resolveUrl(slug: FullSlug): URL {
    return new URL(resolveRelative(activeSearchSlug ?? currentSlug, slug), location.toString())
  }

  function hideSearch(options?: { skipFocus?: boolean }): Promise<void> {
    if (!container.classList.contains("active") || isClosing) {
      return Promise.resolve()
    }

    isClosing = true
    document.documentElement.removeAttribute("data-search-open")
    unlockPageScroll()
    container.classList.remove("animating-in")
    container.classList.add("animating-out")

    return new Promise((resolve) => {
      const finishClose = () => {
        container.classList.remove("active")
        container.classList.remove("animating-out")
        searchBar.value = ""

        if (sidebar) {
          sidebar.style.zIndex = ""
        }

        if (searchDebounceTimer !== null) {
          window.clearTimeout(searchDebounceTimer)
          searchDebounceTimer = null
        }

        searchRequestToken++
        hasRenderedSearchResults = false
        results.classList.remove("results-refreshing", "results-animate-full", "results-animate-soft")
        removeAllChildren(results)

        if (preview) {
          removeAllChildren(preview)
          preview.classList.remove("preview-switching-out", "preview-switching-in")
        }

        searchLayout.classList.remove("display-results")
        searchType = "basic"
        currentSearchTerm = ""
        currentHover = null
        selectedResult = null
        previewToken++
        isClosing = false

        if (!options?.skipFocus) {
          searchButton.focus()
        }

        resolve()
      }

      let finished = false

      const done = () => {
        if (finished) return
        finished = true
        finishClose()
      }

      const onAnimationEnd = (ev: AnimationEvent) => {
        if (ev.target !== container) return
        container.removeEventListener("animationend", onAnimationEnd)
        done()
      }

      container.addEventListener("animationend", onAnimationEnd)
      window.setTimeout(done, 260)
    })
  }

  window.__continuumSearchHide = hideSearch

  function showSearch(mode: SearchType = "basic") {
    applySearchChromeLabels()

    closeExplorerDrawer()
    closeSettingsDrawer()

    cancelAnimationFrame(openRaf)
    isClosing = false
    document.documentElement.setAttribute("data-search-open", "1")
    lockPageScroll()

    if (sidebar) {
      sidebar.style.zIndex = "16"
    }

    if (!container.classList.contains("active")) {
      container.classList.add("active")
      container.classList.remove("animating-out")
      void container.offsetWidth
    }

    searchType = mode
    currentSearchTerm = searchBar.value

    searchLayout.classList.add("display-results")

    if (searchBar.value.trim() === "") {
      searchRequestToken++
      hasRenderedSearchResults = false
      currentHover = null
      selectedResult = null

      results.classList.remove("results-refreshing", "results-animate-full", "results-animate-soft")
      removeAllChildren(results)

      const t = getSearchI18n()
      results.innerHTML = `<a class="result-card no-match">
        <h3>${t.beginSearchingTitle}</h3>
        <p class="card-description">${t.beginSearchingText}</p>
      </a>`

      if (preview) {
        previewToken++
        removeAllChildren(preview)
        preview.classList.remove("preview-switching-out", "preview-switching-in")
      }
    }

    container.classList.remove("animating-out")
    container.classList.add("animating-in")

    openRaf = requestAnimationFrame(() => {
      searchBar.focus()
      searchBar.select()
      scheduleViewportSync()
    })
  }

  function shortcutHandler(e: KeyboardEvent) {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
      const active = document.activeElement
      const typingInInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)

      if (typingInInput) return

      e.preventDefault()
      showSearch("basic")
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      showSearch("basic")
    }
  }

  const tokenizeSearchableText = (text: string) => {
    return encoder(text)
  }

  const includesSearchTerm = (text: string, term: string) => {
    const textTokens = tokenizeSearchableText(text)
    const termTokens = tokenizeSearchableText(term)

    if (termTokens.length === 0) return false

    return termTokens.every((termToken) =>
      textTokens.some((textToken) => shouldMatchSearchToken(textToken, termToken)),
    )
  }

  const findMatchingEntry = (entries: string[], term: string) => {
    return entries.find((entry) => includesSearchTerm(entry, term))
  }

  const getTextPreviewAfterHeading = (headingEl: HTMLElement) => {
    const sectionLevel = Number(headingEl.tagName.slice(1))
    const bodyParts: string[] = []
    let bodyTextLength = 0

    let current = headingEl.nextElementSibling

    while (current) {
      const tag = current.tagName.toLowerCase()

      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag.slice(1))

        if (level <= sectionLevel) {
          break
        }

        current = current.nextElementSibling
        continue
      }

      const cloned = current.cloneNode(true) as HTMLElement

      if (cloned.matches(ignoredPreviewRootSelector)) {
        current = current.nextElementSibling
        continue
      }

      cloned.querySelectorAll(ignoredPreviewSelector).forEach((el) => {
        el.remove()
      })

      const rawText = (cloned.textContent ?? "").replace(/\s+/g, " ").trim()


      if (/^(statement|formal expression|where):$/i.test(rawText)) {
        current = current.nextElementSibling
        continue
      }

      cloned.querySelectorAll("a").forEach((link) => {
        link.replaceWith(...link.childNodes)
      })

      cloned.querySelectorAll(".katex-display").forEach((displayMath) => {
        displayMath.replaceWith(...displayMath.childNodes)
      })

      cloned.querySelectorAll("p, blockquote").forEach((block) => {
        block.replaceWith(...block.childNodes, document.createTextNode(" "))
      })

      cloned.querySelectorAll("br").forEach((br) => {
        br.replaceWith(" ")
      })

      let html = ""
      const text = (cloned.textContent ?? "").replace(/\s+/g, " ").trim()

      if (tag === "ul" || tag === "ol") {
        const items = [...cloned.querySelectorAll(":scope > li")]
          .map((li) => li.innerHTML.replace(/\s+/g, " ").trim())
          .filter(Boolean)

        html = items.length > 0 ? `${items.join(", ")}.` : ""
      } else {
        html = cloned.innerHTML.replace(/\s+/g, " ").trim()
      }

      if (html && text) {
        bodyParts.push(html)
        bodyTextLength += text.length
      }

      if (bodyTextLength > 220) {
        break
      }

      current = current.nextElementSibling
    }

    return bodyParts.join(" ")
  }

  const getTextPreviewForPage = (root: HTMLElement) => {
    const fakePageHeading = document.createElement("h1")
    root.insertBefore(fakePageHeading, root.firstElementChild)

    const pagePreview = getTextPreviewAfterHeading(fakePageHeading)
    fakePageHeading.remove()

    if (pagePreview) {
      return pagePreview
    }

    const firstHeading = root.querySelector("h1, h2, h3, h4, h5, h6") as HTMLElement | null
    return firstHeading ? getTextPreviewAfterHeading(firstHeading) : ""
  }

  const findHeadingElement = (root: HTMLElement, headingText: string) => {
    const target = normalizeHeadingText(headingText)

    const candidates = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .map((heading) => {
        const rendered = normalizeHeadingText(heading.textContent ?? "")

        return {
          heading: heading as HTMLElement,
          score: headingScore(rendered, target),
        }
      })
      .filter((candidate) => candidate.score >= 0.65)
      .sort((a, b) => b.score - a.score)

    return candidates[0]?.heading
  }

  const formatPageResultForDisplay = (term: string, id: number): Item | undefined => {
    const slug = idDataMap[id]
    const entry = dataMap[slug]

    const aliases = entry.aliases ?? []
    const headings = filterIgnoredSearchSectionHeadings(entry.headings ?? [])

    const matchingAlias = findMatchingEntry(aliases, term)
    const titleMatches = includesSearchTerm(entry.title, term)

    if (!titleMatches && !matchingAlias) return undefined

    return {
      id,
      resultKey: `page:${slug}`,
      kind: "page",
      slug,
      title: titleMatches ? highlight(term, entry.title) : escapeHTML(entry.title),
      aliases: aliases.join(" "),
      headings: headings.join(" "),
      content: matchingAlias && !titleMatches ? `Alias: ${highlight(term, matchingAlias)}` : "",
    }
  }

  const formatSectionResultForDisplay = (term: string, id: number): Item | undefined => {
    const slug = idDataMap[id]
    const entry = dataMap[slug]

    const aliases = entry.aliases ?? []
    const headings = filterIgnoredSearchSectionHeadings(entry.headings ?? [])
    const matchedHeading = findMatchingEntry(headings, term)

    if (!matchedHeading) return undefined

    return {
      id,
      resultKey: `section:${slug}#${matchedHeading}`,
      kind: "section",
      slug,
      title: `${escapeHTML(entry.title)} — ${highlight(term, matchedHeading)}`,
      aliases: aliases.join(" "),
      headings: headings.join(" "),
      content: "",
      matchedHeading,
    }
  }

  const updateResultPreviewText = (resultEl: HTMLElement, previewHTML: string) => {
    const snippet = resultEl.querySelector(".result-card-snippet") as HTMLElement | null
    if (!snippet || !previewHTML) return

    snippet.innerHTML = previewHTML
  }

  const hydrateResultPreviewText = async (resultEl: HTMLElement, requestToken: number) => {
    const matchedHeading = resultEl.dataset.matchedHeading
    const slug = resultEl.dataset.slug as FullSlug | undefined
    if (!slug) return

    const contents = await fetchContent(slug)

    if (requestToken !== searchRequestToken || !container.classList.contains("active")) {
      return
    }

    const previewRoot = document.createElement("div")

    contents.forEach((contentEl) => {
      const contentClone = contentEl.cloneNode(true) as HTMLElement

      contentClone.querySelectorAll(".breadcrumb-container").forEach((el) => el.remove())

      previewRoot.append(...contentClone.children)
    })

    if (matchedHeading) {
      if (isIgnoredSearchSectionHeading(matchedHeading)) return

      const headingEl = findHeadingElement(previewRoot, matchedHeading)
      if (!headingEl) return

      const sectionPreview = getTextPreviewAfterHeading(headingEl)
      updateResultPreviewText(resultEl, sectionPreview)
      return
    }

    const pagePreview = getTextPreviewForPage(previewRoot)
    updateResultPreviewText(resultEl, pagePreview)
  }
  
  const resultToHTML = ({ slug, title, content, matchedHeading, resultKey }: Item) => {
    const itemTile = document.createElement("button")
    itemTile.classList.add("result-card")
    itemTile.id = `search-result-${resultKey}`
    itemTile.dataset.slug = slug
    itemTile.type = "button"

    if (matchedHeading) {
      itemTile.dataset.matchedHeading = matchedHeading
    }

    const htmlTitle = document.createElement("h3")
    htmlTitle.classList.add("result-card-title")
    htmlTitle.innerHTML = title

    const htmlContent = document.createElement("p")
    htmlContent.classList.add("result-card-snippet")
    htmlContent.innerHTML = content

    itemTile.appendChild(htmlTitle)
    itemTile.appendChild(htmlContent)

    async function displayPreviewForSelf() {
      await displayPreview(itemTile)
    }

    async function navigateToResult() {
      await hideSearch({ skipFocus: true })
      const targetUrl = resolveUrl(slug)

      if (matchedHeading) {
        targetUrl.hash = slugAnchor(matchedHeading)
      }

      window.spaNavigate(targetUrl, false)
    }

    async function setActiveResult() {
      currentHover?.classList.remove("focus")
      selectedResult?.classList.remove("selected")

      itemTile.classList.add("focus")
      itemTile.classList.add("selected")
      currentHover = itemTile
      selectedResult = itemTile

      await displayPreviewForSelf()
    }

    async function onClick(event: MouseEvent) {
      if (event.button !== 0) return
      if (event.ctrlKey || event.metaKey || event.shiftKey) return

      event.preventDefault()
      event.stopPropagation()

      if (isHoverCapable) {
        await navigateToResult()
        return
      }

      if (selectedResult === itemTile) {
        await navigateToResult()
        return
      }

      await setActiveResult()
    }

    async function onHoverOrFocus() {
      if (!isHoverCapable) return

      selectedResult?.classList.remove("selected")
      currentHover?.classList.remove("focus")

      itemTile.classList.add("focus")
      itemTile.classList.add("selected")
      currentHover = itemTile
      selectedResult = itemTile

      await displayPreview(itemTile)
    }

    itemTile.addEventListener("mouseenter", onHoverOrFocus)
    window.addCleanup(() => itemTile.removeEventListener("mouseenter", onHoverOrFocus))

    itemTile.addEventListener("focus", onHoverOrFocus)
    window.addCleanup(() => itemTile.removeEventListener("focus", onHoverOrFocus))

    itemTile.addEventListener("click", onClick)
    window.addCleanup(() => itemTile.removeEventListener("click", onClick))

    return itemTile
  }

  async function runSearch(term: string, requestToken: number) {
    if (!searchLayout || !index) return

    const effectiveTerm = term.trim()

    if (effectiveTerm === "") {
      currentSearchTerm = ""
      await displayResults([], "none")
      return
    }

    const searchResults = await index.searchAsync({
      query: effectiveTerm,
      limit: rawSearchResultLimit,
      index: ["title", "aliases", "headings"],
    })

    if (requestToken !== searchRequestToken || !container.classList.contains("active")) {
      return
    }

    searchType = "basic"
    currentSearchTerm = effectiveTerm

    const getByField = (field: string): number[] => {
      const resultsForField = searchResults.filter((x) => x.field === field)
      return resultsForField.length === 0 ? [] : ([...resultsForField[0].result] as number[])
    }

    const titleIds = getByField("title")
    const aliasIds = getByField("aliases")
    const headingIds = getByField("headings")

    const pageIds: Set<number> = new Set([...titleIds, ...aliasIds])
    const sectionIds: Set<number> = new Set(headingIds)

    const finalResults = [
      ...[...pageIds]
        .filter((id) => isSlugInCurrentSearchLocale(idDataMap[id]))
        .map((id) => formatPageResultForDisplay(currentSearchTerm, id)),
      ...[...sectionIds]
        .filter((id) => isSlugInCurrentSearchLocale(idDataMap[id]))
        .map((id) => formatSectionResultForDisplay(currentSearchTerm, id)),
    ]
      .filter((result): result is Item => result !== undefined)
      .slice(0, numSearchResults)

    const animationMode: ResultAnimationMode = hasRenderedSearchResults ? "soft" : "full"
    await displayResults(finalResults, animationMode)
    hasRenderedSearchResults = true
  }

  async function displayResults(
    finalResults: Item[],
    animationMode: ResultAnimationMode = "soft",
  ) {
    results.classList.remove("results-refreshing", "results-animate-full", "results-animate-soft")

    if (animationMode === "full") {
      results.classList.add("results-animate-full")
    } else if (animationMode === "soft") {
      results.classList.add("results-refreshing", "results-animate-soft")
    }

    removeAllChildren(results)

    if (finalResults.length === 0) {
      const isEmptyQuery = currentSearchTerm.trim() === ""
      const t = getSearchI18n()

      results.innerHTML = isEmptyQuery
        ? `<a class="result-card no-match">
            <h3>${t.beginSearchingTitle}</h3>
            <p class="card-description">${t.beginSearchingText}</p>
          </a>`
        : `<a class="result-card no-match">
            <h3>${t.noMatchTitle}</h3>
            <p class="card-description">${t.noMatchText}</p>
              </a>`
    } else {
      results.append(...finalResults.map(resultToHTML))

      const requestToken = searchRequestToken
      const resultCards = [...results.querySelectorAll(".result-card")] as HTMLElement[]

      resultCards.forEach((resultCard) => {
        void hydrateResultPreviewText(resultCard, requestToken)
      })
    }

    requestAnimationFrame(() => {
      results.classList.remove("results-refreshing")
    })

    if (finalResults.length === 0 && preview) {
      previewToken++
      removeAllChildren(preview)
      preview.classList.remove("preview-switching-out", "preview-switching-in")
      currentHover = null
      selectedResult = null
    } else {
      const firstChild = results.firstElementChild as HTMLElement | null
      if (!firstChild) return

      if (shouldAutoPreviewResults) {
        firstChild.classList.add("focus")
        firstChild.classList.add("selected")
        currentHover = firstChild
        selectedResult = firstChild
        await displayPreview(firstChild)
      } else {
        currentHover = null
        selectedResult = null

        if (preview) {
          previewToken++
          removeAllChildren(preview)
          preview.classList.remove("preview-switching-out", "preview-switching-in")
        }
      }
    }
  }

  async function fetchContent(slug: FullSlug): Promise<Element[]> {
    if (fetchContentCache.has(slug)) {
      return fetchContentCache.get(slug) as Element[]
    }

    const targetUrl = resolveUrl(slug).toString()
    const contents = await fetch(targetUrl)
      .then((res) => res.text())
      .then((contents) => {
        if (contents === undefined) {
          throw new Error(`Could not fetch ${targetUrl}`)
        }

        const html = p.parseFromString(contents ?? "", "text/html")
        normalizeRelativeURLs(html, targetUrl)

        return [...html.getElementsByClassName("popover-hint")]
      })

    fetchContentCache.set(slug, contents)
    return contents
  }

  async function displayPreview(el: HTMLElement | null) {
    if (!searchLayout || !enablePreview || !el || !preview) return

    if (el.classList.contains("no-match")) {
      previewToken++
      removeAllChildren(preview)
      preview.classList.remove("preview-switching-out", "preview-switching-in")
      return
    }

    const slug = el.dataset.slug as FullSlug | undefined
    if (!slug) return

    const matchedHeading = el.dataset.matchedHeading
    const thisToken = ++previewToken

    if (preview.childElementCount > 0) {
      preview.classList.remove("preview-switching-in")
      preview.classList.add("preview-switching-out")
      await wait(140)
    }

    if (thisToken !== previewToken) return

    const contents = await fetchContent(slug)

    if (thisToken !== previewToken) return

    const breadcrumb = contents
      .map((contentEl) => contentEl.querySelector(".breadcrumb-container"))
      .find((el): el is HTMLElement => el instanceof HTMLElement)
      ?.cloneNode(true) as HTMLElement | undefined

    if (breadcrumb) {
      breadcrumb.classList.add("search-preview-breadcrumbs")
    }

    const innerDiv = contents.flatMap((contentEl) => {
      const contentClone = contentEl.cloneNode(true) as HTMLElement

      contentClone.querySelectorAll(".breadcrumb-container").forEach((el) => el.remove())

      return [...contentClone.children]
    })

    if (thisToken !== previewToken) return

    const previewChrome = document.createElement("div")
    previewChrome.classList.add("search-preview-chrome")

    const breadcrumbSlot = document.createElement("div")
    breadcrumbSlot.classList.add("search-preview-breadcrumb-slot")

    if (breadcrumb) {
      breadcrumbSlot.appendChild(breadcrumb)
    }

    previewChrome.appendChild(breadcrumbSlot)

    const previewScroll = document.createElement("div")
    previewScroll.classList.add("preview-scroll")

    const previewBadge = document.createElement("div")
    previewBadge.classList.add("preview-badge")
    previewBadge.textContent = getSearchI18n().recordPreview

    previewInner = document.createElement("div")
    previewInner.classList.add("preview-inner")
    previewInner.append(...innerDiv)

    previewScroll.append(previewBadge, previewInner)
    preview.replaceChildren(previewChrome, previewScroll)

    preview.classList.remove("preview-switching-out")
    preview.classList.add("preview-switching-in")

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        preview.classList.remove("preview-switching-in")

        if (thisToken !== previewToken) return

        if (matchedHeading && previewInner) {
          if (isIgnoredSearchSectionHeading(matchedHeading)) return

          const headingEl = findHeadingElement(previewInner, matchedHeading)

          if (headingEl) {
            const sectionPreview = getTextPreviewAfterHeading(headingEl)
            updateResultPreviewText(el, sectionPreview)

            const previewScrollRect = previewScroll.getBoundingClientRect()
            const headingRect = headingEl.getBoundingClientRect()

            const offset = 96

            previewScroll.scrollTop += headingRect.top - previewScrollRect.top - offset
          } else {
            previewScroll.scrollTop = 0
          }
        } else {
          previewScroll.scrollTop = 0

          if (previewInner) {
            const pagePreview = getTextPreviewForPage(previewInner)
            updateResultPreviewText(el, pagePreview)
          }
        }
      })
    })
  }

  function onType(e: HTMLElementEventMap["input"]) {
    if (!searchLayout || !index) return

    scheduleViewportSync()

    const rawTerm = (e.target as HTMLInputElement).value
    currentSearchTerm = rawTerm
    searchLayout.classList.add("display-results")

    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer)
    }

    const requestToken = ++searchRequestToken

    searchDebounceTimer = window.setTimeout(() => {
      void runSearch(rawTerm, requestToken)
    }, SEARCH_RENDER_DEBOUNCE_MS)
  }

  searchButton.onclick = () => showSearch("basic")

  if (closeButton) {
    closeButton.onclick = () => {
      void hideSearch()
    }
  }

  searchBar.oninput = onType as unknown as ((this: GlobalEventHandlers, ev: Event) => any)

  if (window.__continuumSearchInitialized) {
    await fillDocument(data)
    return
  }

  window.__continuumSearchInitialized = true

  document.addEventListener("keydown", shortcutHandler)

  const onDocumentPointerDown = (e: PointerEvent) => {
    if (!container.classList.contains("active")) return

    const target = e.target as Node | null
    if (!target) return

    if (!searchSpace.contains(target)) {
      void hideSearch()
    }
  }

  document.addEventListener("pointerdown", onDocumentPointerDown, true)

  registerEscapeHandler(container, hideSearch)
  await fillDocument(data)
}

let indexPopulated = false

async function fillDocument(data: ContentIndex) {
  if (indexPopulated) return

  await loadIgnoredSearchSectionHeadings()

  let id = 0
  const promises: Array<Promise<unknown>> = []

  for (const [slug, fileData] of Object.entries<ContentDetails>(data)) {
    const docId = id++

    promises.push(
      index.addAsync(docId, {
        id: docId,
        slug: slug as FullSlug,
        title: fileData.title,
        aliases: (fileData.aliases ?? []).join(" "),
        headings: filterIgnoredSearchSectionHeadings(fileData.headings ?? []).join(" "),
        content: fileData.content,
      }),
    )
  }

  await Promise.all(promises)
  indexPopulated = true
}

document.addEventListener("prenav", () => {
  void window.__continuumSearchHide?.({ skipFocus: true })
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const currentSlug = e.detail.url
  activeSearchSlug = currentSlug

  const data = await fetchData
  const searchElement = document.getElementsByClassName("search")

  for (const element of searchElement) {
    await setupSearch(element, currentSlug, data)
  }
})