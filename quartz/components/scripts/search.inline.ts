import FlexSearch, { DefaultDocumentSearchResults } from "flexsearch"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { registerEscapeHandler, removeAllChildren, lockPageScroll, unlockPageScroll } from "./util"
import { FullSlug, normalizeRelativeURLs, resolveRelative } from "../../util/path"

interface Item {
  id: number
  slug: FullSlug
  title: string
  content: string
  tags: string[]
  [key: string]: any
}

declare global {
  interface Window {
    __continuumSearchContainer?: HTMLElement
    __continuumSearchInitialized?: boolean
    __continuumSearchHide?: ((options?: { skipFocus?: boolean }) => Promise<void>) | null
  }
}

type SearchType = "basic" | "tags"
let searchType: SearchType = "basic"
let currentSearchTerm: string = ""
let activeSearchSlug: FullSlug | null = null

const encoder = (str: string) => {
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0)
}

let index = new FlexSearch.Document<Item>({
  encode: encoder,
  document: {
    id: "id",
    tag: "tags",
    index: [
      {
        field: "title",
        tokenize: "forward",
      },
      {
        field: "content",
        tokenize: "forward",
      },
      {
        field: "tags",
        tokenize: "forward",
      },
    ],
  },
})

const p = new DOMParser()
const fetchContentCache: Map<FullSlug, Element[]> = new Map()
const contextWindowWords = 30
const numSearchResults = 8
const numTagResults = 5
const SEARCH_RENDER_DEBOUNCE_MS = 315
type ResultAnimationMode = "full" | "soft" | "none"

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
      tokenizedTerms.some((term) => tok.toLowerCase().startsWith(term.toLowerCase()))
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
        if (tok.toLowerCase().includes(searchTok.toLowerCase())) {
          const regex = new RegExp(searchTok.toLowerCase(), "gi")
          return tok.replace(regex, `<span class="highlight">$&</span>`)
        }
      }
      return tok
    })
    .join(" ")

  return `${startIndex === 0 ? "" : "..."}${slice}${endIndex === originalLength - 1 ? "" : "..."}`
}

function highlightHTML(searchTerm: string, el: HTMLElement) {
  const p = new DOMParser()
  const tokenizedTerms = tokenizeTerm(searchTerm)
  const html = p.parseFromString(el.innerHTML, "text/html")

  const createHighlightSpan = (text: string) => {
    const span = document.createElement("span")
    span.className = "highlight"
    span.textContent = text
    return span
  }

  const highlightTextNodes = (node: Node, term: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeText = node.nodeValue ?? ""
      const regex = new RegExp(term.toLowerCase(), "gi")
      const matches = nodeText.match(regex)
      if (!matches || matches.length === 0) return
      const spanContainer = document.createElement("span")
      let lastIndex = 0
      for (const match of matches) {
        const matchIndex = nodeText.toLowerCase().indexOf(match.toLowerCase(), lastIndex)
        spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex, matchIndex)))
        spanContainer.appendChild(createHighlightSpan(nodeText.slice(matchIndex, matchIndex + match.length)))
        lastIndex = matchIndex + match.length
      }
      spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex)))
      node.parentNode?.replaceChild(spanContainer, node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).classList.contains("highlight")) return
      Array.from(node.childNodes).forEach((child) => highlightTextNodes(child, term))
    }
  }

  for (const term of tokenizedTerms) {
    highlightTextNodes(html.body, term)
  }

  return html.body
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

  const idDataMap = Object.keys(data) as FullSlug[]
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
        if (sidebar) sidebar.style.zIndex = ""
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
        container.removeEventListener("transitionend", onTransitionEnd)
        finishClose()
      }

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target !== container) return
        done()
      }

      container.addEventListener("transitionend", onTransitionEnd)
      window.setTimeout(done, 250)
    })
  }

  window.__continuumSearchHide = hideSearch

  function showSearch(searchTypeNew: SearchType) {
    searchType = searchTypeNew

    closeExplorerDrawer()
    closeSettingsDrawer()
    document.documentElement.setAttribute("data-search-open", "1")
    lockPageScroll()

    if (sidebar) sidebar.style.zIndex = "1"

    isClosing = false
    container.classList.remove("animating-in")
    container.classList.remove("animating-out")
    container.classList.add("active")

    void container.offsetWidth

    cancelAnimationFrame(openRaf)
    openRaf = requestAnimationFrame(async () => {
      container.classList.add("animating-in")
      searchBar.value = ""
      currentSearchTerm = ""
      hasRenderedSearchResults = false
      selectedResult = null
      searchRequestToken++
      if (searchDebounceTimer !== null) {
        window.clearTimeout(searchDebounceTimer)
        searchDebounceTimer = null
      }
      results.classList.remove("results-refreshing", "results-animate-full", "results-animate-soft")
      removeAllChildren(results)
      if (preview) {
        removeAllChildren(preview)
        preview.classList.remove("preview-switching-out", "preview-switching-in")
      }
      searchLayout.classList.add("display-results")
      await displayResults([], "none")
      scheduleViewportSync()
      searchBar.focus({ preventScroll: true })
      scheduleViewportSync()
    })
  }

  let currentHover: HTMLElement | null = null
  async function shortcutHandler(e: HTMLElementEventMap["keydown"]) {
    if (e.key === "k" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      const searchBarOpen = container.classList.contains("active")
      void (searchBarOpen ? hideSearch() : Promise.resolve(showSearch("basic")))
      return
    } else if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      const searchBarOpen = container.classList.contains("active")
      if (searchBarOpen) {
        void hideSearch()
      } else {
        showSearch("tags")
        searchBar.value = "#"
      }
      return
    }

    if (currentHover) {
      currentHover.classList.remove("focus")
    }
    if (selectedResult && selectedResult !== currentHover) {
      selectedResult.classList.remove("selected")
    }

    if (!container.classList.contains("active")) return
    if (e.key === "Enter" && !e.isComposing) {
      if (results.contains(document.activeElement)) {
        const active = document.activeElement as HTMLElement
        if (active.classList.contains("no-match")) return
        await displayPreview(active)
        active.click()
      } else {
        const anchor = document.getElementsByClassName("result-card")[0] as HTMLElement | null
        if (!anchor || anchor.classList.contains("no-match")) return
        await displayPreview(anchor)
        anchor.click()
      }
    } else if (e.key === "ArrowUp" || (e.shiftKey && e.key === "Tab")) {
      e.preventDefault()
      if (results.contains(document.activeElement)) {
        const currentResult = currentHover
          ? currentHover
          : (document.activeElement as HTMLElement | null)
        const prevResult = currentResult?.previousElementSibling as HTMLElement | null
        currentResult?.classList.remove("focus")
        currentResult?.classList.remove("selected")
        prevResult?.focus()
        if (prevResult) {
          currentHover = prevResult
          selectedResult = prevResult
          prevResult.classList.add("selected")
        }
        await displayPreview(prevResult)
      }
    } else if (e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault()
      if (document.activeElement === searchBar || currentHover !== null) {
        const currentResult = currentHover
          ? currentHover
          : (document.getElementsByClassName("result-card")[0] as HTMLElement | null)
        const nextResult =
          document.activeElement === searchBar
            ? currentResult
            : (currentResult?.nextElementSibling as HTMLElement | null)

        currentResult?.classList.remove("focus")
        currentResult?.classList.remove("selected")
        nextResult?.focus()
        if (nextResult) {
          currentHover = nextResult
          selectedResult = nextResult
          nextResult.classList.add("selected")
        }
        await displayPreview(nextResult)
      }
    }
  }

  const formatForDisplay = (term: string, id: number) => {
    const slug = idDataMap[id]
    return {
      id,
      slug,
      title: searchType === "tags" ? data[slug].title : highlight(term, data[slug].title ?? ""),
      content: highlight(term, data[slug].content ?? "", true),
      tags: highlightTags(term.substring(1), data[slug].tags),
    }
  }

  function highlightTags(term: string, tags: string[]) {
    if (!tags || searchType !== "tags") {
      return []
    }

    return tags
      .map((tag) => {
        if (tag.toLowerCase().includes(term.toLowerCase())) {
          return `<li><p class="match-tag">#${tag}</p></li>`
        } else {
          return `<li><p>#${tag}</p></li>`
        }
      })
      .slice(0, numTagResults)
  }

  const resultToHTML = ({ slug, title, content, tags }: Item) => {
    const htmlTags = tags.length > 0 ? `<ul class="tags">${tags.join("")}</ul>` : ``
    const itemTile = document.createElement("a")
    itemTile.classList.add("result-card")
    itemTile.id = slug
    itemTile.href = resolveUrl(slug).toString()
    itemTile.innerHTML = `
      <h3 class="card-title">${title}</h3>
      ${htmlTags}
      <p class="card-description">${content}</p>
    `

    const setActiveResult = async () => {
      currentHover?.classList.remove("focus")
      selectedResult?.classList.remove("selected")

      itemTile.classList.add("focus")
      itemTile.classList.add("selected")
      currentHover = itemTile
      selectedResult = itemTile

      await displayPreview(itemTile)
    }

    const navigateToResult = async () => {
      const targetUrl = new URL(itemTile.href, window.location.toString())
      await hideSearch({ skipFocus: true })
      await window.spaNavigate(targetUrl)
    }

    const onClick = async (event: MouseEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

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

    let effectiveSearchType: SearchType = term.startsWith("#") ? "tags" : "basic"
    let effectiveTerm = term

    let searchResults: DefaultDocumentSearchResults<Item>
    if (effectiveSearchType === "tags") {
      effectiveTerm = effectiveTerm.substring(1).trim()
      const separatorIndex = effectiveTerm.indexOf(" ")
      if (separatorIndex !== -1) {
        const tag = effectiveTerm.substring(0, separatorIndex)
        const query = effectiveTerm.substring(separatorIndex + 1).trim()

        searchResults = await index.searchAsync({
          query,
          limit: Math.max(numSearchResults, 10000),
          index: ["title", "content"],
          tag: { tags: tag },
        })

        for (const searchResult of searchResults) {
          searchResult.result = searchResult.result.slice(0, numSearchResults)
        }

        effectiveSearchType = "basic"
        effectiveTerm = query
      } else {
        searchResults = await index.searchAsync({
          query: effectiveTerm,
          limit: numSearchResults,
          index: ["tags"],
        })
      }
    } else {
      searchResults = await index.searchAsync({
        query: effectiveTerm,
        limit: numSearchResults,
        index: ["title", "content"],
      })
    }

    if (requestToken !== searchRequestToken || !container.classList.contains("active")) {
      return
    }

    searchType = effectiveSearchType
    currentSearchTerm = effectiveTerm

    const getByField = (field: string): number[] => {
      const resultsForField = searchResults.filter((x) => x.field === field)
      return resultsForField.length === 0 ? [] : ([...resultsForField[0].result] as number[])
    }

    const allIds: Set<number> = new Set([
      ...getByField("title"),
      ...getByField("content"),
      ...getByField("tags"),
    ])

    const finalResults = [...allIds].map((id) => formatForDisplay(currentSearchTerm, id))

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

      results.innerHTML = isEmptyQuery
        ? `<a class="result-card no-match">
            <h3>Begin searching.</h3>
            <p>Enter a term to search for records.</p>
          </a>`
        : `<a class="result-card no-match">
            <h3>No matching record.</h3>
            <p>The index contains no entry for that term.</p>
          </a>`
    } else {
      results.append(...finalResults.map(resultToHTML))
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

    const slug = el.id as FullSlug
    const thisToken = ++previewToken

    if (preview.childElementCount > 0) {
      preview.classList.remove("preview-switching-in")
      preview.classList.add("preview-switching-out")
      await wait(140)
    }

    if (thisToken !== previewToken) return

    const innerDiv = await fetchContent(slug).then((contents) =>
      contents.flatMap((contentEl) => [
        ...highlightHTML(currentSearchTerm, contentEl as HTMLElement).children,
      ]),
    )

    if (thisToken !== previewToken) return

    const previewBadge = document.createElement("div")
    previewBadge.classList.add("preview-badge")
    previewBadge.textContent = "RECORD PREVIEW"

    previewInner = document.createElement("div")
    previewInner.classList.add("preview-inner")
    previewInner.append(...innerDiv)

    preview.replaceChildren(previewBadge, previewInner)

    preview.classList.remove("preview-switching-out")
    preview.classList.add("preview-switching-in")

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        preview.classList.remove("preview-switching-in")
      })
    })

    if (isHoverCapable) {
      const highlights = [...preview.getElementsByClassName("highlight")].sort(
        (a, b) => b.innerHTML.length - a.innerHTML.length,
      )
      highlights[0]?.scrollIntoView({ block: "start" })
    }
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
  let id = 0
  const promises: Array<Promise<unknown>> = []
  for (const [slug, fileData] of Object.entries<ContentDetails>(data)) {
    const docId = id++
    promises.push(
      index.addAsync(docId, {
        id: docId,
        slug: slug as FullSlug,
        title: fileData.title,
        content: fileData.content,
        tags: fileData.tags,
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