import { installNoScrollZoneGuards, lockPageScroll, unlockPageScroll } from "./util"
import { i18n } from "../../i18n"
import { localeFromSlug, toI18nLocale } from "../../util/locale"

function setupSettingsDrawer() {
  installNoScrollZoneGuards()

  const root = document.documentElement
  const KEY = "continuum-settings-drawer"

  let handle = document.querySelector<HTMLButtonElement>(".continuum-settings-handle")
  let scrim = document.querySelector<HTMLDivElement>(".continuum-settings-scrim")

  const open = () => {
    root.setAttribute("data-settings-open", "1")
    lockPageScroll()
    try {
      localStorage.setItem(KEY, "open")
    } catch {}
  }

  const close = () => {
    root.removeAttribute("data-settings-open")
    unlockPageScroll()
    try {
      localStorage.setItem(KEY, "closed")
    } catch {}
  }

  const toggle = () => {
    if (root.hasAttribute("data-settings-open")) close()
    else open()
  }

  if (!handle) {
    handle = document.createElement("button")
    handle.type = "button"
    handle.className = "continuum-settings-handle"
    const t = getSettingsI18n()
    handle.setAttribute("aria-label", t.handleLabel)
    handle.innerHTML = `<span class="label">${t.handleLabel}</span>`
    document.body.appendChild(handle)
  }

  if (!scrim) {
    scrim = document.createElement("div")
    scrim.className = "continuum-settings-scrim"
    scrim.setAttribute("aria-hidden", "true")
    document.body.appendChild(scrim)
  }

  if (!(handle as any)._settingsBound) {
    ;(handle as any)._settingsBound = true

    handle.addEventListener("click", () => {
      if (root.hasAttribute("data-explorer-open")) {
        root.removeAttribute("data-explorer-open")
        unlockPageScroll()
        try {
          localStorage.setItem("continuum-explorer-drawer", "closed")
        } catch {}
        return
      }

      toggle()
    })
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