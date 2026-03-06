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
  const toggles = document.querySelectorAll<HTMLButtonElement>(".fx-toggle")

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

  syncLocksFromParent("disableRays")

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
    })
  })
}

document.addEventListener("nav", () => {
  setupSettingsDrawer()
})
