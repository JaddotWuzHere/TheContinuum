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
import { concatenateResources } from "../util/resources"

const LangSwitcher = LanguageSwitcherCtor()
const langCss = (LangSwitcher as any).css ?? ""
const langAfter = (LangSwitcher as any).afterDOMLoaded ?? ""

const SettingsImpl: QuartzComponent = (props: QuartzComponentProps) => {
  const { cfg } = props
  const t = i18n(cfg.locale)

  const title = t.components.fxSettings.settingsTitle ?? "Settings"
  const perfTitle = "Performance"
  const langTitle = t.components.fxSettings.languageSection ?? "Language"

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
            class="fx-toggle fx-toggle-parent"
            data-setting="disableAnimations"
            data-state="off"
          >
            <span class="fx-toggle-label">Disable Animations</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle fx-toggle-parent"
            data-setting="disableRays"
            data-state="off"
          >
            <span class="fx-toggle-label">Disable Rays</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle fx-toggle-child"
            data-parent="disableRays"
            data-setting="disableMovement"
            data-state="false"
          >
            <span class="fx-toggle-label">Disable Movement</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle fx-toggle-child"
            data-parent="disableRays"
            data-setting="disableFlickering"
            data-state="false"
          >
            <span class="fx-toggle-label">Disable Flickering</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle fx-toggle-child"
            data-parent="disableRays"
            data-setting="disableParallax"
            data-state="false"
          >
            <span class="fx-toggle-label">Disable Parallax</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            class="fx-toggle fx-toggle-parent"
            data-setting="disableBackgroundParallax"
            data-state="off"
          >
            <span class="fx-toggle-label">Disable Background Parallax</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>
        </section>

        {/* LANGUAGE SECTION */}
        <section class="settings-section settings-section-language">
          <h3 class="settings-section-title">{langTitle}</h3>

          <div class="settings-language-row">
            <LangSwitcher {...props} />
          </div>
        </section>
      </div>
    </aside>
  )
}

export default (() => {
  const Settings: QuartzComponent = SettingsImpl

  Settings.css = `${style}\n${langCss}`

  Settings.afterDOMLoaded = concatenateResources(script, langAfter)

  return Settings
}) satisfies QuartzComponentConstructor
