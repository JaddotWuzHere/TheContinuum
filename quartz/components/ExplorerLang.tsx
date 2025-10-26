import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import Explorer from "./Explorer"
import { getLangFromSlug, hasLangPrefix, dropLangPrefix } from "../util/i18n"

function ExplorerLang(props: QuartzComponentProps) {
  const lang = getLangFromSlug(props.fileData.slug)

  // Only keep files that start with the current language prefix
  const filtered = props.allFiles.filter(f => f.slug && hasLangPrefix(f.slug, lang))

  // Drop the 'en/' or 'zh/' prefix so it looks clean in the sidebar
  const stripped = filtered.map(f => ({
    ...f,
    slug: f.slug ? dropLangPrefix(f.slug) : f.slug,
  }))

  // Render the original Explorer with the filtered list
  return <Explorer {...props} allFiles={stripped} />
}

export default (() => ExplorerLang) satisfies QuartzComponentConstructor

