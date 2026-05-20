const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const slug = entry.target.id
    const tocEntryElements = document.querySelectorAll(`a[data-for="${slug}"]`)
    const windowHeight = entry.rootBounds?.height
    if (windowHeight && tocEntryElements.length > 0) {
      if (entry.boundingClientRect.y < windowHeight) {
        tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.add("in-view"))
      } else {
        tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.remove("in-view"))
      }
    }
  }
})

function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) return
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

function updateScrollFadeHost(host: HTMLElement, scroller: HTMLElement) {
  const maxScroll = scroller.scrollHeight - scroller.clientHeight
  const epsilon = 2

  host.toggleAttribute("data-scroll-top", scroller.scrollTop > epsilon)
  host.toggleAttribute(
    "data-scroll-bottom",
    maxScroll > epsilon && scroller.scrollTop < maxScroll - epsilon,
  )
}

function setupSidebarScrollFades() {
  const pairs: Array<[HTMLElement, HTMLElement]> = []

  document.querySelectorAll<HTMLElement>(".toc").forEach((host) => {
    const scroller = host.querySelector<HTMLElement>(".toc-content")
    if (scroller) pairs.push([host, scroller])
  })

  document.querySelectorAll<HTMLElement>(".backlinks").forEach((host) => {
    const scroller = host.querySelector<HTMLElement>("ul")
    if (scroller) pairs.push([host, scroller])
  })

  for (const [host, scroller] of pairs) {
    const update = () => updateScrollFadeHost(host, scroller)

    update()
    requestAnimationFrame(update)

    scroller.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    window.addCleanup(() => {
      scroller.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    })
  }
}

document.addEventListener("nav", () => {
  setupToc()
  setupSidebarScrollFades()

  observer.disconnect()
  const headers = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  headers.forEach((header) => observer.observe(header))
})