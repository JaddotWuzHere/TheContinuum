import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()

    return (
      <footer class={`${displayClass ?? ""} continuum-footer`}>
        <div class="continuum-footer-inner">
          <div class="continuum-footer-title">Continuum Archives Record</div>
          <div class="continuum-footer-meta">© {year} Jason Ding</div>
        </div>
      </footer>
    )
  }

  return Footer
}) satisfies QuartzComponentConstructor