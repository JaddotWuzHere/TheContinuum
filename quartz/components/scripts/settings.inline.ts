let settingsInitialized = false

function setupSettingsDrawer() {
  if (settingsInitialized) return
  settingsInitialized = true

  const root = document.documentElement
  const KEY = "continuum-settings-drawer"

  if (!document.querySelector(".continuum-settings-handle")) {
    const handle = document.createElement("button")
    handle.type = "button"
    handle.className = "continuum-settings-handle"
    handle.setAttribute("aria-label", "Toggle settings")
    handle.innerHTML = `<span class="label">Settings</span>`
    document.body.appendChild(handle)

    const scrim = document.createElement("div")
    scrim.className = "continuum-settings-scrim"
    scrim.setAttribute("aria-hidden", "true")
    document.body.appendChild(scrim)

    const open = () => {
      root.setAttribute("data-settings-open", "1")
      localStorage.setItem(KEY, "open")
    }

    const close = () => {
      root.removeAttribute("data-settings-open")
      localStorage.setItem(KEY, "closed")
    }

    const toggle = () => {
      if (root.hasAttribute("data-settings-open")) close()
      else open()
    }

    handle.addEventListener("click", () => {
      const root = document.documentElement

      if (root.hasAttribute("data-explorer-open")) {
        root.removeAttribute("data-explorer-open")
        try {
          localStorage.setItem("continuum-explorer-drawer", "closed")
        } catch {
        }
        return
      }

      toggle()
    })
    scrim.addEventListener("click", close)

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close()
      }
    })

    if (localStorage.getItem(KEY) === "open") {
      open()
    }

    document.addEventListener("prenav", () => close())
  }

  const panel = document.querySelector(".settings-panel")
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
  } catch {
  }

  syncLocksFromParent("disableRays")

  applyRootFlags()
  saveSettings()

  toggles.forEach((btn) => {
    if ((btn as any)._settingsInit === true) return
    ;(btn as any)._settingsInit = true

    btn.addEventListener("click", (evt) => {
      evt.stopPropagation()

      if (btn.getAttribute("data-locked") === "1") return

      const current = isOn(btn)
      const next = !current
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
