import type { FullSlug } from "../util/path"

export function dropLangPrefix(slug?: string): FullSlug {
  if (!slug) return "" as FullSlug
  const parts = slug.split("/").filter(Boolean)
  if (parts[0] === "en" || parts[0] === "zh") parts.shift()
  return parts.join("/") as FullSlug
}

export type Lang = "en" | "zh";

export function getLangFromSlug(slug?: string): Lang {
  if (!slug) return "en";
  const top = slug.split("/").filter(Boolean)[0];
  return (top === "zh" ? "zh" : "en");
}

export function getLangFromPathname(pathname: string): Lang {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (seg === "zh" ? "zh" : "en");
}

export function swapLangPath(pathname: string, target: Lang): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${target}/`;
  if (parts[0] === "en" || parts[0] === "zh") parts[0] = target;
  else parts.unshift(target);
  return "/" + parts.join("/") + (pathname.endsWith("/") ? "/" : "");
}

export function hasLangPrefix(slug: string, lang: Lang): boolean {
  return slug.startsWith(lang + "/");
}

