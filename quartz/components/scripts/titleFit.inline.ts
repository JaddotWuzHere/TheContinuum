const mobileTitleQuery = "html.device-mobile .article-title"

let titleFitFrame: number | null = null

function resetTitleFit(title: HTMLElement) {
  title.style.removeProperty("font-size")
  title.removeAttribute("data-title-fit")
}

function getTitleWords(title: HTMLElement): string[] {
  return (title.textContent ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function measureWord(word: string, title: HTMLElement): number {
  const styles = window.getComputedStyle(title)

  const measurer = document.createElement("span")
  measurer.textContent = word

  measurer.style.position = "absolute"
  measurer.style.left = "-9999px"
  measurer.style.top = "0"
  measurer.style.visibility = "hidden"
  measurer.style.pointerEvents = "none"
  measurer.style.whiteSpace = "nowrap"

  measurer.style.fontFamily = styles.fontFamily
  measurer.style.fontSize = styles.fontSize
  measurer.style.fontStyle = styles.fontStyle
  measurer.style.fontWeight = styles.fontWeight
  measurer.style.fontVariant = styles.fontVariant
  measurer.style.letterSpacing = styles.letterSpacing
  measurer.style.textTransform = styles.textTransform

  document.body.appendChild(measurer)
  const width = measurer.getBoundingClientRect().width
  measurer.remove()

  return width
}

function fitMobileArticleTitle() {
  const title = document.querySelector<HTMLElement>(".article-title")
  if (!title) return

  resetTitleFit(title)

  if (!document.documentElement.classList.contains("device-mobile")) return

  const availableWidth = title.clientWidth
  if (availableWidth <= 0) return

  const words = getTitleWords(title)
  if (words.length === 0) return

  const longestWord = words.reduce((longest, word) => {
    return word.length > longest.length ? word : longest
  }, "")

  const startingStyles = window.getComputedStyle(title)
  const startingFontSize = Number.parseFloat(startingStyles.fontSize)

  if (!Number.isFinite(startingFontSize) || startingFontSize <= 0) return

  let wordWidth = measureWord(longestWord, title)
  if (wordWidth <= availableWidth) return

  const minFontSize = Math.max(28, startingFontSize * 0.62)
  let nextFontSize = startingFontSize

  while (wordWidth > availableWidth && nextFontSize > minFontSize) {
    nextFontSize -= 1
    title.style.fontSize = `${nextFontSize}px`
    wordWidth = measureWord(longestWord, title)
  }

  title.setAttribute("data-title-fit", "true")
}

function scheduleMobileArticleTitleFit() {
  if (titleFitFrame !== null) {
    window.cancelAnimationFrame(titleFitFrame)
  }

  titleFitFrame = window.requestAnimationFrame(() => {
    titleFitFrame = null
    fitMobileArticleTitle()
  })
}

document.addEventListener("nav", () => {
  scheduleMobileArticleTitleFit()

  if ("fonts" in document) {
    void document.fonts.ready.then(scheduleMobileArticleTitleFit)
  }
})

window.addEventListener("resize", scheduleMobileArticleTitleFit)
window.addEventListener("orientationchange", scheduleMobileArticleTitleFit)

const initialTitle = document.querySelector(mobileTitleQuery)
if (initialTitle) {
  scheduleMobileArticleTitleFit()
}