import raysScript from "./scripts/rays.inline"
import parallaxScript from "./scripts/parallax.inline"

import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types"
import { concatenateResources } from "../util/resources"

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

Body.afterDOMLoaded = concatenateResources(raysScript, parallaxScript)

// =========================
// CSS
// =========================

export default (() => Body) satisfies QuartzComponentConstructor