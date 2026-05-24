import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  links: Record<string, string>
}

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

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()

    const is404 = fileData.slug === "404"
    const baseDir = is404 ? "" : pathToRoot(fileData.slug!)
    const lang = getLangFromSlug(fileData.slug)
    const logo = LOGOS[lang]
    const homeHref = is404 ? `/${lang}/` : `${baseDir}/${lang}/`

    return (
      <footer class={`${displayClass ?? ""} continuum-footer`}>
        <div class="continuum-footer-inner">
          <a
            href={homeHref}
            class="continuum-footer-logo-link mobile-only"
            aria-label={`${logo.alt} home`}
          >
            <span class="continuum-footer-logo-frame">
              <img
                src={`${baseDir}/static/${logo.src}`}
                alt={logo.alt}
                class="continuum-footer-logo"
              />
            </span>
          </a>

          <div class="continuum-footer-title">Continuum Archives Record</div>
          <div class="continuum-footer-meta">© {year} Jason Ding</div>
        </div>
      </footer>
    )
  }

  return Footer
}) satisfies QuartzComponentConstructor