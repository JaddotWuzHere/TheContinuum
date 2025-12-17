import { FileTrieNode } from "../../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type MaybeHTMLElement = HTMLElement | undefined

interface ParsedOptions {
  folderClickBehavior: "collapse" | "link"
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: ("sort" | "filter" | "map")[]
}

type FolderState = {
  path: FullSlug
  collapsed: boolean
}

let currentExplorerState: FolderState[] = []

function staggerNewlyRevealedRows(folderOuter: HTMLElement) {
  const rows = collectStaggerRows(folderOuter)

  for (const row of rows) {
    row.removeAttribute("data-stagger")
    row.style.removeProperty("--row-i")
  }

  requestAnimationFrame(() => {
    let i = 0
    for (const row of rows) {
      row.style.setProperty("--row-i", String(i++))
      row.setAttribute("data-stagger", "1")
    }
  })
}


function collectStaggerRows(folderOuter: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = []
  const ul = folderOuter.querySelector(":scope > ul") as HTMLUListElement | null
  if (!ul) return out

  const walk = (containerOuter: HTMLElement) => {
    const containerUl = containerOuter.querySelector(":scope > ul") as HTMLUListElement | null
    if (!containerUl) return

    const lis = Array.from(containerUl.children) as HTMLElement[]
    for (const li of lis) {
      const folderHeader = li.querySelector(":scope > .folder-container") as HTMLElement | null
      if (folderHeader) {
        out.push(folderHeader)

        const childOuter = li.querySelector(":scope > .folder-outer") as HTMLElement | null
        if (childOuter && childOuter.classList.contains("open")) {
          walk(childOuter)
        }
        continue
      }

      const fileLink = li.querySelector(":scope > a") as HTMLElement | null
      if (fileLink) {
        out.push(fileLink)
      }
    }
  }

  walk(folderOuter)
  return out
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

  if (document.querySelector(".continuum-explorer-handle")) return

  const handle = document.createElement("button")
  handle.type = "button"
  handle.className = "continuum-explorer-handle"
  handle.setAttribute("aria-label", "Toggle explorer")
  handle.innerHTML = `<span class="label">Explorer</span>`

  const scrim = document.createElement("div")
  scrim.className = "continuum-explorer-scrim"
  scrim.setAttribute("aria-hidden", "true")

  document.body.appendChild(handle)
  document.body.appendChild(scrim)

  const explorers = document.querySelectorAll(".explorer") as NodeListOf<HTMLElement>
  explorers.forEach((ex) => {
    if (ex.parentElement !== document.body) {
      document.body.appendChild(ex)
    }
  })

  const open = () => {
    root.setAttribute("data-explorer-open", "1")
    localStorage.setItem(KEY, "open")
  }
  const close = () => {
    root.removeAttribute("data-explorer-open")
    localStorage.setItem(KEY, "closed")
  }
  const toggle = () => {
    root.hasAttribute("data-explorer-open") ? close() : open()
  }

  handle.addEventListener("click", toggle)
  scrim.addEventListener("click", close)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close()
  })

  if (localStorage.getItem(KEY) === "open") open()
  document.addEventListener("prenav", () => close())
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()

  const target = evt.target as HTMLElement | null
  if (!target) return

  const icon = target.closest("svg.folder-icon") as SVGElement | null
  if (!icon) return

  const folderContainer = icon.closest(".folder-container") as HTMLElement | null
  if (!folderContainer) return

  const folderOuter = folderContainer.nextElementSibling as HTMLElement | null
  if (!folderOuter || !folderOuter.classList.contains("folder-outer")) return

  const wasOpen = folderOuter.classList.contains("open")

  folderOuter.classList.toggle("open")
  const isOpen = folderOuter.classList.contains("open")

  const folderPath = folderContainer.dataset.folderpath as FullSlug | undefined
  if (folderPath) {
    const currentFolderState = currentExplorerState.find((item) => item.path === folderPath)
    if (currentFolderState) {
      currentFolderState.collapsed = !isOpen
    } else {
      currentExplorerState.push({ path: folderPath, collapsed: !isOpen })
    }
    localStorage.setItem("fileTree", JSON.stringify(currentExplorerState))
  }

  if (!wasOpen && isOpen) {
    requestAnimationFrame(() => staggerNewlyRevealedRows(folderOuter))
  }
}

function createFileNode(currentSlug: FullSlug, node: FileTrieNode): HTMLLIElement {
  const template = document.getElementById("template-file") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  a.href = resolveRelative(currentSlug, node.slug)
  a.dataset.for = node.slug
  a.textContent = node.displayName

  if (currentSlug === node.slug) {
    a.classList.add("active")
  }

  return li
}

function createFolderNode(
  currentSlug: FullSlug,
  node: FileTrieNode,
  opts: ParsedOptions,
): HTMLLIElement {
  const template = document.getElementById("template-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".folder-container") as HTMLElement
  const titleContainer = folderContainer.querySelector("div") as HTMLElement
  const folderOuter = li.querySelector(".folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  const folderPath = node.slug as FullSlug
  folderContainer.dataset.folderpath = folderPath

  if (opts.folderClickBehavior === "link") {
    const button = titleContainer.querySelector(".folder-button") as HTMLElement
    const a = document.createElement("a")
    a.href = resolveRelative(currentSlug, folderPath)
    a.dataset.for = folderPath
    a.className = "folder-title"
    a.textContent = node.displayName
    button.replaceWith(a)

    const cur = simplifySlug(currentSlug)
    const fol = simplifySlug(folderPath)
    if (cur === fol || cur === `${fol}/`) {
      a.classList.add("active")
      a.setAttribute("aria-current", "page")
    }
  } else {
    const span = titleContainer.querySelector(".folder-title") as HTMLElement
    span.textContent = node.displayName
  }

  const isCollapsed =
    currentExplorerState.find((item) => item.path === folderPath)?.collapsed ??
    opts.folderDefaultState === "collapsed"

  const simpleFolderPath = simplifySlug(folderPath)
  const folderIsPrefixOfCurrentSlug =
    simpleFolderPath === currentSlug.slice(0, simpleFolderPath.length)

  if (!isCollapsed || folderIsPrefixOfCurrentSlug) {
    folderOuter.classList.add("open")
  }

  for (const child of node.children) {
    const childNode = child.isFolder
      ? createFolderNode(currentSlug, child, opts)
      : createFileNode(currentSlug, child)
    ul.appendChild(childNode)
  }

  return li
}

async function setupExplorer(currentSlug: FullSlug) {
  const allExplorers = document.querySelectorAll("div.explorer") as NodeListOf<HTMLElement>

  for (const explorer of allExplorers) {
    const dataFns = JSON.parse(explorer.dataset.dataFns || "{}")
    const opts: ParsedOptions = {
      folderClickBehavior: (explorer.dataset.behavior || "collapse") as "collapse" | "link",
      folderDefaultState: (explorer.dataset.collapsed || "collapsed") as "collapsed" | "open",
      useSavedState: explorer.dataset.savestate === "true",
      order: dataFns.order || ["filter", "map", "sort"],
      sortFn: new Function("return " + (dataFns.sortFn || "undefined"))(),
      filterFn: new Function("return " + (dataFns.filterFn || "undefined"))(),
      mapFn: new Function("return " + (dataFns.mapFn || "undefined"))(),
    }

    const storageTree = localStorage.getItem("fileTree")

    let serializedExplorerState: FolderState[] = []
    if (storageTree && opts.useSavedState) {
      try {
        const parsed: unknown = JSON.parse(storageTree)
        if (Array.isArray(parsed)) {
          serializedExplorerState = parsed
            .filter((x: any) => x && typeof x.path === "string")
            .map((x: any) => ({
              path: x.path as FullSlug,
              collapsed: Boolean(x.collapsed),
            }))
        }
      } catch {
        serializedExplorerState = []
      }
    }

    const oldIndex = new Map<FullSlug, boolean>(
      serializedExplorerState.map((entry) => [entry.path, entry.collapsed]),
    )

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

    const folderPaths = trie.getFolderPaths() as FullSlug[]
    currentExplorerState = folderPaths.map((path) => ({
      path,
      collapsed: oldIndex.get(path) ?? opts.folderDefaultState === "collapsed",
    }))

    const explorerUl = explorer.querySelector(".explorer-ul") as HTMLElement | null
    if (!explorerUl) continue

    const fragment = document.createDocumentFragment()
    for (const child of trie.children) {
      const node = child.isFolder
        ? createFolderNode(currentSlug, child, opts)
        : createFileNode(currentSlug, child)

      fragment.appendChild(node)
    }
    explorerUl.insertBefore(fragment, explorerUl.firstChild)

    const scrollTop = sessionStorage.getItem("explorerScrollTop")
    if (scrollTop) {
      explorerUl.scrollTop = parseInt(scrollTop)
    } else {
      const activeElement = explorerUl.querySelector(".active") as HTMLElement | null
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth" })
      }
    }

    const explorerButtons = explorer.getElementsByClassName(
      "explorer-toggle",
    ) as HTMLCollectionOf<HTMLElement>
    for (const button of explorerButtons) {
      button.addEventListener("click", toggleExplorer)
      window.addCleanup(() => button.removeEventListener("click", toggleExplorer))
    }

    if (opts.folderClickBehavior === "collapse") {
      const folderButtons = explorer.getElementsByClassName(
        "folder-button",
      ) as HTMLCollectionOf<HTMLElement>
      for (const button of folderButtons) {
        button.addEventListener("click", toggleFolder)
        window.addCleanup(() => button.removeEventListener("click", toggleFolder))
      }
    }

    const folderIcons = explorer.getElementsByClassName(
      "folder-icon",
    ) as HTMLCollectionOf<HTMLElement>
    for (const icon of folderIcons) {
      icon.addEventListener("click", toggleFolder)
      window.addCleanup(() => icon.removeEventListener("click", toggleFolder))
    }
  }
}

document.addEventListener("prenav", async () => {
  const explorer = document.querySelector(".explorer-ul") as HTMLElement | null
  if (!explorer) return
  sessionStorage.setItem("explorerScrollTop", explorer.scrollTop.toString())
})

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
    return
  }
})

function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}
