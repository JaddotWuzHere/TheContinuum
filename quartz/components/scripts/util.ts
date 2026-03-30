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

type PageScrollLockGuards = {
  wheel: (e: WheelEvent) => void
  touchmove: (e: TouchEvent) => void
  keydown: (e: KeyboardEvent) => void
}

function getPageScrollLockGuards(): PageScrollLockGuards {
  const w = window as any

  if (w.__continuumPageScrollLockGuards) {
    return w.__continuumPageScrollLockGuards as PageScrollLockGuards
  }

  const guards: PageScrollLockGuards = {
    wheel: (e: WheelEvent) => {
      const scrollable = getScrollableAncestor(e.target)
      if (scrollable && canScrollElement(scrollable, e.deltaY)) return
      e.preventDefault()
    },

    touchmove: (e: TouchEvent) => {
      const scrollable = getScrollableAncestor(e.target)
      if (scrollable) return
      e.preventDefault()
    },

    keydown: (e: KeyboardEvent) => {
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
    },
  }

  w.__continuumPageScrollLockGuards = guards
  return guards
}

function shouldKeepPageScrollLocked() {
  const root = document.documentElement
  return (
    root.hasAttribute("data-search-open") ||
    root.hasAttribute("data-settings-open") ||
    root.hasAttribute("data-explorer-open")
  )
}

function applyHardScrollLock() {
  const html = document.documentElement
  const body = document.body

  html.setAttribute("data-page-scroll-locked", "1")
  html.style.overflow = "hidden"
  body.style.overflow = "hidden"
  body.style.touchAction = "none"
}

function clearHardScrollLock() {
  const html = document.documentElement
  const body = document.body

  html.removeAttribute("data-page-scroll-locked")
  html.style.removeProperty("overflow")
  body.style.removeProperty("overflow")
  body.style.removeProperty("touch-action")
}

function bindPageScrollLockGuards() {
  const w = window as any
  if (w.__continuumPageScrollLockBound) return
  w.__continuumPageScrollLockBound = true

  const guards = getPageScrollLockGuards()

  window.addEventListener("wheel", guards.wheel, { passive: false })
  window.addEventListener("touchmove", guards.touchmove, { passive: false })
  window.addEventListener("keydown", guards.keydown, { passive: false })
}

function unbindPageScrollLockGuards() {
  const w = window as any
  const guards = getPageScrollLockGuards()

  window.removeEventListener("wheel", guards.wheel)
  window.removeEventListener("touchmove", guards.touchmove)
  window.removeEventListener("keydown", guards.keydown)

  w.__continuumPageScrollLockBound = false
}

function syncPageScrollLock() {
  if (shouldKeepPageScrollLocked()) {
    applyHardScrollLock()
    bindPageScrollLockGuards()
  } else {
    clearHardScrollLock()
    unbindPageScrollLockGuards()
  }
}

export function lockPageScroll() {
  syncPageScrollLock()
}

export function unlockPageScroll() {
  syncPageScrollLock()
}

export function forceUnlockPageScroll() {
  clearHardScrollLock()
  unbindPageScrollLockGuards()
}