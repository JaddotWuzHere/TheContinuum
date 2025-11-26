// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline";
// @ts-ignore
import raysScript from "./scripts/rays.inline.js?raw";
import clipboardStyle from "./styles/clipboard.scss";
import { i18n } from "../i18n";

import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "./types";

import LanguageSwitcherCtor from "./LangSwitcher";   // make sure filename case matches

// Instantiate Quartz component + grab its CSS/script
const LanguageSwitcher = LanguageSwitcherCtor();
const langCss = (LanguageSwitcher as any).css ?? "";
const langAfter = (LanguageSwitcher as any).afterDOMLoaded ?? "";


const Body: QuartzComponent = (props: QuartzComponentProps) => {
  const { children, cfg } = props;
  const t = i18n(cfg.locale)   // t is your translation tree for this locale

  return (
    <>
      <div id="fx-settings">
        <button id="fx-settings-toggle" type="button">
          {t.components.fxSettings.settingsButton}
        </button>

        <div id="fx-settings-panel">
          <h2 class="fx-panel-title">
            {t.components.fxSettings.settingsTitle}
          </h2>

          {/* ===========================
              Appearance
             =========================== */}
          <section class="fx-panel-section">
            <h3 class="fx-panel-section-title">
              {t.components.fxSettings.appearanceSection}
            </h3>

            <label class="fx-panel-row">
              <span>{t.components.fxSettings.themeLabel}</span>
              <select disabled>
                <option>{t.components.fxSettings.themeSystem}</option>
                <option>{t.components.fxSettings.themeLight}</option>
                <option>{t.components.fxSettings.themeDark}</option>
              </select>
            </label>
          </section>

          {/* ===========================
              Performance
             =========================== */}
          <section class="fx-panel-section">
            <h3 class="fx-panel-section-title">
              {t.components.fxSettings.performanceSection}
            </h3>

            <label class="fx-panel-row">
              <span>{t.components.fxSettings.disableRays}</span>
              <input type="checkbox" data-flag="no-rays" />
            </label>

            <label class="fx-panel-row">
              <span>{t.components.fxSettings.disableRayMove}</span>
              <input type="checkbox" data-flag="no-ray-move" />
            </label>

            <label class="fx-panel-row">
              <span>{t.components.fxSettings.disableFlicker}</span>
              <input type="checkbox" data-flag="no-flicker" />
            </label>

            <label class="fx-panel-row">
              <span>{t.components.fxSettings.disableRayParallax}</span>
              <input type="checkbox" data-flag="no-ray-parallax" />
            </label>


            <label class="fx-panel-row">
              <span>{t.components.fxSettings.disableBgParallax}</span>
              <input type="checkbox" data-flag="no-bg-parallax" />
            </label>
          </section>

          {/* ===========================
              Language
             =========================== */}
          <section class="fx-panel-section">
            <h3 class="fx-panel-section-title">
               {t.components.fxSettings.languageSection}
            </h3>
            <div class="fx-panel-row">
              <LanguageSwitcher {...props} />
            </div>
          </section>
        </div>
      </div>

      {/* Parallax root */}
      <div id="parallax-root" aria-hidden="true">
        <div class="layer back" data-speed="0.2"></div>
      </div>

      <div id="rays" aria-hidden="true"></div>

      <div id="quartz-body">{children}</div>
    </>
  );
};


// =========================
// Scripts
// =========================

Body.afterDOMLoaded = [
  clipboardScript,
  raysScript,
  langAfter,   // <<< language switcher JS so the dropdown works

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
].filter(Boolean).join(";\n");   // ignore empty langAfter if any


// =========================
// CSS
// =========================

Body.css = [clipboardStyle, langCss].join("\n");   // include LS styles too

export default (() => Body) satisfies QuartzComponentConstructor;
