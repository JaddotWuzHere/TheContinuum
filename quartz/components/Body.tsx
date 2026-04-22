// @ts-ignore
import raysScript from "./scripts/rays.inline.js?raw"

import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"

const Body: QuartzComponent = (props: QuartzComponentProps) => {
  const { children } = props

  return (
    <>
      {/* Background FX */}
      <div id="parallax-root" aria-hidden="true">
        <div class="layer back" data-speed="0.1"></div>
      </div>

      <div id="rays" aria-hidden="true"></div>

      {/* Main page body */}
      <div id="quartz-body">{children}</div>
    </>
  )
}

// =========================
// Scripts
// =========================

Body.afterDOMLoaded = [
  raysScript,
].filter(Boolean).join(";\n")

// =========================
// CSS
// =========================

export default (() => Body) satisfies QuartzComponentConstructor
