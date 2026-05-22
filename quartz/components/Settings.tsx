import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

// @ts-ignore
import script from "./scripts/settings.inline"

import LanguageSwitcherCtor from "./LangSwitcher"
import { i18n } from "../i18n"
import { localeFromSlug, toI18nLocale } from "../util/locale"
import { concatenateResources } from "../util/resources"

const LangSwitcher = LanguageSwitcherCtor()
const langCss = (LangSwitcher as any).css ?? ""
const langAfter = (LangSwitcher as any).afterDOMLoaded ?? ""

const SettingsImpl: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData } = props

  const lang =
    fileData.frontmatter?.lang ??
    localeFromSlug(fileData.slug ?? "/en/")

  const locale = toI18nLocale(lang as "en" | "zh" | "fr" | "ja")
  const t = i18n(locale).components.settings

  return (
    <aside class="settings-panel" aria-label={t.panelTitle}>
      <div class="settings-inner">
        <header class="settings-header">
          <h2 class="settings-title">{t.panelTitle}</h2>
        </header>

        <section class="settings-section settings-section-performance">
          <h3 class="settings-section-title">{t.performanceSection}</h3>

          <button
            type="button"
            class="fx-toggle fx-toggle-parent"
            data-setting="disableAnimations"
            data-state="off"
          >
            <span class="fx-toggle-label">{t.disableAnimations}</span>
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
            <span class="fx-toggle-label">{t.disableRays}</span>
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
            <span class="fx-toggle-label">{t.disableMovement}</span>
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
            <span class="fx-toggle-label">{t.disableFlickering}</span>
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
            <span class="fx-toggle-label">{t.disableParallax}</span>
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
            <span class="fx-toggle-label">{t.disableBackgroundParallax}</span>
            <span class="fx-toggle-switch" aria-hidden="true">
              <span class="fx-toggle-thumb" />
            </span>
          </button>
        </section>

        <section class="settings-section settings-section-language">
          <h3 class="settings-section-title">{t.languageSection}</h3>

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
  Settings.css = langCss
  Settings.afterDOMLoaded = concatenateResources(script, langAfter)
  return Settings
}) satisfies QuartzComponentConstructor