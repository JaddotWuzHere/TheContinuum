import { installNoScrollZoneGuards, lockPageScroll, unlockPageScroll } from "./util"

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
    handle.setAttribute("aria-label", "Toggle settings")
    handle.innerHTML = `<span class="label">Settings</span>`
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

  const panel = document.querySelector<HTMLElement>(".settings-panel")
  if (panel && panel.parentElement !== document.body) {
    document.body.appendChild(panel)
  }

  setupSettingsToggles()
}

function setupSettingsToggles() {
  const root = document.documentElement
  const toggles = document.querySelectorAll<HTMLButtonElement>(".fx-toggle")

  const STORAGE_KEY = "continuum-fx-settings"

  const isOn = (btn: HTMLElement) => btn.getAttribute("data-state") === "on"
  const setOn = (btn: HTMLElement, on: boolean) =>
    btn.setAttribute("data-state", on ? "on" : "off")

  const setLocked = (btn: HTMLElement, locked: boolean) => {
    if (locked) btn.setAttribute("data-locked", "1")
    else btn.removeAttribute("data-locked")
  }

  const getChildren = (parentSetting: string) =>
    Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        `.fx-toggle[data-parent="${parentSetting}"]`,
      ),
    )

  const settingToRootAttr: Record<string, string> = {
    disableAnimations: "data-no-animations",
    disableRays: "data-no-rays",
    disableMovement: "data-no-ray-movement",
    disableFlickering: "data-no-flicker",
    disableParallax: "data-no-ray-parallax",
    disableBackgroundParallax: "data-no-bg-parallax",
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
    toggles.forEach((btn) => {
      const key = btn.getAttribute("data-setting")
      if (!key) return

      const attr = settingToRootAttr[key]
      if (!attr) return

      if (isOn(btn)) root.setAttribute(attr, "1")
      else root.removeAttribute(attr)
    })
  }

  const syncLocksFromParent = (parentSetting: string) => {
    const parent = document.querySelector<HTMLButtonElement>(
      `.fx-toggle[data-setting="${parentSetting}"]`,
    )
    if (!parent) return

    const children = getChildren(parentSetting)

    if (isOn(parent)) {
      children.forEach((c) => {
        setOn(c, true)
        setLocked(c, true)
      })
    } else {
      children.forEach((c) => setLocked(c, false))
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, boolean>
      toggles.forEach((btn) => {
        const key = btn.getAttribute("data-setting")
        if (!key) return
        if (key in saved) setOn(btn, !!saved[key])
      })
    }
  } catch {}

  syncLocksFromParent("disableRays")
  applyRootFlags()

  toggles.forEach((btn) => {
    if ((btn as any)._settingsInit === true) return
    ;(btn as any)._settingsInit = true

    btn.addEventListener("click", (evt) => {
      evt.stopPropagation()

      if (btn.getAttribute("data-locked") === "1") return

      const next = !isOn(btn)
      setOn(btn, next)

      if (btn.getAttribute("data-setting") === "disableRays") {
        syncLocksFromParent("disableRays")
      }

      applyRootFlags()
      saveSettings()
    })
  })
}

document.addEventListener("nav", () => {
  setupSettingsDrawer()
})