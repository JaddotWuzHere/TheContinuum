import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { i18n } from "../../i18n"

// @ts-ignore
import notFoundScript from "../scripts/404.inline"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const fallbackHome = "/en/"
  const t = i18n(cfg.locale).pages.error

  return (
    <article class="continuum-404 popover-hint">
      <div class="continuum-404-inner">
        <div id="continuum-404-code" class="continuum-404-code">
          {t.code}
        </div>

        <div class="continuum-404-divider" />

        <h2 id="continuum-404-title" class="continuum-404-title">
          {t.title}
        </h2>

        <p id="continuum-404-message" class="continuum-404-text">
          {t.message}
        </p>

        <div class="continuum-404-actions">
          <a
            id="localized-back-link"
            class="continuum-404-button"
            href={fallbackHome}
            data-router-ignore
          >
            {t.goBack}
          </a>

          <a id="localized-english-link" class="continuum-404-button" hidden>
            {i18n(cfg.locale).pages.untranslated.viewEnglish}
          </a>

          <a id="localized-home-link" class="continuum-404-button" href={fallbackHome}>
            {t.returnToGenesis}
          </a>
        </div>
      </div>
    </article>
  )
}

NotFound.afterDOMLoaded = notFoundScript

export default (() => NotFound) satisfies QuartzComponentConstructor