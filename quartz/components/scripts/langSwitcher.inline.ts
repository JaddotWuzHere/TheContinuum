(() => {
  function initLangSwitcher(root: HTMLElement): void {
    const trigger = root.querySelector<HTMLButtonElement>(".lang-trigger")
    const select =
      root.querySelector<HTMLSelectElement>(".lang-select-native") ??
      root.querySelector<HTMLSelectElement>("select")
    const menu = root.querySelector<HTMLElement>(".lang-menu")
    const items = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".lang-menu-item"),
    )

    if (!trigger || !select || !menu || items.length === 0) return

    const safeTrigger = trigger as HTMLButtonElement
    const safeSelect = select as HTMLSelectElement

    function setOpen(open: boolean): void {
      root.setAttribute("data-open", open ? "1" : "0")
      safeTrigger.setAttribute("aria-expanded", open ? "true" : "false")
    }

    function navigateToLang(lang: string): void {
      const url = new URL(window.location.href)

      const parts = url.pathname.split("/").filter(Boolean)

      const supported = new Set(["en", "zh", "fr"])
      const first = parts[0]

      if (supported.has(first)) {
        parts[0] = lang
      } else {
        parts.unshift(lang)
      }

      url.pathname = "/" + parts.join("/") + (url.pathname.endsWith("/") ? "/" : "")
      window.location.assign(url.toString())
    }

    function setActiveByValue(value: string): void {
      let chosen: HTMLButtonElement | null = null

      for (const item of items) {
        if (item.dataset.lang === value) {
          item.setAttribute("data-active", "1")
          chosen = item
        } else {
          item.setAttribute("data-active", "0")
        }
      }

      if (chosen) {
        const label =
          chosen.querySelector("span")?.textContent?.trim() || value
        safeTrigger.textContent = label
      }
    }

    const parts = window.location.pathname.split("/").filter(Boolean)
    const supported = new Set(["en", "zh", "fr"])
    const current = supported.has(parts[0]) ? parts[0] : "en"

    safeSelect.value = current
    setActiveByValue(current)

    safeTrigger.addEventListener("click", (ev: MouseEvent) => {
      ev.stopPropagation()
      const isOpen = root.getAttribute("data-open") === "1"
      setOpen(!isOpen)
    })

    for (const item of items) {
      item.addEventListener("click", (ev: MouseEvent) => {
        ev.stopPropagation()
        const lang = item.dataset.lang
        if (!lang) return

        safeSelect.value = lang
        safeSelect.dispatchEvent(
          new Event("change", { bubbles: true }),
        )

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

  document
    .querySelectorAll<HTMLElement>(".lang-switcher")
    .forEach(initLangSwitcher)
})()
