import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <div class="page-title-visual">
        <a href={baseDir} class="page-title-link" aria-label="The Continuum home">
          <span class="page-title-logo-frame">
            <img src={`${baseDir}/static/text.png`} alt="The Continuum" class="page-title-logo" />
          </span>
        </a>
      </div>
    </h2>
  )
}

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
  transform: translateX(-6rem);
  transform-origin: left center;
}

.page-title-logo {
  display: block;
  width: 350px;
  max-width: none;
  height: auto;
  margin: 0;
  border-radius: 0;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor