import { FileTrieNode } from "../../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { lockPageScroll, unlockPageScroll } from "./util"
import { i18n } from "../../i18n"
import { localeFromSlug, toI18nLocale } from "../../util/locale"

type MaybeHTMLElement = HTMLElement | undefined
type ExplorerNode = FileTrieNode<ContentDetails>

interface ParsedOptions {
  sortFn: (a: ExplorerNode, b: ExplorerNode) => number
  filterFn: (node: ExplorerNode) => boolean
  mapFn: (node: ExplorerNode) => void
  order: ("sort" | "filter" | "map")[]
}

let activePageSlug: FullSlug = "" as FullSlug

function getExplorerI18n() {
  const lang = localeFromSlug(window.location.pathname)
  return i18n(toI18nLocale(lang)).components.explorer
}

function getCommonI18n() {
  const lang = localeFromSlug(window.location.pathname)
  return i18n(toI18nLocale(lang)).common
}

function getPageI18n() {
  const lang = localeFromSlug(window.location.pathname)
  return i18n(toI18nLocale(lang)).pages
}

function getGenesisHref() {
  const lang = localeFromSlug(window.location.pathname)

  if (lang === "zh") return "/zh/"
  if (lang === "fr") return "/fr/"
  if (lang === "ja") return "/ja/"
  return "/en/"
}

function getPathParts(pathname: string): string[] {
  const parts = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.toLowerCase())

  if (parts.at(-1) === "index") parts.pop()
  return parts
}

function isGenesisLocation(currentSlug: FullSlug) {
  const languageRoots = new Set(["en", "zh", "fr", "ja"])
  const slugParts = normalizeSlugParts(currentSlug).map((part) => part.toLowerCase())
  const pathParts = getPathParts(window.location.pathname)

  const slugLooksLikeGenesis =
    slugParts.length === 0 || (slugParts.length === 1 && languageRoots.has(slugParts[0]))

  const pathLooksLikeGenesis =
    pathParts.length === 0 || (pathParts.length === 1 && languageRoots.has(pathParts[0]))

  return slugLooksLikeGenesis || pathLooksLikeGenesis
}

function normalizeSlugParts(slug: FullSlug | string): string[] {
  const parts = simplifySlug(slug as FullSlug)
    .toString()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)

  if (parts.at(-1) === "index") parts.pop()
  return parts
}

function samePage(a: FullSlug | string, b: FullSlug | string) {
  return simplifySlug(a as FullSlug) === simplifySlug(b as FullSlug)
}

function findNodeBySlug(root: ExplorerNode, slug: FullSlug | string): ExplorerNode | undefined {
  return root.findNode(normalizeSlugParts(slug))
}

function getInitialFolderSlug(root: ExplorerNode, currentSlug: FullSlug): FullSlug {
  const currentNode = findNodeBySlug(root, currentSlug)
  if (currentNode?.isFolder) return currentNode.slug as FullSlug

  const parts = normalizeSlugParts(currentSlug)

  while (parts.length > 0) {
    parts.pop()

    const folder = root.findNode(parts)
    if (folder?.isFolder) return folder.slug as FullSlug
  }

  const firstFolder = root.children.find((child) => child.isFolder)
  return (firstFolder?.slug ?? root.slug) as FullSlug
}

function getFolderNode(root: ExplorerNode, folderSlug: FullSlug): ExplorerNode {
  const folder = findNodeBySlug(root, folderSlug)
  if (folder?.isFolder) return folder

  const fallback = findNodeBySlug(root, getInitialFolderSlug(root, activePageSlug))
  if (fallback?.isFolder) return fallback

  return root
}

function getFolderAncestry(root: ExplorerNode, folderSlug: FullSlug): ExplorerNode[] {
  const chain = root.ancestryChain(normalizeSlugParts(folderSlug)) ?? [root]
  return chain.filter((node) => node !== root && node.isFolder)
}

function createChevronSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  svg.setAttribute("width", "12")
  svg.setAttribute("height", "12")
  svg.setAttribute("viewBox", "5 8 14 8")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "2")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  svg.classList.add("folder-icon")

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline")
  polyline.setAttribute("points", "6 9 12 15 18 9")
  svg.appendChild(polyline)

  return svg
}

function createSectionLabel(label: string): HTMLLIElement {
  const li = document.createElement("li")
  li.className = "explorer-section-label"
  li.textContent = label
  return li
}

function createEmptyState(): HTMLLIElement {
  const li = document.createElement("li")
  li.className = "explorer-empty-state"
  li.textContent = getExplorerI18n().emptyState
  return li
}

function createGenesisNode(currentSlug: FullSlug): HTMLLIElement | undefined {
  if (isGenesisLocation(currentSlug)) return undefined

  const li = document.createElement("li")
  li.className = "explorer-genesis-item"

  const a = document.createElement("a")
  a.className = "explorer-genesis-link"
  a.href = getGenesisHref()
  a.textContent = getPageI18n().error.returnToGenesis

  li.appendChild(a)
  return li
}

function createFileNode(currentSlug: FullSlug, node: ExplorerNode): HTMLLIElement {
  const li = document.createElement("li")
  const a = document.createElement("a")

  a.href = resolveRelative(currentSlug, node.slug)
  a.dataset.for = node.slug
  a.textContent = node.displayName

  if (samePage(currentSlug, node.slug)) {
    a.classList.add("active")
    a.setAttribute("aria-current", "page")
  }

  li.appendChild(a)
  return li
}

function createFolderNode(
  currentSlug: FullSlug,
  node: ExplorerNode,
  drillInto: (folderSlug: FullSlug) => void,
): HTMLLIElement {
  const li = document.createElement("li")
  const row = document.createElement("div")
  const folderSlug = node.slug as FullSlug

  row.className = "folder-container drill-folder-container"
  row.dataset.folderpath = folderSlug

  const title = document.createElement(node.data ? "a" : "span") as HTMLAnchorElement | HTMLSpanElement
  title.className = "folder-title"
  title.textContent = node.displayName

  if (title instanceof HTMLAnchorElement) {
    title.href = resolveRelative(currentSlug, folderSlug)
    title.dataset.for = folderSlug

    if (samePage(currentSlug, folderSlug)) {
      title.classList.add("active")
      title.setAttribute("aria-current", "page")
    }
  }

  const drillButton = document.createElement("button")
  drillButton.className = "folder-drill-toggle"
  drillButton.type = "button"
  drillButton.setAttribute("aria-label", getExplorerI18n().openFolder(node.displayName))
  drillButton.appendChild(createChevronSvg())

  const pressHandler = (event: PointerEvent) => {
    event.stopPropagation()
    drillButton.classList.add("is-pressed")
  }

  const drillHandler = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    drillInto(folderSlug)
  }

  drillButton.addEventListener("pointerdown", pressHandler)
  drillButton.addEventListener("click", drillHandler)

  window.addCleanup(() => {
    drillButton.removeEventListener("pointerdown", pressHandler)
    drillButton.removeEventListener("click", drillHandler)
  })

  row.append(drillButton, title)
  li.appendChild(row)
  return li
}

function staggerRows(explorerUl: HTMLElement) {
  const rows = Array.from(
    explorerUl.querySelectorAll<HTMLElement>(
      ":scope > li > a, :scope > li > .folder-container, :scope > li.explorer-section-label, :scope > li.explorer-empty-state, :scope > li > .explorer-genesis-link",
    ),
  )

  for (const row of rows) {
    row.removeAttribute("data-stagger")
    row.style.removeProperty("--row-i")
  }

  requestAnimationFrame(() => {
    rows.forEach((row, i) => {
      row.style.setProperty("--row-i", String(i))
      row.setAttribute("data-stagger", "1")
    })
  })
}

function renderBreadcrumbs(
  explorer: HTMLElement,
  root: ExplorerNode,
  folderSlug: FullSlug,
  drillInto: (folderSlug: FullSlug) => void,
) {
  const header = explorer.querySelector(".explorer-drill-header") as HTMLElement | null
  if (!header) return

  const restartBreadcrumbAnimation = () => {
    const back = explorer.querySelector(".explorer-drill-back")

    header.classList.remove("is-changing")
    back?.classList.remove("is-changing")

    void header.offsetWidth

    header.classList.add("is-changing")
    back?.classList.add("is-changing")
  }
    
  const oldBack = explorer.querySelector(".explorer-drill-back")
  oldBack?.remove()

  header.replaceChildren()

  const chain = getFolderAncestry(root, folderSlug)
  const crumbRow = document.createElement("div")
  crumbRow.className = "explorer-crumb-row"

  for (const [index, node] of chain.entries()) {
    if (index > 0) {
      const separator = document.createElement("span")
      separator.className = "explorer-drill-separator"
      separator.textContent = "›"
      crumbRow.appendChild(separator)
    }

    const isCurrent = index === chain.length - 1
    const crumb = document.createElement("button")
    crumb.type = "button"
    crumb.className = "explorer-drill-crumb"
    crumb.textContent = node.displayName
    crumb.dataset.current = isCurrent ? "true" : "false"

    if (isCurrent) {
      crumb.setAttribute("aria-current", "page")
    } else {
      const crumbHandler = () => drillInto(node.slug as FullSlug)
      crumb.addEventListener("click", crumbHandler)
      window.addCleanup(() => crumb.removeEventListener("click", crumbHandler))
    }

    crumbRow.appendChild(crumb)
  }

  header.appendChild(crumbRow)

  if (chain.length > 1) {
    const parent = chain[chain.length - 2]

    const backButton = document.createElement("button")
    backButton.type = "button"
    backButton.className = "explorer-drill-back"
    const backLabel = getExplorerI18n().backToFolder(parent.displayName)
    backButton.setAttribute("aria-label", backLabel)

    const backArrow = document.createElement("span")
    backArrow.className = "explorer-drill-back-arrow"
    backArrow.textContent = "←"

    const backText = document.createElement("span")
    backText.className = "explorer-drill-back-label"
    backText.textContent = backLabel

    backButton.append(backArrow, backText)

    const backHandler = () => drillInto(parent.slug as FullSlug)
    backButton.addEventListener("click", backHandler)
    window.addCleanup(() => backButton.removeEventListener("click", backHandler))

    header.insertAdjacentElement("afterend", backButton)
  }

  restartBreadcrumbAnimation()
}

function renderDrillPane(
  explorer: HTMLElement,
  explorerUl: HTMLElement,
  root: ExplorerNode,
  currentSlug: FullSlug,
  folderSlug: FullSlug,
) {
  const folderNode = getFolderNode(root, folderSlug)
  const actualFolderSlug = folderNode.slug as FullSlug

  const drillInto = (nextFolderSlug: FullSlug) => {
    renderDrillPane(explorer, explorerUl, root, currentSlug, nextFolderSlug)
  }

  renderBreadcrumbs(explorer, root, actualFolderSlug, drillInto)

  const overflowEnd = explorerUl.querySelector(":scope > li.overflow-end")
  explorerUl.replaceChildren()

  const folders = folderNode.children.filter((child) => child.isFolder)
  const pages = folderNode.children.filter((child) => !child.isFolder)

  if (folders.length > 0) {
    explorerUl.appendChild(createSectionLabel(getExplorerI18n().foldersSection))

    for (const folder of folders) {
      explorerUl.appendChild(createFolderNode(currentSlug, folder, drillInto))
    }
  }

  if (pages.length > 0) {
    explorerUl.appendChild(createSectionLabel(getExplorerI18n().pagesSection))

    for (const page of pages) {
      explorerUl.appendChild(createFileNode(currentSlug, page))
    }
  }

  if (folders.length === 0 && pages.length === 0) {
    explorerUl.appendChild(createEmptyState())
  }

  const genesisNode = createGenesisNode(currentSlug)
  if (genesisNode) explorerUl.appendChild(genesisNode)

  if (overflowEnd) explorerUl.appendChild(overflowEnd)

  explorerUl.scrollTop = 0
  explorerUl.scrollLeft = 0
  staggerRows(explorerUl)
}

function toggleExplorer(this: HTMLElement) {
  const nearestExplorer = this.closest(".explorer") as HTMLElement
  if (!nearestExplorer) return

  const explorerCollapsed = nearestExplorer.classList.toggle("collapsed")
  nearestExplorer.setAttribute(
    "aria-expanded",
    nearestExplorer.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )

  if (!explorerCollapsed) {
    document.documentElement.classList.add("mobile-no-scroll")
  } else {
    document.documentElement.classList.remove("mobile-no-scroll")
  }
}

function setupExplorerDrawer() {
  const root = document.documentElement
  const KEY = "continuum-explorer-drawer"

  const t = getExplorerI18n()

  let handle = document.querySelector<HTMLButtonElement>(".continuum-explorer-handle")
  if (!handle) {
    handle = document.createElement("button")
    handle.type = "button"
    handle.className = "continuum-explorer-handle"
    document.body.appendChild(handle)
  }

  let scrim = document.querySelector<HTMLElement>(".continuum-explorer-scrim")
  if (!scrim) {
    scrim = document.createElement("div")
    scrim.className = "continuum-explorer-scrim"
    scrim.setAttribute("aria-hidden", "true")
    document.body.appendChild(scrim)
  }

  const explorers = Array.from(document.querySelectorAll<HTMLElement>(".explorer"))
  const newestExplorer = explorers[explorers.length - 1]

  explorers.forEach((ex) => {
    if (ex !== newestExplorer) ex.remove()
  })

  if (newestExplorer && newestExplorer.parentElement !== document.body) {
    document.body.appendChild(newestExplorer)
  }

  const renderHandle = () => {
    const common = getCommonI18n()
    const isOpen = root.hasAttribute("data-explorer-open")
    const isMobile = root.classList.contains("device-mobile")
    const showCloseLabel = isOpen && isMobile

    const label = showCloseLabel ? common.close : t.title
    const aria = isOpen ? common.close : t.toggleLabel

    handle.setAttribute("aria-label", aria)
    handle.innerHTML = `<span class="label">${label}</span>`
  }

  const closeSettingsIfOpen = () => {
    if (!root.hasAttribute("data-settings-open")) return

    root.removeAttribute("data-settings-open")

    try {
      localStorage.setItem("continuum-settings-drawer", "closed")
    } catch {}
  }

  const open = () => {
    closeSettingsIfOpen()
    root.setAttribute("data-explorer-open", "1")
    lockPageScroll()
    localStorage.setItem(KEY, "open")
    renderHandle()
  }

  const close = () => {
    root.removeAttribute("data-explorer-open")

    try {
      localStorage.setItem(KEY, "closed")
    } catch {}

    renderHandle()

    window.setTimeout(() => {
      unlockPageScroll()
    }, 680)
  }

  const toggle = () => {
    root.hasAttribute("data-explorer-open") ? close() : open()
  }

  renderHandle()

  if (!(window as any)._continuumExplorerRenderHandle) {
    ;(window as any)._continuumExplorerRenderHandle = renderHandle
  }

  window.addEventListener("continuum-explorer-render-handle", renderHandle)

  if (!(handle as any)._explorerBound) {
    ;(handle as any)._explorerBound = true
    handle.addEventListener("click", toggle)
  }

  if (!(scrim as any)._explorerBound) {
    ;(scrim as any)._explorerBound = true
    scrim.addEventListener("click", close)
  }

  if (!(document as any)._explorerEscBound) {
    ;(document as any)._explorerEscBound = true
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close()
    })
  }

  if (!(document as any)._explorerPrenavBound) {
    ;(document as any)._explorerPrenavBound = true
    document.addEventListener("prenav", () => close())
  }

  try {
    localStorage.getItem(KEY) === "open" ? open() : close()
  } catch {
    close()
  }
}

async function setupExplorer(currentSlug: FullSlug) {
  const allExplorers = document.querySelectorAll("div.explorer") as NodeListOf<HTMLElement>

  for (const explorer of allExplorers) {
    const dataFns = JSON.parse(explorer.dataset.dataFns || "{}")

    const opts: ParsedOptions = {
      order: dataFns.order || ["filter", "map", "sort"],
      sortFn: new Function("return " + (dataFns.sortFn || "undefined"))(),
      filterFn: new Function("return " + (dataFns.filterFn || "undefined"))(),
      mapFn: new Function("return " + (dataFns.mapFn || "undefined"))(),
    }

    const data = await fetchData
    const entries = [...Object.entries(data)] as [FullSlug, ContentDetails][]
    const trie = FileTrieNode.fromEntries(entries)

    for (const fn of opts.order) {
      switch (fn) {
        case "filter":
          if (opts.filterFn) trie.filter(opts.filterFn)
          break
        case "map":
          if (opts.mapFn) trie.map(opts.mapFn)
          break
        case "sort":
          if (opts.sortFn) trie.sort(opts.sortFn)
          break
      }
    }

    activePageSlug = currentSlug

    const explorerUl = explorer.querySelector(".explorer-ul") as HTMLElement | null
    if (!explorerUl) continue

    const initialFolderSlug = getInitialFolderSlug(trie, currentSlug)
    renderDrillPane(explorer, explorerUl, trie, currentSlug, initialFolderSlug)

    const explorerButtons = explorer.getElementsByClassName(
      "explorer-toggle",
    ) as HTMLCollectionOf<HTMLElement>

    for (const button of explorerButtons) {
      button.addEventListener("click", toggleExplorer)
      window.addCleanup(() => button.removeEventListener("click", toggleExplorer))
    }
  }
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  setupExplorerDrawer()

  const currentSlug = e.detail.url
  await setupExplorer(currentSlug)

  for (const explorer of document.getElementsByClassName("explorer")) {
    const mobileExplorer = explorer.querySelector(".mobile-explorer") as MaybeHTMLElement
    if (!mobileExplorer) return

    if (mobileExplorer.checkVisibility()) {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")

      document.documentElement.classList.remove("mobile-no-scroll")
    }

    mobileExplorer.classList.remove("hide-until-loaded")
  }
})

window.addEventListener("resize", function () {
  const explorer = document.querySelector(".explorer")

  if (explorer && !explorer.classList.contains("collapsed")) {
    document.documentElement.classList.add("mobile-no-scroll")
  }
})