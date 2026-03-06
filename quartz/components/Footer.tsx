import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? {} // <-- fixed default
    return (
      <footer class={`${displayClass ?? ""} continuum-footer`}>
        <div class="continuum-footer-inner">
          <div class="continuum-footer-title">Continuum Archive Record</div>
          <div class="continuum-footer-meta">© {year} Jason Ding</div>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor