import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="page-title-link" aria-label="The Continuum home">
        <img src={`${baseDir}/static/text.png`} alt="The Continuum" class="page-title-logo" />
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  margin: 0;
  width: 100%;
  overflow: visible;
}

.page-title-link {
  display: block;
  width: 100%;
  text-decoration: none;
  overflow: visible;
}

.page-title-logo {
  display: block;
  width: 350px;
  max-width: none;
  height: auto;
  margin: 0;
  border-radius: 0;
  transform: translateX(-6rem);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor