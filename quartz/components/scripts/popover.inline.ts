import { normalizeRelativeURLs } from "../../util/path"
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
          default:
            break
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

        const elts = [...html.getElementsByClassName("popover-hint")]
        if (elts.length === 0) return

        elts.forEach((elt) => popoverInner.appendChild(elt))
      }
    }

    if (document.getElementById(popoverId)) {
      return
    }

    document.body.appendChild(popoverElement)

    if (activeAnchor !== link) {
      animatePopoverClose(popoverElement)
      return
    }

    showPopover(popoverElement, popoverInner)
  }, 400)
}

document.addEventListener("nav", () => {
  const links = [...document.querySelectorAll("a.internal")] as HTMLAnchorElement[]

  for (const link of links) {
    link.addEventListener("mouseenter", mouseEnterHandler)
    link.addEventListener("mouseleave", linkMouseLeaveHandler)

    window.addCleanup(() => {
      link.removeEventListener("mouseenter", mouseEnterHandler)
      link.removeEventListener("mouseleave", linkMouseLeaveHandler)
    })
  }
})