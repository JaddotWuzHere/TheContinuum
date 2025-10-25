import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export const LangSwitch: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div class="lang-switch" style="display:flex;gap:.5rem;align-items:center">
      <a id="to-en" href="/en/" aria-label="Switch to English">EN</a>
      <span aria-hidden="true">|</span>
      <a id="to-zh" href="/zh/" aria-label="切换到中文">中文</a>

      <script>
        {`
          (function () {
            try {
              var p = window.location && window.location.pathname || "/";
              if (!p.startsWith("/")) p = "/" + p;

              var isEN = p.startsWith("/en/");
              var isZH = p.startsWith("/zh/");
              var tail = isEN ? p.slice(4) : isZH ? p.slice(4) : "";

              var toEn = document.getElementById("to-en");
              var toZh = document.getElementById("to-zh");

              if (toEn) {
                toEn.href = isZH ? ("/en/" + tail) : "/en/";
                if (isEN) { toEn.setAttribute("aria-current","true"); toEn.style.opacity = "0.6"; }
              }
              if (toZh) {
                toZh.href = isEN ? ("/zh/" + tail) : "/zh/";
                if (isZH) { toZh.setAttribute("aria-current","true"); toZh.style.opacity = "0.6"; }
              }
            } catch (_) {}
          })();
        `}
      </script>
    </div>
  )
}

export default (() => LangSwitch) satisfies QuartzComponentConstructor

