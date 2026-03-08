import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const fallbackHome = "/en/"

  return (
    <article class="continuum-404 popover-hint">
      <div class="continuum-404-inner">
        <div class="continuum-404-code">REDACTED</div>

        <div class="continuum-404-divider" />

        <h2 class="continuum-404-title">Record Restricted</h2>

        <p class="continuum-404-text">
          The requested record is not available for viewing.
        </p>

        <a
          id="localized-home-link"
          class="continuum-404-button"
          href={fallbackHome}
          data-en-home="/en/"
          data-zh-home="/zh/"
          data-fr-home="/fr/"
        >
          Return to Genesis
        </a>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var link = document.getElementById("localized-home-link");
              if (link) {
                var first = window.location.pathname.replace(/^\\/+/, "").split("/")[0]?.toLowerCase();
                var lang = first === "zh" ? "zh" : first === "fr" ? "fr" : "en";

                var target =
                  lang === "zh"
                    ? link.getAttribute("data-zh-home")
                    : lang === "fr"
                      ? link.getAttribute("data-fr-home")
                      : link.getAttribute("data-en-home");

                if (target) {
                  link.setAttribute("href", target);
                }
              }

              var root = document.documentElement;
              root.removeAttribute("data-explorer-open");
              root.removeAttribute("data-settings-open");
              root.removeAttribute("data-search-open");

              try {
                localStorage.setItem("continuum-explorer-drawer", "closed");
                localStorage.setItem("continuum-settings-drawer", "closed");
              } catch (_) {}

              var selectors = [
                ".continuum-explorer-handle",
                ".continuum-settings-handle",
                ".continuum-explorer-scrim",
                ".continuum-settings-scrim",
                ".explorer",
                ".settings-panel"
              ];

              selectors.forEach(function (selector) {
                document.querySelectorAll(selector).forEach(function (el) {
                  el.remove();
                });
              });
            })();
          `,
        }}
      />
    </article>
  )
}

NotFound.css = `
.continuum-404 {
  display: flex;
  justify-content: center;
  padding: 4rem 1rem;
}

.continuum-404-inner {
  text-align: center;
  max-width: 480px;
}

.continuum-404-code {
  font-size: 3rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.85);
}

.continuum-404-divider {
  width: 80px;
  height: 1px;
  margin: 1.2rem auto 1.4rem;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(186,154,86,0.6),
    transparent
  );
}

.continuum-404-title {
  font-size: 1.4rem;
  margin: 0 0 0.6rem 0;
}

.continuum-404-text {
  color: rgba(255,255,255,0.65);
  margin-bottom: 1.6rem;
}

.continuum-404-button {
  display: inline-block;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(186,154,86,0.4);
  text-decoration: none;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.85);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.continuum-404-button:hover {
  border-color: rgba(186,154,86,0.7);
  background: rgba(186,154,86,0.08);
}

body[data-slug="404"] .continuum-explorer-handle,
body[data-slug="404"] .continuum-settings-handle,
body[data-slug="404"] .continuum-explorer-scrim,
body[data-slug="404"] .continuum-settings-scrim,
body[data-slug="404"] .explorer,
body[data-slug="404"] .settings-panel {
  display: none !important;
}
`

export default (() => NotFound) satisfies QuartzComponentConstructor