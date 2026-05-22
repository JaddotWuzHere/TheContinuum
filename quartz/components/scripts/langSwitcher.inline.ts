import { forceUnlockPageScroll } from "./util"

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

    function closeDrawersBeforeLanguageNavigation(): void {
      const html = document.documentElement

      html.removeAttribute("data-settings-open")
      html.removeAttribute("data-explorer-open")
      html.removeAttribute("data-search-open")
      html.removeAttribute("data-page-scroll-locked")

      try {
        localStorage.setItem("continuum-settings-drawer", "closed")
        localStorage.setItem("continuum-explorer-drawer", "closed")
      } catch {
      }

      forceUnlockPageScroll()
    }

    function setOpen(open: boolean): void {
      root.setAttribute("data-open", open ? "1" : "0")
      safeTrigger.setAttribute("aria-expanded", open ? "true" : "false")
    }

    function toggleOpen(): void {
      const isOpen = root.getAttribute("data-open") === "1"
      setOpen(!isOpen)
    }

    function decodePathPart(part: string): string {
      try {
        return decodeURIComponent(part)
      } catch (_) {
        return part
      }
    }

    function normalizeRegistrySlug(slug: string): string {
      return slug
        .toString()
        .trim()
        .replace(/^\/+/g, "")
        .replace(/\/+/g, "/")
        .replace(/\/+$/g, "")
    }

    async function fetchTranslationRegistry(): Promise<Record<string, Record<string, string>>> {
      try {
        const response = await fetch("/static/translations.json")

        if (!response.ok) return {}

        const data = await response.json()

        if (!data || typeof data !== "object" || Array.isArray(data)) {
          return {}
        }

        return data
      } catch (_) {
        return {}
      }
    }

    function findRegistryTarget(
      registry: Record<string, Record<string, string>>,
      currentLang: string,
      targetLang: string,
      currentRest: string,
    ): string | null {
      const normalizedCurrentRest = normalizeRegistrySlug(currentRest)

      for (const entry of Object.values(registry)) {
        if (!entry || typeof entry !== "object") continue

        const currentSlug = entry[currentLang]
        const targetSlug = entry[targetLang]

        if (!currentSlug || !targetSlug) continue

        if (normalizeRegistrySlug(currentSlug) === normalizedCurrentRest) {
          return normalizeRegistrySlug(targetSlug)
        }
      }

      return null
    }

    async function navigateToLang(lang: string): Promise<void> {
      closeDrawersBeforeLanguageNavigation()

      const url = new URL(window.location.href)
      const supported = new Set(["en", "zh", "fr", "ja"])

      const rawParts = url.pathname.split("/").filter(Boolean)
      const decodedParts = rawParts.map(decodePathPart)

      const first = decodedParts[0]
      const currentLang = supported.has(first) ? first : "en"
      const currentRest = supported.has(first)
        ? decodedParts.slice(1).join("/")
        : decodedParts.join("/")

      const registry = await fetchTranslationRegistry()
      const registryTarget = findRegistryTarget(
        registry,
        currentLang,
        lang,
        currentRest,
      )

      const hadTrailingSlash = url.pathname.endsWith("/")

      if (registryTarget) {
        url.pathname = "/" + lang + "/" + registryTarget + (hadTrailingSlash ? "/" : "")
        window.location.assign(url.toString())
        return
      }

      // Fallback for pages not listed in translations.yaml.
      const fallbackParts = [...decodedParts]

      if (supported.has(fallbackParts[0])) {
        fallbackParts[0] = lang
      } else {
        fallbackParts.unshift(lang)
      }

      url.pathname = "/" + fallbackParts.join("/") + (hadTrailingSlash ? "/" : "")
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
        void navigateToLang(lang)
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