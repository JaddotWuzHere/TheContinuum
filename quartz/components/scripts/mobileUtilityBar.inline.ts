{
  const MOBILE_UTILITY_BOUND = "__continuumMobileUtilityBound"

  function closeMobileUtilityPanels() {
    const root = document.documentElement

    root.removeAttribute("data-mobile-tool-open")

    document
      .querySelectorAll<HTMLButtonElement>(".mobile-utility-button[data-mobile-tool]")
      .forEach((button) => {
        button.setAttribute("aria-expanded", "false")
        button.classList.remove("is-active")
      })

    updateMobileToolFades()
  }

  function updateMobileToolFades() {
    document.querySelectorAll<HTMLElement>(".mobile-tool-panel").forEach((panel) => {
      const scroller = panel.querySelector<HTMLElement>(".mobile-tool-list")

      if (!scroller) {
        panel.classList.remove("can-scroll-up", "can-scroll-down")
        return
      }

      const scrollTop = scroller.scrollTop
      const maxScrollTop = scroller.scrollHeight - scroller.clientHeight
      const threshold = 2

      panel.classList.toggle("can-scroll-up", scrollTop > threshold)
      panel.classList.toggle("can-scroll-down", scrollTop < maxScrollTop - threshold)
    })
  }

  function setMobileUtilityTool(tool: string | null) {
    const root = document.documentElement
    const currentlyOpen = root.getAttribute("data-mobile-tool-open")
    const nextTool = currentlyOpen === tool ? null : tool

    if (!nextTool) {
      closeMobileUtilityPanels()
      return
    }

    root.setAttribute("data-mobile-tool-open", nextTool)

    document
      .querySelectorAll<HTMLButtonElement>(".mobile-utility-button[data-mobile-tool]")
      .forEach((button) => {
        const isActive = button.dataset.mobileTool === nextTool
        button.setAttribute("aria-expanded", String(isActive))
        button.classList.toggle("is-active", isActive)
      })

    requestAnimationFrame(updateMobileToolFades)
  }

  function setupMobileUtilityBar() {
    const root = document.documentElement
    const openTool = root.getAttribute("data-mobile-tool-open")

    document
      .querySelectorAll<HTMLButtonElement>(".mobile-utility-button[data-mobile-tool]")
      .forEach((button) => {
        const isActive = button.dataset.mobileTool === openTool
        button.setAttribute("aria-expanded", String(isActive))
        button.classList.toggle("is-active", isActive)
      })

    requestAnimationFrame(updateMobileToolFades)
  }

  function handleMobileToolScroll(event: Event) {
    const target = event.target as HTMLElement | null
    if (!target?.closest?.(".mobile-tool-list")) return

    updateMobileToolFades()
  }

  if (!(document as any)[MOBILE_UTILITY_BOUND]) {
    ;(document as any)[MOBILE_UTILITY_BOUND] = true

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const toolButton = target.closest<HTMLButtonElement>(
        ".mobile-utility-button[data-mobile-tool]",
      )

      if (toolButton) {
        const tool = toolButton.dataset.mobileTool
        if (!tool) return

        event.preventDefault()
        setMobileUtilityTool(tool)
        return
      }

      const openTool = document.documentElement.getAttribute("data-mobile-tool-open")
      if (!openTool) return

      const openPanel = target.closest<HTMLElement>(".mobile-tool-panel")

      if (!openPanel) {
        closeMobileUtilityPanels()
        return
      }

      const clickedPanelAction = target.closest<HTMLElement>(
        ".mobile-tool-panel a, .mobile-tool-panel button",
      )

      if (clickedPanelAction) {
        closeMobileUtilityPanels()
      }
    })

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileUtilityPanels()
    })

    document.addEventListener("scroll", handleMobileToolScroll, true)
    window.addEventListener("resize", updateMobileToolFades)

    document.addEventListener("prenav", closeMobileUtilityPanels)
    document.addEventListener("nav", setupMobileUtilityBar)

    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => {
        document.removeEventListener("nav", setupMobileUtilityBar)
        document.removeEventListener("scroll", handleMobileToolScroll, true)
        window.removeEventListener("resize", updateMobileToolFades)
      })
    }
  }

  setupMobileUtilityBar()
}