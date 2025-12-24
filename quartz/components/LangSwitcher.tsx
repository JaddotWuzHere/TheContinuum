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

:root[data-theme="dark"] .lang-switcher select {
  background: #0b1220; color: #e5e7eb;
  border-color: #334155;
}
:root[data-theme="dark"] .lang-switcher select:focus {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, .35);
  border-color: rgba(96, 165, 250, .7);
}
`

// handles en / zh / fr
const script = `
;(() => {
  const sel = document.getElementById("lang-select");
  if (!sel) return;

  const SUPPORTED = ["en", "zh", "fr"];

  function getParts() {
    return window.location.pathname.split("/");
  }

  function findLang(parts) {
    for (let i = 1; i < parts.length; i++) {
      if (SUPPORTED.includes(parts[i])) {
        return { index: i, lang: parts[i] };
      }
    }
    return { index: -1, lang: "en" };
  }

  const initialParts = getParts();
  const { index: initialIdx, lang: currentLang } = findLang(initialParts);
  sel.value = currentLang;

  sel.addEventListener("change", () => {
    const newLang = sel.value;   // "en" | "zh" | "fr"
    const parts = getParts();
    let { index: langIdx } = findLang(parts);

    if (langIdx === -1) {
      if (parts.length > 2 && parts[1] !== "") {
        parts.splice(2, 0, newLang);
      } else {
        parts.splice(1, 0, newLang);
      }
    } else {
      parts[langIdx] = newLang;
    }

    const target = parts.join("/") || "/";

    window.location.href = target;
  });
})();
`;


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
