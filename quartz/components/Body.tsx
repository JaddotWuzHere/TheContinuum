// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline";
// @ts-ignore
import raysScript from "./scripts/rays.inline.js?raw";
import clipboardStyle from "./styles/clipboard.scss";
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types";

const Body: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return (
    <>
      <div id="fx-settings">
        <button id="fx-settings-toggle" type="button">
          ⚙ FX
        </button>
        <div id="fx-settings-panel">
          <label>
            <input type="checkbox" data-flag="no-rays" />
            Disable rays entirely
          </label>
          <label>
            <input type="checkbox" data-flag="no-ray-move" />
            Disable ray moving
          </label>
          <label>
            <input type="checkbox" data-flag="no-flicker" />
            Disable ray flickering
          </label>
          <label>
            <input type="checkbox" data-flag="no-ray-parallax" />
            Disable ray parallax
          </label>
          <label>
            <input type="checkbox" data-flag="no-bg-parallax" />
            Disable background parallax
          </label>
        </div>
      </div>

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

  // =========================
  // FX SETTINGS
  // =========================
  `
  (function () {
    const root = document.documentElement;
    const wrapper = document.getElementById("fx-settings");
    if (!wrapper) return;

    const btn = document.getElementById("fx-settings-toggle");
    const panel = document.getElementById("fx-settings-panel");
    if (!panel) return;

    const inputs = panel.querySelectorAll("input[data-flag]");
    const KEY = "continuum-fx";

    function loadState() {
      try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
      catch { return {}; }
    }

    function saveState(state) {
      localStorage.setItem(KEY, JSON.stringify(state));
    }

    // Parent/child relationships
    function normalizeState(state) {
      const raySubs = ["no-ray-move", "no-flicker", "no-ray-parallax"];
      state["no-rays"] = !!state["no-rays"];
      state["no-bg-parallax"] = !!state["no-bg-parallax"];

      raySubs.forEach(f => state[f] = !!state[f]);

      // Parent ON → children ON
      if (state["no-rays"]) {
        raySubs.forEach(f => state[f] = true);
      }

      return state;
    }

    function applyState(state) {
      const flags = [
        "no-rays",
        "no-ray-move",
        "no-flicker",
        "no-ray-parallax",
        "no-bg-parallax"
      ];

      flags.forEach(f => root.removeAttribute("data-" + f));

      Object.entries(state).forEach(([flag, on]) => {
        if (on) root.setAttribute("data-" + flag, "1");
      });

      inputs.forEach(input => {
        const flag = input.getAttribute("data-flag");
        if (!flag) return;
        input.checked = !!state[flag];

        const isRaySub = ["no-ray-move", "no-flicker", "no-ray-parallax"].includes(flag);
        input.disabled = state["no-rays"] && isRaySub;
      });
    }

    let state = normalizeState(loadState());
    applyState(state);

    btn?.addEventListener("click", () => {
      const open = wrapper.getAttribute("data-open") === "1";
      wrapper.setAttribute("data-open", open ? "0" : "1");
    });

    inputs.forEach(input => {
      input.addEventListener("change", () => {
        const flag = input.getAttribute("data-flag");
        if (!flag) return;

        state[flag] = input.checked;
        state = normalizeState(state);
        saveState(state);
        applyState(state);
      });
    });
  })();
  `,

  // =========================
  // PARALLAX
  // =========================
  `
  (function () {
    const root = document.querySelector("#parallax-root");
    if (!root) return;

    const layers = Array.from(root.querySelectorAll(".layer"));

    let ticking = false;
    let lastY = 0;

    function applyScroll() {
      const html = document.documentElement;
      const noBg = html.hasAttribute("data-no-bg-parallax");

      layers.forEach(el => {
        const speed = noBg
          ? 0
          : parseFloat(el.getAttribute("data-speed") || "0") || 0;

        el.style.transform = "translate3d(0, " + (-lastY * speed) + "px, 0)";

      });

      const gear = document.getElementById("corner-parallax");
      if (gear) {
        const gSpeed = noBg
          ? 0
          : parseFloat(gear.getAttribute("data-speed") || "0") || 0;

        gear.style.transform =
          "translate3d(0, " + (-lastY * gSpeed) + "px, 0)";
      }

      ticking = false;
    }

    function onScroll() {
      lastY = window.scrollY || window.pageYOffset || 0;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    lastY = window.scrollY || window.pageYOffset || 0;
    applyScroll();
  })();
  `
].join(";\n");

Body.css = clipboardStyle;

export default (() => Body) satisfies QuartzComponentConstructor;
