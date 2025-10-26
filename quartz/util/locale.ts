export function localeFromSlug(slugOrPath: string): "en" | "zh" {
  const s = (slugOrPath || "").replace(/^\/+/, "")
  const first = s.split("/")[0]?.toLowerCase()
  return first === "zh" ? "zh" : "en"
}