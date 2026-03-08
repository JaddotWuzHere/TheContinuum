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

  // reading the body can only be done once, so we need to clone the response
  // to allow the caller to read it if it's was not a redirect
  const text = await res.clone().text()
  const [_, redirect] = text.match(canonicalRegex) ?? []
  return redirect ? fetch(`${new URL(redirect, url)}`) : res
}

let scrollLockDepth = 0
let lockedScrollY = 0

export function lockPageScroll() {
  scrollLockDepth += 1
  if (scrollLockDepth > 1) return

  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0

  document.documentElement.setAttribute("data-page-scroll-locked", "1")
  document.documentElement.style.setProperty("--scroll-lock-top", `-${lockedScrollY}px`)
}

export function unlockPageScroll() {
  if (scrollLockDepth === 0) return

  scrollLockDepth -= 1
  if (scrollLockDepth > 0) return

  const html = document.documentElement
  const body = document.body

  html.removeAttribute("data-page-scroll-locked")
  html.style.removeProperty("--scroll-lock-top")

  const previousScrollBehavior = html.style.scrollBehavior
  const previousBodyScrollBehavior = body.style.scrollBehavior

  html.style.scrollBehavior = "auto"
  body.style.scrollBehavior = "auto"

  window.scrollTo(0, lockedScrollY)

  requestAnimationFrame(() => {
    html.style.scrollBehavior = previousScrollBehavior
    body.style.scrollBehavior = previousBodyScrollBehavior
  })
}