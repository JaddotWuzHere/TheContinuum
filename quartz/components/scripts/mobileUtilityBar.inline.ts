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

      const closeButton = target.closest<HTMLButtonElement>("[data-mobile-tool-close]")

      if (closeButton) {
        event.preventDefault()
        closeMobileUtilityPanels()
      }
    })

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileUtilityPanels()
    })

    document.addEventListener("prenav", closeMobileUtilityPanels)
    document.addEventListener("nav", setupMobileUtilityBar)

    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => {
        document.removeEventListener("nav", setupMobileUtilityBar)
      })
    }
  }

  setupMobileUtilityBar()
}