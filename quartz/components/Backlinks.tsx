import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, simplifySlug } from "../util/path"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

interface BacklinksOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: BacklinksOptions = {
  hideWhenEmpty: true,
}

export default ((opts?: Partial<BacklinksOptions>) => {
  const options: BacklinksOptions = { ...defaultOptions, ...opts }

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug))

    if (options.hideWhenEmpty && backlinkFiles.length === 0) {
      return null
    }

    return (
      <div class={classNames(displayClass, "backlinks")}>
        <div class="backlinks-visual">
          <h3>{i18n(cfg.locale).components.backlinks.title}</h3>

          <ul>
            {backlinkFiles.length > 0 ? (
              backlinkFiles.map((f) => (
                <li key={f.slug}>
                  <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
                    {f.frontmatter?.title}
                  </a>
                </li>
              ))
            ) : (
              <li>{i18n(cfg.locale).components.backlinks.noBacklinksFound}</li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  return Backlinks
}) satisfies QuartzComponentConstructor