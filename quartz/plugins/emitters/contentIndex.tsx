import { GlobalConfiguration } from "../../cfg"
import { FilePath, FullSlug, SimpleSlug, joinSegments, simplifySlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

export type ContentIndexMap = Map<FullSlug, ContentDetails>

export type ContentDetails = {
  slug: FullSlug
  filePath: FilePath
  title: string
  links: SimpleSlug[]
  content: string
  richContent?: string
}

interface Options {
  enableSiteMap: boolean
  includeEmptyFiles: boolean
}

const defaultOptions: Options = {
  enableSiteMap: true,
  includeEmptyFiles: true,
}

function generateSiteMap(cfg: GlobalConfiguration, idx: ContentIndexMap): string {
  const base = cfg.baseUrl ?? ""

  const urls = Array.from(idx)
    .map(([slug]) => {
      const simplifiedSlug = simplifySlug(slug)
      return `<url>
    <loc>https://${joinSegments(base, encodeURI(simplifiedSlug))}</loc>
  </url>`
    })
    .join("")

  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts }

  return {
    name: "ContentIndex",

    async *emit(ctx, content) {
      const cfg = ctx.cfg.configuration
      const linkIndex: ContentIndexMap = new Map()

      for (const [_tree, file] of content) {
        const slug = file.data.slug!

        if (opts.includeEmptyFiles || (file.data.text && file.data.text !== "")) {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath!,
            title: file.data.frontmatter?.title!,
            links: file.data.links ?? [],
            content: file.data.text ?? "",
          })
        }
      }

      if (opts.enableSiteMap) {
        yield write({
          ctx,
          content: generateSiteMap(cfg, linkIndex),
          slug: "sitemap" as FullSlug,
          ext: ".xml",
        })
      }

      const fp = joinSegments("static", "contentIndex") as FullSlug

      yield write({
        ctx,
        content: JSON.stringify(Object.fromEntries(linkIndex)),
        slug: fp,
        ext: ".json",
      })
    },
  }
}