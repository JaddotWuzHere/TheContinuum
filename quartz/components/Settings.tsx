import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

import style from "./styles/settings.scss"
// @ts-ignore
import script from "./scripts/settings.inline"

import LanguageSwitcherCtor from "./LangSwitcher"
import { i18n } from "../i18n"

const SettingsImpl: QuartzComponent = (props: QuartzComponentProps) => {
  const { cfg } = props
  const t = i18n(cfg.locale)
  const LangSwitcher = LanguageSwitcherCtor()

  const title =
    t.components.fxSettings.settingsTitle ?? "Settings"

  const perfTitle = "Performance"

  const langTitle =
    t.components.fxSettings.languageSection ?? "Language"

  const labelParticles = "Fancy particles"
  const labelShadows = "Soft shadows"
  const labelAnimations = "Fancy animations"

  return (
    <aside class="settings-panel" aria-label={title}>
      <div class="settings-inner">
        {/* HEADER */}
        <header class="settings-header">
          <h2 class="settings-title">{title}</h2>
        </header>

        {/* PERFORMANCE SECTION */}
        <section class="settings-section settings-section-performance">
          <h3 class="settings-section-title">{perfTitle}</h3>

          <button
            type="button"
            class="fx-toggle"
            data-setting="particles"
            data-state="off"
          >
            <span class="fx-toggle-label">{labelParticles}</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle"
            data-setting="shadows"
            data-state="off"
          >
            <span class="fx-toggle-label">{labelShadows}</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle"
            data-setting="animations"
            data-state="off"
          >
            <span class="fx-toggle-label">{labelAnimations}</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>
        </section>

        {/* LANGUAGE SECTION */}
        <section class="settings-section settings-section-language">
          <h3 class="settings-section-title">{langTitle}</h3>

          <div class="settings-language-row">
            {/* IMPORTANT: pass QuartzComponentProps through */}
            <LangSwitcher {...props} />
          </div>
        </section>
      </div>
    </aside>
  )
}

export default (() => {
  const Settings: QuartzComponent = SettingsImpl
  Settings.css = style
  Settings.afterDOMLoaded = script
  return Settings
}) satisfies QuartzComponentConstructor
