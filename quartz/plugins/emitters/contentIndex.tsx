import { GlobalConfiguration } from "../../cfg"
import { FilePath, FullSlug, SimpleSlug, joinSegments, simplifySlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { Root, Element } from "hast"
import { toString } from "hast-util-to-string"
import { visit } from "unist-util-visit"
import fs from "fs"
import path from "path"
import yaml from "js-yaml"

export type ContentIndexMap = Map<FullSlug, ContentDetails>

export type ContentDetails = {
  slug: FullSlug
  filePath: FilePath
  title: string
  aliases: string[]
  headings: string[]
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

function extractHeadings(tree: Root): string[] {
  const headings: string[] = []
  const ignoredHeadings = new Set(["overview"])

  visit(tree, "element", (node: Element) => {
    if (!/^h[1-6]$/.test(node.tagName)) return

    const text = toString(node).replace(/\s+/g, " ").trim()
    const normalized = text.toLowerCase()

    if (!text || ignoredHeadings.has(normalized)) return

    headings.push(text)
  })

  return [...new Set(headings)]
}

function extractAliases(fileAliases: unknown): string[] {
  if (!fileAliases) return []

  if (Array.isArray(fileAliases)) {
    return fileAliases
      .map((alias) => alias?.toString().trim())
      .filter((alias): alias is string => Boolean(alias))
  }

  return fileAliases
    .toString()
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean)
}

type TranslationRegistry = Record<string, Record<string, string>>

function normalizeTranslationRegistry(raw: unknown): TranslationRegistry {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}

  const registry: TranslationRegistry = {}

  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue

    const entry: Record<string, string> = {}

    for (const [lang, slug] of Object.entries(value)) {
      const normalizedLang = lang.toLowerCase().trim()
      const normalizedSlug = slug
        ?.toString()
        .trim()
        .replace(/^\/+/g, "")
        .replace(/\/+$/g, "")

      if (!normalizedLang || !normalizedSlug) continue

      entry[normalizedLang] = normalizedSlug
    }

    if (Object.keys(entry).length > 0) {
      registry[key] = entry
    }
  }

  return registry
}

async function readTranslationRegistry(): Promise<TranslationRegistry> {
  const registryPath = path.join(
    process.cwd(),
    "quartz",
    "static",
    "data",
    "page-ids.yaml",
  )

  if (!fs.existsSync(registryPath)) {
    return {}
  }

  const raw = await fs.promises.readFile(registryPath, "utf8")
  const parsed = yaml.load(raw)

  return normalizeTranslationRegistry(parsed)
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts }

  return {
    name: "ContentIndex",

    async *emit(ctx, content) {
      const cfg = ctx.cfg.configuration
      const linkIndex: ContentIndexMap = new Map()
      const translationRegistry = await readTranslationRegistry()

      for (const [_tree, file] of content) {
        const slug = file.data.slug!

        if (opts.includeEmptyFiles || (file.data.text && file.data.text !== "")) {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath!,
            title: file.data.frontmatter?.title!,
            aliases: extractAliases(file.data.frontmatter?.aliases),
            headings: extractHeadings(_tree as Root),
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

      yield write({
        ctx,
        content: JSON.stringify(translationRegistry),
        slug: joinSegments("static", "translations") as FullSlug,
        ext: ".json",
      })
    },
  }
}