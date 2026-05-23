let ignoredSearchSectionHeadings: string[] | undefined

function parseIgnoredSectionsYaml(raw: string): string[] {
  const lines = raw.split(/\r?\n/)
  const sections: string[] = []
  let insideIgnoredSections = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) continue

    if (/^ignoredSections\s*:/.test(trimmed)) {
      insideIgnoredSections = true
      continue
    }

    if (!insideIgnoredSections) continue

    const match = trimmed.match(/^-\s+(.+)$/)

    if (!match) {
      if (/^[\w-]+\s*:/.test(trimmed)) {
        insideIgnoredSections = false
      }

      continue
    }

    sections.push(match[1].replace(/^["']|["']$/g, ""))
  }

  return sections
}

export async function loadIgnoredSearchSectionHeadings() {
  if (ignoredSearchSectionHeadings) return ignoredSearchSectionHeadings

  try {
    const response = await fetch("/static/data/search-ignored-sections.yaml")

    if (!response.ok) {
      ignoredSearchSectionHeadings = []
      return ignoredSearchSectionHeadings
    }

    ignoredSearchSectionHeadings = parseIgnoredSectionsYaml(await response.text())
    return ignoredSearchSectionHeadings
  } catch {
    ignoredSearchSectionHeadings = []
    return ignoredSearchSectionHeadings
  }
}

export function normalizeSearchSectionHeading(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[¶#]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function isIgnoredSearchSectionHeading(text: string) {
  if (!ignoredSearchSectionHeadings) return false

  const normalized = normalizeSearchSectionHeading(text)

  return ignoredSearchSectionHeadings.some(
    (ignoredHeading) => normalizeSearchSectionHeading(ignoredHeading) === normalized,
  )
}

export function filterIgnoredSearchSectionHeadings(headings: string[]) {
  return headings.filter((heading) => !isIgnoredSearchSectionHeading(heading))
}