import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import Explorer from "./Explorer"
import { getLangFromSlug, hasLangPrefix, dropLangPrefix } from "../util/i18n"
import type { FullSlug } from "../util/path"

function ExplorerLangImpl(props: QuartzComponentProps) {
  const lang = getLangFromSlug(props.fileData.slug)

  const filtered = props.allFiles.filter(
    (f) => typeof f.slug === "string" && hasLangPrefix(f.slug!, lang)
  )

  // ensure slug stays typed as FullSlug | undefined
  const stripped = filtered.map((f) => {
    const newSlug = f.slug ? (dropLangPrefix(f.slug as string) as FullSlug) : f.slug
    return { ...f, slug: newSlug }
  }) as typeof props.allFiles

  // fallback so you still see a tree if filtering returns nothing
  const files = (stripped.length > 0 ? stripped : props.allFiles) as typeof props.allFiles

  const BaseExplorer = Explorer()
  const newProps: QuartzComponentProps = { ...props, allFiles: files }
  return <BaseExplorer {...newProps} />
}

export default (() => ExplorerLangImpl) satisfies QuartzComponentConstructor
