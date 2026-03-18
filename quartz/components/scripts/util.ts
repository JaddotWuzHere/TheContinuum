export function registerEscapeHandler(outsideContainer: HTMLElement | null, cb: () => void) {
  if (!outsideContainer) return

  function click(this: HTMLElement, e: HTMLElementEventMap["click"]) {
    if (e.target !== this) return
    e.preventDefault()
    e.stopPropagation()
    cb()
  }

  function esc(e: HTMLElementEventMap["keydown"]) {
    if (!e.key.startsWith("Esc")) return
    e.preventDefault()
    cb()
  }

  outsideContainer?.addEventListener("click", click)
  window.addCleanup(() => outsideContainer?.removeEventListener("click", click))
  document.addEventListener("keydown", esc)
  window.addCleanup(() => document.removeEventListener("keydown", esc))
}

export function removeAllChildren(node: HTMLElement) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

// AliasRedirect emits HTML redirects which also have the link[rel="canonical"]
// containing the URL it's redirecting to.
// Extracting it here with regex is _probably_ faster than parsing the entire HTML
// with a DOMParser effectively twice (here and later in the SPA code), even if
// way less robust - we only care about our own generated redirects after all.
const canonicalRegex = /<link rel="canonical" href="([^"]*)">/

export async function fetchCanonical(url: URL): Promise<Response> {
  const res = await fetch(`${url}`)
  if (!res.headers.get("content-type")?.startsWith("text/html")) {
    return res
  }

  const text = await res.clone().text()
  const [_, redirect] = text.match(canonicalRegex) ?? []
  return redirect ? fetch(`${new URL(redirect, url)}`) : res
}

let scrollLockDepth = 0

const blockedKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
])

const noScrollZoneSelectors = [
  ".page-title",
  ".page-title-visual",
  ".toc",
  ".backlinks",
  ".continuum-explorer-handle",
  ".continuum-settings-handle",
  ".explorer",
  ".settings-panel",
].join(", ")

function isAllowedNestedScrollTarget(el: Element | null): boolean {
  if (!el) return false

  return Boolean(
    el.closest(".explorer-content") ||
      el.closest(".settings-content") ||
      el.closest(".toc .overflow") ||
      el.closest(".backlinks .overflow"),
  )
}

function preventWheelInNoScrollZone(e: WheelEvent) {
  const el = e.target as Element | null
  if (!el?.closest(noScrollZoneSelectors)) return

  if (isAllowedNestedScrollTarget(el)) return

  e.preventDefault()
}

function preventTouchMoveInNoScrollZone(e: TouchEvent) {
  const el = e.target as Element | null
  if (!el?.closest(noScrollZoneSelectors)) return

  if (isAllowedNestedScrollTarget(el)) return

  e.preventDefault()
}

export function installNoScrollZoneGuards() {
  if ((document as any)._continuumNoScrollZoneGuardsBound) return
  ;(document as any)._continuumNoScrollZoneGuardsBound = true

  window.addEventListener("wheel", preventWheelInNoScrollZone, {
    passive: false,
    capture: true,
  })

  window.addEventListener("touchmove", preventTouchMoveInNoScrollZone, {
    passive: false,
    capture: true,
  })
}

function getScrollableAncestor(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null

  const scrollableSelectors = [
    ".results-container",
    ".preview-container",
    ".settings-scroll",
    ".explorer",
    ".settings-panel",
    ".search-layout",
    ".search-container",
  ]

  for (const selector of scrollableSelectors) {
    const el = target.closest(selector) as HTMLElement | null
    if (!el) continue

    const style = window.getComputedStyle(el)
    const canScrollY =
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight

    if (canScrollY) return el
  }

  return null
}

function canScrollElement(el: HTMLElement, deltaY: number): boolean {
  if (deltaY < 0) {
    return el.scrollTop > 0
  }

  if (deltaY > 0) {
    return el.scrollTop + el.clientHeight < el.scrollHeight
  }

  return true
}

function preventWheel(e: WheelEvent) {
  const scrollable = getScrollableAncestor(e.target)
  if (scrollable && canScrollElement(scrollable, e.deltaY)) return
  e.preventDefault()
}

function preventTouchMove(e: TouchEvent) {
  const scrollable = getScrollableAncestor(e.target)
  if (scrollable) return
  e.preventDefault()
}

function preventKeyScroll(e: KeyboardEvent) {
  if (!blockedKeys.has(e.key)) return

  const target = e.target as HTMLElement | null
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) {
    return
  }

  const scrollable = getScrollableAncestor(e.target)
  if (scrollable) return

  e.preventDefault()
}

export function lockPageScroll() {
  scrollLockDepth += 1
  if (scrollLockDepth > 1) return

  document.documentElement.setAttribute("data-page-scroll-locked", "1")

  window.addEventListener("wheel", preventWheel, { passive: false })
  window.addEventListener("touchmove", preventTouchMove, { passive: false })
  window.addEventListener("keydown", preventKeyScroll, { passive: false })
}

export function unlockPageScroll() {
  if (scrollLockDepth === 0) return

  scrollLockDepth -= 1
  if (scrollLockDepth > 0) return

  document.documentElement.removeAttribute("data-page-scroll-locked")

  window.removeEventListener("wheel", preventWheel)
  window.removeEventListener("touchmove", preventTouchMove)
  window.removeEventListener("keydown", preventKeyScroll)
}