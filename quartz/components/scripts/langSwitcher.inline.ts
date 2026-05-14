(() => {
  function initLangSwitcher(root: HTMLElement): void {
    if ((root as any)._langSwitcherInit) return
    ;(root as any)._langSwitcherInit = true

    const wrap = root.querySelector<HTMLElement>(".wrap")
    const trigger = root.querySelector<HTMLButtonElement>(".lang-trigger")
    const select =
      root.querySelector<HTMLSelectElement>(".lang-select-native") ??
      root.querySelector<HTMLSelectElement>("select")
    const menu = root.querySelector<HTMLElement>(".lang-menu")
    const items = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".lang-menu-item"),
    )

    if (!wrap || !trigger || !select || !menu || items.length === 0) return

    const safeTrigger = trigger as HTMLButtonElement
    const safeSelect = select as HTMLSelectElement

    function setOpen(open: boolean): void {
      root.setAttribute("data-open", open ? "1" : "0")
      safeTrigger.setAttribute("aria-expanded", open ? "true" : "false")
    }

    function toggleOpen(): void {
      const isOpen = root.getAttribute("data-open") === "1"
      setOpen(!isOpen)
    }

    function navigateToLang(lang: string): void {
      const url = new URL(window.location.href)
      const parts = url.pathname.split("/").filter(Boolean)
      const supported = new Set(["en", "zh", "fr", "ja"])
      const first = parts[0]

      if (supported.has(first)) {
        parts[0] = lang
      } else {
        parts.unshift(lang)
      }

      const hadTrailingSlash = url.pathname.endsWith("/")
      url.pathname = "/" + parts.join("/") + (hadTrailingSlash ? "/" : "")
      window.location.assign(url.toString())
    }

    function setActiveByValue(value: string): void {
      let chosen: HTMLButtonElement | null = null

      for (const item of items) {
        if (item.dataset.lang === value) {
          item.setAttribute("data-active", "1")
          item.setAttribute("aria-selected", "true")
          chosen = item
        } else {
          item.setAttribute("data-active", "0")
          item.setAttribute("aria-selected", "false")
        }
      }

      if (chosen) {
        const label = chosen.querySelector("span")?.textContent?.trim() || value
        safeTrigger.textContent = label
      }
    }

    const parts = window.location.pathname.split("/").filter(Boolean)
    const supported = new Set(["en", "zh", "fr", "ja"])
    const current = supported.has(parts[0]) ? parts[0] : "en"

    safeSelect.value = current
    setActiveByValue(current)
    setOpen(false)

    wrap.addEventListener("click", (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null

      if (target?.closest(".lang-menu")) return

      ev.preventDefault()
      ev.stopPropagation()
      toggleOpen()
    })

    safeTrigger.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault()
        ev.stopPropagation()
        toggleOpen()
      }

      if (ev.key === "Escape") {
        ev.preventDefault()
        setOpen(false)
      }
    })

    for (const item of items) {
      item.addEventListener("click", (ev: MouseEvent) => {
        ev.preventDefault()
        ev.stopPropagation()

        const lang = item.dataset.lang
        if (!lang) return

        safeSelect.value = lang
        safeSelect.dispatchEvent(new Event("change", { bubbles: true }))

        setActiveByValue(lang)
        setOpen(false)
        navigateToLang(lang)
      })
    }

    document.addEventListener("click", (ev: MouseEvent) => {
      if (!(ev.target instanceof Node)) return
      if (!root.contains(ev.target)) setOpen(false)
    })

    root.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false)
    })
  }

  function runLangSwitchers(): void {
    document
      .querySelectorAll<HTMLElement>(".lang-switcher")
      .forEach((root) => {
        const parts = window.location.pathname.split("/").filter(Boolean)
        const supported = new Set(["en", "zh", "fr", "ja"])
        const current = supported.has(parts[0]) ? parts[0] : "en"

        const trigger = root.querySelector<HTMLButtonElement>(".lang-trigger")
        const select =
          root.querySelector<HTMLSelectElement>(".lang-select-native") ??
          root.querySelector<HTMLSelectElement>("select")
        const items = Array.from(
          root.querySelectorAll<HTMLButtonElement>(".lang-menu-item"),
        )

        if (trigger && select && items.length > 0) {
          select.value = current

          for (const item of items) {
            if (item.dataset.lang === current) {
              item.setAttribute("data-active", "1")
              item.setAttribute("aria-selected", "true")

              const label =
                item.querySelector("span")?.textContent?.trim() || current
              trigger.textContent = label
            } else {
              item.setAttribute("data-active", "0")
              item.setAttribute("aria-selected", "false")
            }
          }
        }

        initLangSwitcher(root)
      })
  }

  runLangSwitchers()
  document.addEventListener("nav", runLangSwitchers)
})()