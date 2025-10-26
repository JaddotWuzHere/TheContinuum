import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Minimal styles (optional)
const css = `
.lang-switcher { display: inline-flex; align-items: center; gap: .4rem; }
.lang-switcher select { padding: .2rem .4rem; border-radius: .25rem; }
`

// Inline browser script: sets current value and navigates on change
const script = `
;(() => {
  const sel = document.getElementById("lang-select");
  if (!sel) return;

  const path = window.location.pathname;
  const m = path.match(/^\\/(en|zh)\\/(.*)$/);
  const current = (m && m[1]) || "en";
  const rest = (m && m[2]) || "";

  sel.value = current;

  sel.addEventListener("change", () => {
    const lang = sel.value === "zh" ? "zh" : "en";
    const target = "/" + lang + "/" + rest;
    window.location.href = target;
  });
})();
`

export default (() => {
  const LanguageSwitcher: QuartzComponent = (_props: QuartzComponentProps) => {
    return (
      <div class="lang-switcher">
        <label for="lang-select" style="display:none">Language</label>
        <select id="lang-select" aria-label="Language">
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
    )
  }

  LanguageSwitcher.css = css
  LanguageSwitcher.afterDOMLoaded = script
  return LanguageSwitcher
}) satisfies QuartzComponentConstructor
