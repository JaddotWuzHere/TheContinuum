import { forceUnlockPageScroll, installNoScrollZoneGuards, lockPageScroll, unlockPageScroll } from "./util"
import { i18n } from "../../i18n"
import { localeFromSlug, toI18nLocale } from "../../util/locale"

function isDesktopTinyViewport() {
  const root = document.documentElement
  return root.classList.contains("device-desktop") && root.classList.contains("viewport-tiny")
}

function setupSettingsDrawer() {
  installNoScrollZoneGuards()

  const root = document.documentElement
  const KEY = "continuum-settings-drawer"

  let handle = document.querySelector<HTMLButtonElement>(".continuum-settings-handle")
  let scrim = document.querySelector<HTMLDivElement>(".continuum-settings-scrim")

  if (!handle) {
    handle = document.createElement("button")
    handle.type = "button"
    handle.className = "continuum-settings-handle"
    document.body.appendChild(handle)
  }

  if (!scrim) {
    scrim = document.createElement("div")
    scrim.className = "continuum-settings-scrim"
    scrim.setAttribute("aria-hidden", "true")
    document.body.appendChild(scrim)
  }

  const renderHandle = () => {
    const t = getSettingsI18n()
    const common = getCommonI18n()
    const isOpen = root.hasAttribute("data-settings-open")
    const isMobile = root.classList.contains("device-mobile")
    const showCloseLabel = isOpen && isMobile

    const label = showCloseLabel ? common.close : t.handleLabel
    const aria = isOpen ? common.close : t.handleLabel

    handle.setAttribute("aria-label", aria)
    handle.innerHTML = `<span class="label">${label}</span>`
  }

  const closeExplorerIfOpen = () => {
    if (!root.hasAttribute("data-explorer-open")) return

    root.removeAttribute("data-explorer-open")
    try {
      localStorage.setItem("continuum-explorer-drawer", "closed")
    } catch {}
  }

  const close = (immediate = false) => {
    root.removeAttribute("data-settings-open")

    try {
      localStorage.setItem(KEY, "closed")
    } catch {}

    renderHandle()

    if (immediate) {
      unlockPageScroll()
      return
    }

    window.setTimeout(() => {
      unlockPageScroll()
    }, 680)
  }

  const open = () => {
    if (isDesktopTinyViewport()) {
      close(true)
      return
    }

    closeExplorerIfOpen()
    root.setAttribute("data-settings-open", "1")
    lockPageScroll()
    try {
      localStorage.setItem(KEY, "open")
    } catch {}
    renderHandle()
  }

  const toggle = () => {
    if (root.hasAttribute("data-settings-open")) close()
    else open()
  }

  renderHandle()

  if (!(handle as any)._settingsBound) {
    ;(handle as any)._settingsBound = true
    handle.addEventListener("click", toggle)
  }

  if (!(scrim as any)._settingsBound) {
    ;(scrim as any)._settingsBound = true
    scrim.addEventListener("click", close)
  }

  if (!(document as any)._settingsEscBound) {
    ;(document as any)._settingsEscBound = true
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close()
    })
  }

  if (!(document as any)._settingsPrenavBound) {
    ;(document as any)._settingsPrenavBound = true
    document.addEventListener("prenav", () => close())
  }

  if (!(window as any)._settingsForceCloseBound) {
    ;(window as any)._settingsForceCloseBound = true
    window.addEventListener("continuum-force-close-drawers", () => {
      root.removeAttribute("data-settings-open")

      try {
        localStorage.setItem(KEY, "closed")
      } catch {}

      renderHandle()
      forceUnlockPageScroll()
    })
  }

  if (!(window as any)._settingsTinyResizeBound) {
    ;(window as any)._settingsTinyResizeBound = true
    window.addEventListener(
      "resize",
      () => {
        if (!isDesktopTinyViewport()) return
        if (!root.hasAttribute("data-settings-open")) return
        close(true)
      },
      { passive: true },
    )
  }

  try {
    if (localStorage.getItem(KEY) === "open") {
      open()
    } else {
      close()
    }
  } catch {
    close()
  }

  const panels = Array.from(document.querySelectorAll<HTMLElement>(".settings-panel"))
  const newestPanel = panels[panels.length - 1]

  panels.forEach((panel) => {
    if (panel !== newestPanel) {
      panel.remove()
    }
  })

  if (newestPanel && newestPanel.parentElement !== document.body) {
    document.body.appendChild(newestPanel)
  }

  setupSettingsToggles()
}

function getSettingsI18n() {
  const lang = localeFromSlug(window.location.pathname)
  return i18n(toI18nLocale(lang)).components.settings
}

function getCommonI18n() {
  const lang = localeFromSlug(window.location.pathname)
  return i18n(toI18nLocale(lang)).common
}

function setupSettingsToggles() {
  const root = document.documentElement
  const toggles = document.querySelectorAll<HTMLButtonElement>(".fx-toggle")

  const STORAGE_KEY = "continuum-fx-settings"

  const isOn = (btn: HTMLElement) => btn.getAttribute("data-state") === "on"
  const setOn = (btn: HTMLElement, on: boolean) =>
    btn.setAttribute("data-state", on ? "on" : "off")

  const settingToRootAttr: Record<string, string> = {
    reduceMotion: "data-reduce-motion",
    disableFlickering: "data-no-flicker",
    disableRays: "data-no-rays",
    disableBackgroundParallax: "data-no-bg-parallax",
  }

  const getSavedSettings = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const saved = JSON.parse(raw) as Record<string, boolean>

      if ("disableAnimations" in saved && !("reduceMotion" in saved)) {
        saved.reduceMotion = !!saved.disableAnimations
      }

      return saved
    } catch {
      return null
    }
  }

  const saveSettings = () => {
    const state: Record<string, boolean> = {}
    toggles.forEach((btn) => {
      const key = btn.getAttribute("data-setting")
      if (!key) return
      state[key] = isOn(btn)
    })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }

  const applyRootFlags = () => {
    Object.values(settingToRootAttr).forEach((attr) => root.removeAttribute(attr))

    if (root.classList.contains("device-mobile")) {
      root.setAttribute("data-no-rays", "1")
      root.setAttribute("data-no-flicker", "1")
      root.setAttribute("data-no-bg-parallax", "1")
    }

    toggles.forEach((btn) => {
      const key = btn.getAttribute("data-setting")
      if (!key) return

      const attr = settingToRootAttr[key]
      if (!attr) return

      if (isOn(btn)) root.setAttribute(attr, "1")
    })
  }

  const saved = getSavedSettings()
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false

  toggles.forEach((btn) => {
    const key = btn.getAttribute("data-setting")
    if (!key) return

    if (saved && key in saved) {
      setOn(btn, !!saved[key])
      return
    }

    if (!saved && key === "reduceMotion" && prefersReducedMotion) {
      setOn(btn, true)
    }
  })

  applyRootFlags()

  toggles.forEach((btn) => {
    if ((btn as any)._settingsInit === true) return
    ;(btn as any)._settingsInit = true

    btn.addEventListener("click", (evt) => {
      evt.stopPropagation()

      const next = !isOn(btn)
      setOn(btn, next)

      applyRootFlags()
      saveSettings()
    })
  })
}

document.addEventListener("nav", () => {
  setupSettingsDrawer()
})

setupSettingsDrawer()