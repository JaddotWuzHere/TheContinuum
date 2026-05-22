import { normalizeRelativeURLs } from "../../util/path"
import { i18n } from "../../i18n"
import { localeFromSlug, toI18nLocale } from "../../util/locale"
import { fetchCanonical } from "./util"

const p = new DOMParser()

let activeAnchor: HTMLAnchorElement | null = null
let hoverTimer: number | null = null
let closeTimer: number | null = null

function cancelHoverTimer() {
  if (hoverTimer !== null) {
    window.clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

function cancelCloseTimer() {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

function getActivePopover(): HTMLElement | null {
  return document.querySelector(".popover.active-popover")
}

function animatePopoverClose(popoverElement: HTMLElement) {
  popoverElement.classList.remove("active-popover")

  if (popoverElement.classList.contains("closing-popover")) {
    return
  }

  popoverElement.classList.add("closing-popover")

  const handleAnimationEnd = () => {
    popoverElement.classList.remove("closing-popover")
    popoverElement.removeEventListener("animationend", handleAnimationEnd)
  }

  popoverElement.addEventListener("animationend", handleAnimationEnd)
}

function clearActivePopover() {
  activeAnchor = null
  cancelHoverTimer()
  cancelCloseTimer()

  const allPopoverElements = document.querySelectorAll(".popover")
  allPopoverElements.forEach((popoverElement) => {
    const el = popoverElement as HTMLElement
    if (el.classList.contains("active-popover")) {
      animatePopoverClose(el)
    }
  })
}

function schedulePopoverClose() {
  cancelCloseTimer()
  closeTimer = window.setTimeout(() => {
    clearActivePopover()
  }, 120)
}

function popoverMouseEnterHandler() {
  cancelCloseTimer()
}

function popoverMouseLeaveHandler() {
  schedulePopoverClose()
}

function linkMouseLeaveHandler(this: HTMLAnchorElement, event: MouseEvent) {
  cancelHoverTimer()

  const next = event.relatedTarget as Node | null
  const popover = document.querySelector(".popover") as HTMLElement | null

  if (popover && next && popover.contains(next)) {
    return
  }

  schedulePopoverClose()
}

/*
Removes header anchor icons (# link icons)
*/
function stripHeaderAnchorsFromPopover(root: ParentNode) {
  root.querySelectorAll('a[href^="#"], a[role="anchor"]').forEach((anchor) => {
    const el = anchor as HTMLAnchorElement

    const parentTag = el.parentElement?.tagName
    const isHeadingAnchor =
      parentTag === "H1" ||
      parentTag === "H2" ||
      parentTag === "H3" ||
      parentTag === "H4" ||
      parentTag === "H5" ||
      parentTag === "H6"

    if (isHeadingAnchor || el.getAttribute("role") === "anchor") {
      el.remove()
    }
  })
}

/*
Neutralizes links so they no longer behave as links
(no browser URL preview, no navigation)
*/
function neutralizeLinksInPopover(root: ParentNode) {
  root.querySelectorAll("a[href]").forEach((anchor) => {
    const el = anchor as HTMLAnchorElement

    el.dataset.originalHref = el.href
    el.removeAttribute("href")
    el.style.cursor = "default"
  })
}

function normalizeSlugForLookup(slug: string): string {
  return slug
    .toString()
    .trim()
    .replace(/^\/+/g, "")
    .replace(/\/+/g, "/")
    .replace(/\/index$/g, "")
    .replace(/\/$/g, "")
}

function getRestFromLocalizedPath(pathname: string): string {
  const parts = pathname
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part)
      } catch {
        return part
      }
    })

  const first = (parts[0] || "").toLowerCase()

  if (first === "zh" || first === "fr" || first === "ja" || first === "en") {
    return parts.slice(1).join("/")
  }

  return parts.join("/")
}

function getContentIndexSlugs(contentIndex: Record<string, any>): Set<string> {
  const slugs = new Set<string>()

  for (const [key, value] of Object.entries(contentIndex || {})) {
    slugs.add(normalizeSlugForLookup(key))

    if (value && typeof value === "object" && typeof value.slug === "string") {
      slugs.add(normalizeSlugForLookup(value.slug))
    }
  }

  return slugs
}

async function fetchTranslationRegistry(): Promise<Record<string, any>> {
  try {
    const response = await fetch("/static/translations.json")

    if (!response.ok) return {}

    return await response.json()
  } catch {
    return {}
  }
}

function findEnglishVersionFromRegistry(
  contentIndex: Record<string, any>,
  translationRegistry: Record<string, any>,
  lang: "en" | "zh" | "fr" | "ja",
  rest: string,
): string | null {
  if (lang === "en") return null
  if (!rest) return null

  const requestedRest = normalizeSlugForLookup(rest)
  const existingSlugs = getContentIndexSlugs(contentIndex)

  for (const entry of Object.values(translationRegistry || {})) {
    if (!entry || typeof entry !== "object") continue

    const localizedSlug = entry[lang]
    const englishSlug = entry.en

    if (!localizedSlug || !englishSlug) continue

    const normalizedLocalizedSlug = normalizeSlugForLookup(localizedSlug)
    const normalizedEnglishSlug = normalizeSlugForLookup(`en/${englishSlug}`)

    if (normalizedLocalizedSlug !== requestedRest) continue

    if (existingSlugs.has(normalizedEnglishSlug)) {
      return `/${normalizedEnglishSlug}/`
    }
  }

  return null
}

async function detectUntranslatedEnglishVersion(
  lang: "en" | "zh" | "fr" | "ja",
  rest: string,
): Promise<string | null> {
  if (lang === "en") return null
  if (!rest) return null

  try {
    const [contentIndex, translationRegistry] = await Promise.all([
      fetchData,
      fetchTranslationRegistry(),
    ])

    return findEnglishVersionFromRegistry(contentIndex, translationRegistry, lang, rest)
  } catch {
    return null
  }
}

async function localize404Popover(root: ParentNode, targetUrl: URL): Promise<void> {
  const article = root.querySelector(".continuum-404")
  if (!article) return

  const lang = localeFromSlug(targetUrl.pathname)
  const rest = getRestFromLocalizedPath(targetUrl.pathname)
  const pages = i18n(toI18nLocale(lang)).pages
  const englishHref = await detectUntranslatedEnglishVersion(lang, rest)
  const copy = englishHref ? pages.untranslated : pages.error

  const code = article.querySelector("#popover-internal-continuum-404-code")
  const title = article.querySelector("#popover-internal-continuum-404-title")
  const message = article.querySelector("#popover-internal-continuum-404-message")
  const backLink = article.querySelector("#popover-internal-localized-back-link")
  const englishLink = article.querySelector("#popover-internal-localized-english-link")
  const homeLink = article.querySelector("#popover-internal-localized-home-link")

  const localizedHome =
    lang === "zh"
      ? "/zh/"
      : lang === "fr"
        ? "/fr/"
        : lang === "ja"
          ? "/ja/"
          : "/en/"

  if (code) code.textContent = copy.code
  if (title) title.textContent = copy.title
  if (message) message.textContent = copy.message

  if (backLink) {
    backLink.textContent = pages.error.goBack
    backLink.setAttribute("href", localizedHome)
  }

  if (homeLink) {
    homeLink.textContent = pages.error.returnToGenesis
    homeLink.setAttribute("href", localizedHome)
  }

  if (englishLink) {
    if (englishHref) {
      englishLink.textContent = pages.untranslated.viewEnglish
      englishLink.setAttribute("href", englishHref + targetUrl.hash)
      englishLink.removeAttribute("hidden")
    } else {
      englishLink.setAttribute("hidden", "")
      englishLink.removeAttribute("href")
    }
  }
}

async function mouseEnterHandler(this: HTMLAnchorElement, event: MouseEvent) {
  const link = this
  const { clientX, clientY } = event

  if (link.dataset.noPopover === "true") {
    return
  }

  cancelHoverTimer()
  cancelCloseTimer()

  hoverTimer = window.setTimeout(async () => {
    activeAnchor = link

    const targetUrl = new URL(link.href)
    const hash = decodeURIComponent(targetUrl.hash)
    targetUrl.hash = ""
    targetUrl.search = ""

    const popoverId = `popover-${link.pathname}`
    const prevPopoverElement = document.getElementById(popoverId) as HTMLElement | null

    async function setPosition(popoverElement: HTMLElement) {
      const gap = 18
      const verticalOffset = 10
      const viewportPadding = 8

      popoverElement.style.left = "0px"
      popoverElement.style.top = "0px"
      popoverElement.style.transform = "none"

      const rect = popoverElement.getBoundingClientRect()
      const popoverWidth = rect.width
      const popoverHeight = rect.height

      const placeRight = clientX < window.innerWidth / 2

      let x = placeRight ? clientX + gap : clientX - popoverWidth - gap
      let y = clientY + verticalOffset

      x = Math.max(
        viewportPadding,
        Math.min(x, window.innerWidth - popoverWidth - viewportPadding),
      )

      y = Math.max(
        viewportPadding,
        Math.min(y, window.innerHeight - popoverHeight - viewportPadding),
      )

      Object.assign(popoverElement.style, {
        left: `${Math.round(x)}px`,
        top: `${Math.round(y)}px`,
        transform: "none",
      })
    }

    function showPopover(popoverElement: HTMLElement, popoverInner?: HTMLElement) {
      const currentActive = getActivePopover()
      if (currentActive && currentActive !== popoverElement) {
        animatePopoverClose(currentActive)
      }

      activeAnchor = link
      cancelCloseTimer()

      popoverElement.classList.remove("closing-popover")
      popoverElement.classList.add("active-popover")

      popoverElement.removeEventListener("mouseenter", popoverMouseEnterHandler)
      popoverElement.removeEventListener("mouseleave", popoverMouseLeaveHandler)
      popoverElement.addEventListener("mouseenter", popoverMouseEnterHandler)
      popoverElement.addEventListener("mouseleave", popoverMouseLeaveHandler)

      void setPosition(popoverElement)

      if (hash !== "" && popoverInner) {
        const targetAnchor = `#popover-internal-${hash.slice(1)}`
        const heading = popoverInner.querySelector(targetAnchor) as HTMLElement | null
        if (heading) {
          popoverInner.scroll({
            top: heading.offsetTop - 12,
            behavior: "instant" as ScrollBehavior,
          })
        }
      }
    }

    if (prevPopoverElement) {
      if (activeAnchor === link) {
        const prevInner = prevPopoverElement.querySelector(".popover-inner") as HTMLElement | null
        showPopover(prevPopoverElement, prevInner ?? undefined)
      }
      return
    }

    const response = await fetchCanonical(targetUrl).catch((err) => {
      console.error(err)
    })

    if (!response || activeAnchor !== link) return

    const contentTypeHeader = response.headers.get("Content-Type")
    if (!contentTypeHeader) return

    const [contentType] = contentTypeHeader.split(";")
    const [contentTypeCategory, typeInfo] = contentType.split("/")

    const popoverElement = document.createElement("div")
    popoverElement.id = popoverId
    popoverElement.classList.add("popover")

    const popoverInner = document.createElement("div")
    popoverInner.classList.add("popover-inner")
    popoverInner.dataset.contentType = contentType ?? undefined
    popoverInner.dataset.lang = localeFromSlug(targetUrl.pathname)
    popoverElement.appendChild(popoverInner)

    switch (contentTypeCategory) {
      case "image": {
        const img = document.createElement("img")
        img.src = targetUrl.toString()
        img.alt = targetUrl.pathname
        popoverInner.appendChild(img)
        break
      }

      case "application": {
        switch (typeInfo) {
          case "pdf": {
            const pdf = document.createElement("iframe")
            pdf.src = targetUrl.toString()
            popoverInner.appendChild(pdf)
            break
          }
        }
        break
      }

      default: {
        const contents = await response.text()
        const html = p.parseFromString(contents, "text/html")

        normalizeRelativeURLs(html, targetUrl)

        html.querySelectorAll("[id]").forEach((el) => {
          el.id = `popover-internal-${el.id}`
        })

        await localize404Popover(html, targetUrl)

        const elts = [...html.getElementsByClassName("popover-hint")]
        if (elts.length === 0) return

        elts.forEach((elt) => popoverInner.appendChild(elt))

        stripHeaderAnchorsFromPopover(popoverInner)
        neutralizeLinksInPopover(popoverInner)
      }
    }

    if (document.getElementById(popoverId)) return

    document.body.appendChild(popoverElement)

    if (activeAnchor !== link) {
      animatePopoverClose(popoverElement)
      return
    }

    showPopover(popoverElement, popoverInner)
  }, 400)
}

function linkClickHandler() {
  clearActivePopover()
}

document.addEventListener("nav", () => {
  clearActivePopover()

  const links = [...document.querySelectorAll("a.internal")] as HTMLAnchorElement[]

  for (const link of links) {
    link.addEventListener("mouseenter", mouseEnterHandler)
    link.addEventListener("mouseleave", linkMouseLeaveHandler)
    link.addEventListener("click", linkClickHandler)

    window.addCleanup(() => {
      link.removeEventListener("mouseenter", mouseEnterHandler)
      link.removeEventListener("mouseleave", linkMouseLeaveHandler)
      link.removeEventListener("click", linkClickHandler)
    })
  }
})