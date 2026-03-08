export type SupportedHomepageLang = "en" | "zh" | "fr"

const HOMEPAGE_BY_LANG: Record<SupportedHomepageLang, string> = {
  en: "genesis",
  zh: "genesis",
  fr: "genesis",
}

export function homepageSlugForLang(lang: SupportedHomepageLang): string {
  return HOMEPAGE_BY_LANG[lang] ?? HOMEPAGE_BY_LANG.en
}

export function homepagePathForLang(lang: SupportedHomepageLang): string {
  return `/${lang}/${homepageSlugForLang(lang)}`
}

export function homepagePathFromPathname(pathname: string): string {
  const first = pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase()

  const lang: SupportedHomepageLang =
    first === "zh" ? "zh" : first === "fr" ? "fr" : "en"

  return homepagePathForLang(lang)
}