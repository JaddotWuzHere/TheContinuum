import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// @ts-ignore
import script from "./scripts/toc.inline"
import { i18n } from "../i18n"

interface Options {}

let numTocs = 0

export default ((opts?: Partial<Options>) => {
  const TableOfContents: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    if (!fileData.toc) {
      return null
    }

    const id = `toc-${numTocs++}`

    return (
      <div class={classNames(displayClass, "toc")}>
        <div class="toc-visual">
          <button
            type="button"
            class={fileData.collapseToc ? "collapsed toc-header" : "toc-header"}
            aria-controls={id}
            aria-expanded={!fileData.collapseToc}
          >
            <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="fold"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <ul
            id={id}
            class={fileData.collapseToc ? "collapsed toc-content" : "toc-content"}
          >
            {fileData.toc.map((tocEntry) => (
              <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
                <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                  {tocEntry.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  TableOfContents.afterDOMLoaded = script

  return TableOfContents
}) satisfies QuartzComponentConstructor