import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "../styles/components/footer.scss"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const t = i18n(cfg.locale).components.footer
    const copyright = t.copyright.replace("{year}", String(year))

    return (
      <footer class={`${displayClass ?? ""} continuum-footer`}>
        <div class="continuum-footer-inner">
          <div class="continuum-footer-title">{t.recordTitle}</div>
          <div class="continuum-footer-meta">{copyright}</div>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor