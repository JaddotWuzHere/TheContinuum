import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const css = `
.lang-switcher {
  display: inline-flex; align-items: center; gap: .5rem;
}
.lang-switcher .wrap {
  position: relative; display: inline-flex; align-items: center;
}
.lang-switcher .globe {
  width: 18px; height: 18px; margin-right: .4rem; opacity: .9;
}
.lang-switcher select {
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  font: inherit;
  padding: .35rem 2rem .35rem .6rem;
  border: 1px solid var(--gray-300, #d0d7de);
  background: var(--bg, #fff);
  color: var(--fg, #0f172a);
  border-radius: .5rem;
  line-height: 1.2;
  cursor: pointer;
}
.lang-switcher select:focus {
  outline: 2px solid transparent;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .35);
  border-color: rgba(37, 99, 235, .65);
}
.lang-switcher .chev {
  pointer-events: none;
  position: absolute; right: .55rem; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; opacity: .65;
}

/* Dark mode tweaks (Quartz sets body[data-theme="dark"]) */
:root[data-theme="dark"] .lang-switcher select {
  background: #0b1220; color: #e5e7eb;
  border-color: #334155;
}
:root[data-theme="dark"] .lang-switcher select:focus {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, .35);
  border-color: rgba(96, 165, 250, .7);
}
`

// Plain JS: handles en / zh / fr
const script = `
;(() => {
  const sel = document.getElementById("lang-select");
  if (!sel) return;

  const path = window.location.pathname;
  const m = path.match(/^\\/(en|zh|fr)\\/(.*)$/);
  const current = (m && m[1]) || "en";
  const rest = (m && m[2]) || "";

  sel.value = current;

  sel.addEventListener("change", () => {
    const lang = sel.value; // "en" | "zh" | "fr"
    const target = "/" + lang + "/" + rest;
    window.location.href = target;
  });
})();
`

export default (() => {
  const LanguageSwitcher: QuartzComponent = (_props: QuartzComponentProps) => {
    return (
      <div class="lang-switcher" aria-label="Language switcher">
        <div class="wrap">
          {/* globe icon */}
          <svg class="globe" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"></path>
          </svg>

          <label for="lang-select" class="sr-only" style="position:absolute;left:-9999px;">Language</label>
          <select id="lang-select" aria-label="Language">
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
          </select>

          {/* chevron */}
          <svg class="chev" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    )
  }

  LanguageSwitcher.css = css
  LanguageSwitcher.afterDOMLoaded = script
  return LanguageSwitcher
}) satisfies QuartzComponentConstructor
