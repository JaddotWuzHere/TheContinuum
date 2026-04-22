import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

// @ts-ignore – inline loader returns a string of JS
import script from "./scripts/langSwitcher.inline"

const LangSwitcherImpl: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div class="lang-switcher" data-open="0" aria-label="Language switcher">
      <div class="wrap">
        <svg
          class="globe"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"></path>
        </svg>

        <label
          for="lang-select"
          class="sr-only"
          style="position:absolute;left:-9999px;"
        >
          Language
        </label>

        {/* visible trigger */}
        <button
          class="lang-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          English
        </button>

        <select
          id="lang-select"
          aria-label="Language"
          class="lang-select-native"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="fr">Français</option>
          <option value="ja">日本語</option>
        </select>

        <svg
          class="chev"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>

        {/* Custom brass dropdown */}
        <div class="lang-menu" role="listbox" aria-labelledby="lang-select">
          <button
            class="lang-menu-item"
            type="button"
            role="option"
            data-lang="en"
            data-active="1"
          >
            <span>English</span>
            <span class="lang-code">EN</span>
          </button>

          <button
            class="lang-menu-item"
            type="button"
            role="option"
            data-lang="zh"
            data-active="0"
          >
            <span>中文</span>
            <span class="lang-code">ZH</span>
          </button>

          <button
            class="lang-menu-item"
            type="button"
            role="option"
            data-lang="fr"
            data-active="0"
          >
            <span>Français</span>
            <span class="lang-code">FR</span>
          </button>

          <button
            class="lang-menu-item"
            type="button"
            role="option"
            data-lang="ja"
            data-active="0"
          >
            <span>日本語</span>
            <span class="lang-code">JA</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default (() => {
  const LanguageSwitcher: QuartzComponent = LangSwitcherImpl
  LanguageSwitcher.afterDOMLoaded = script
  return LanguageSwitcher
}) satisfies QuartzComponentConstructor
