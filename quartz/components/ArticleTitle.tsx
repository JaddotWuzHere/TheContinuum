import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// @ts-ignore
import titleFitScript from "./scripts/titleFit.inline"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2.5rem 0 1.8rem 0;
}

html.device-mobile .article-title {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: normal;
  word-break: normal;
}

html.device-mobile .article-title[data-title-fit="true"] {
  text-wrap: balance;
}
`

ArticleTitle.afterDOMLoaded = titleFitScript

export default (() => ArticleTitle) satisfies QuartzComponentConstructor