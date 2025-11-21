// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline";
// @ts-ignore
import raysScript from "./scripts/rays.inline.js?raw";
import clipboardStyle from "./styles/clipboard.scss";
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types";

const Body: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return (
    <>
      <div id="parallax-root" aria-hidden="true">
        <div class="layer back" data-speed="0.2"></div>
      </div>

      <div id="rays" aria-hidden="true"></div>

      <div id="quartz-body">{children}</div>
    </>
  );
};

Body.afterDOMLoaded = [
  clipboardScript,
  raysScript,
  `
  (function () {
    const root = document.querySelector("#parallax-root");
    if (!root) return;

    const layers = Array.from(root.querySelectorAll(".layer"));
    let ticking = false, lastY = 0;

    function apply() {
      layers.forEach(el => {
        const speed = parseFloat(el.getAttribute("data-speed") || "0") || 0;
        el.style.transform = "translateY(" + (-lastY * speed) + "px)";
      });
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      lastY = window.scrollY;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    });

    // initialize on load
    lastY = window.scrollY; apply();
  })();
  `
].join(";\n");

Body.css = clipboardStyle

export default (() => Body) satisfies QuartzComponentConstructor;