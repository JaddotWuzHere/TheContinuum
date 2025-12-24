// quartz/components/scripts/settings.inline.ts

let settingsInitialized = false

function setupSettingsDrawer() {
  if (settingsInitialized) return
  settingsInitialized = true

  const root = document.documentElement
  const KEY = "continuum-settings-drawer"

  // Create handle if missing
  if (!document.querySelector(".continuum-settings-handle")) {
    const handle = document.createElement("button")
    handle.type = "button"
    handle.className = "continuum-settings-handle"
    handle.setAttribute("aria-label", "Toggle settings")
    handle.innerHTML = `<span class="label">Settings</span>`
    document.body.appendChild(handle)

    // Create scrim
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

      // If EXPLORER is open, treat this click as "click outside":
      // close explorer, do NOT open settings yet.
      if (root.hasAttribute("data-explorer-open")) {
        root.removeAttribute("data-explorer-open")
        try {
          localStorage.setItem("continuum-explorer-drawer", "closed")
        } catch {
          // ignore storage errors
        }
        return
      }

      // Otherwise, normal toggle
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

    // Close on prenav
    document.addEventListener("prenav", () => close())
  }

  // Move panel to body so it sits level with explorer
  const panel = document.querySelector(".settings-panel")
  if (panel && panel.parentElement !== document.body) {
    document.body.appendChild(panel)
  }

  setupSettingsToggles()
}

function setupSettingsToggles() {
  const toggles = document.querySelectorAll<HTMLButtonElement>(".fx-toggle")

  toggles.forEach((btn) => {
    if ((btn as any)._settingsInit === true) return
    ;(btn as any)._settingsInit = true

    btn.addEventListener("click", (evt) => {
      // don't let the click bubble to anything weird
      evt.stopPropagation()

      const current = btn.getAttribute("data-state") === "on"
      const next = !current
      btn.setAttribute("data-state", next ? "on" : "off")
    })
  })
}

// When SPA nav fires, ensure drawer exists and toggles are wired.
document.addEventListener("nav", () => {
  setupSettingsDrawer()
})
