import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import Explorer from "./Explorer"
import { getLangFromSlug, hasLangPrefix, dropLangPrefix } from "../util/i18n"
import type { FullSlug } from "../util/path"

function ExplorerLangImpl(props: QuartzComponentProps) {
  const lang = getLangFromSlug(props.fileData.slug)

  // Keep only files with en/ or zh/ prefix matching current page
  const filtered = props.allFiles.filter(
    (f) => typeof f.slug === "string" && hasLangPrefix(f.slug!, lang)
  )

  // Strip the language prefix but keep the slug type
  const stripped = filtered.map((f) => {
    const newSlug = f.slug ? (dropLangPrefix(f.slug as string) as FullSlug) : f.slug
    return { ...f, slug: newSlug }
  }) as typeof props.allFiles

  // Fallback so you still see something if filter returns nothing
  const files = (stripped.length > 0 ? stripped : props.allFiles) as typeof props.allFiles

  // Instantiate base Explorer (it’s a factory), then render with overridden props
  const BaseExplorer = Explorer()
  const newProps: QuartzComponentProps = { ...props, allFiles: files }
  return <BaseExplorer {...newProps} />
}

export default (() => ExplorerLangImpl) satisfies QuartzComponentConstructor
