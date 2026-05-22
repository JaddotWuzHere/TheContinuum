import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

type ContinuumLang = "en" | "zh" | "fr" | "ja"

const LOGOS: Record<ContinuumLang, { src: string; alt: string }> = {
  en: {
    src: "text_english.png",
    alt: "The Continuum",
  },
  zh: {
    src: "text_chinese.png",
    alt: "恒宙",
  },
  fr: {
    src: "text_french.png",
    alt: "Le Continuum",
  },
  ja: {
    src: "text_japanese.png",
    alt: "永界",
  },
}

function getLangFromSlug(slug: string | undefined): ContinuumLang {
  const first = slug?.split("/")[0]?.toLowerCase()

  if (first === "zh") return "zh"
  if (first === "fr") return "fr"
  if (first === "ja") return "ja"
  return "en"
}

const pageTitleScript = `
function getContinuumLogoForLang(lang) {
  if (lang === "zh") {
    return {
      src: "/static/text_chinese.png",
      alt: "恒宙",
    }
  }

  if (lang === "fr") {
    return {
      src: "/static/text_french.png",
      alt: "Le Continuum",
    }
  }

  if (lang === "ja") {
    return {
      src: "/static/text_japanese.png",
      alt: "永界",
    }
  }

  return {
    src: "/static/text_english.png",
    alt: "The Continuum",
  }
}

function getContinuumLangFromPathname() {
  const first = window.location.pathname
    .replace(/^\\/+/, "")
    .split("/")[0]
    ?.toLowerCase()

  if (first === "zh") return "zh"
  if (first === "fr") return "fr"
  if (first === "ja") return "ja"
  return "en"
}

function setupContinuumPageTitleLogo() {
  const lang = getContinuumLangFromPathname()
  const logo = getContinuumLogoForLang(lang)

  document.querySelectorAll(".page-title-logo").forEach((img) => {
    img.setAttribute("src", logo.src)
    img.setAttribute("alt", logo.alt)
  })

  document.querySelectorAll(".page-title-link").forEach((link) => {
    link.setAttribute("aria-label", logo.alt + " home")

    if (document.body.dataset.slug === "404") {
      link.setAttribute("href", "/" + lang + "/")
    }
  })
}

document.addEventListener("nav", setupContinuumPageTitleLogo)
setupContinuumPageTitleLogo()
`

const PageTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const is404 = fileData.slug === "404"
  const baseDir = is404 ? "" : pathToRoot(fileData.slug!)

  const lang = getLangFromSlug(fileData.slug)
  const logo = LOGOS[lang]

  const homeHref = is404 ? `/${lang}/` : `${baseDir}/${lang}/`

  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <div class="page-title-visual">
        <a href={homeHref} class="page-title-link" aria-label={`${logo.alt} home`}>
          <span class="page-title-logo-frame">
            <img src={`${baseDir}/static/${logo.src}`} alt={logo.alt} class="page-title-logo" />
          </span>
        </a>
      </div>
    </h2>
  )
}

PageTitle.afterDOMLoaded = pageTitleScript

PageTitle.css = `
.page-title {
  margin: 0;
  width: 100%;
  overflow: visible;
}

.page-title-visual {
  width: 100%;
  overflow: visible;
  transform-origin: left top;
  transition:
    filter 0.6s cubic-bezier(0.12, 0.85, 0.25, 1),
    transform 0.75s cubic-bezier(0.12, 0.85, 0.25, 1),
    opacity 0.45s cubic-bezier(0.12, 0.85, 0.25, 1);
  will-change: transform, filter;
}

.page-title-link {
  display: block;
  width: 100%;
  text-decoration: none;
  overflow: visible;
}

.page-title-logo-frame {
  display: block;
  width: max-content;
  overflow: visible;
  transform: translateX(-1.8rem);
  transform-origin: left center;
}

.page-title-logo {
  display: block;
  width: 350px;
  max-width: none;
  height: auto;
  margin: 0;
  border-radius: 0;

  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.35s ease,
    opacity 0.35s ease;
}

.page-title-link:hover .page-title-logo {
  transform: translateY(-1px) scale(1.025);

  filter:
    brightness(1.08)
    drop-shadow(0 0 10px rgba(240, 210, 140, 0.15))
    drop-shadow(0 0 20px rgba(240, 210, 140, 0.08));
}

body[data-slug="404"] .page-title {
  display: flex;
  justify-content: center;
}

body[data-slug="404"] .page-title-logo-frame {
  transform: none;
}

body[data-slug="404"] .page-footer {
  display: flex;
  justify-content: center;
}

body[data-slug="404"] .page-footer .page-title {
  width: auto;
  text-align: center;
}

body[data-slug="404"] .page-footer .page-title-visual {
  display: flex;
  justify-content: center;
  width: auto;
}

body[data-slug="404"] .page-footer .page-title-link {
  display: inline-flex;
  justify-content: center;
  width: auto;
}

body[data-slug="404"] .page-footer .page-title-logo-frame {
  transform: none;
  width: auto;
}

body[data-slug="404"] .page-footer .page-title-logo {
  margin: 0 auto;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor