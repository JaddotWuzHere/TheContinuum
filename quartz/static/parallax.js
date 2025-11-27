// /static/parallax.js
(() => {
  const doc = document;
  const html = doc.documentElement;

  let lastY = 0;
  let ticking = false;
  let targets;

  function readScrollY() {
    const y =
      window.scrollY ??
      window.pageYOffset ??
      (doc.scrollingElement && doc.scrollingElement.scrollTop) ??
      html.scrollTop ??
      doc.body?.scrollTop ??
      0;

    return Number.isFinite(y) ? y : 0;
  }

  function ensureTargets() {
    // Cache once, but allow one retry in case the root wasn't ready on first run.
    if (targets) return targets;

    const root = doc.querySelector("#parallax-root");
    if (!root) return null;

    targets = {
      layers: Array.from(root.querySelectorAll(".layer")),
      gear: doc.getElementById("corner-parallax"),
    };

    return targets;
  }

  function applyFrame(y) {
    if (!Number.isFinite(y)) return;

    html.style.setProperty("--scrollY", `${y}px`);

    const set = ensureTargets();
    if (!set) return;

    const noBg = html.hasAttribute("data-no-bg-parallax");

    set.layers.forEach((el) => {
      const speed = noBg
        ? 0
        : parseFloat(el.getAttribute("data-speed") || "0") || 0;

      el.style.transform = `translate3d(0, ${-y * speed}px, 0)`;
    });

    const { gear } = set;
    if (gear) {
      const gSpeed = noBg
        ? 0
        : parseFloat(gear.getAttribute("data-speed") || "0") || 0;

      gear.style.transform = `translate3d(0, ${-y * gSpeed}px, 0)`;
    }
  }

  function queueUpdate(force = false) {
    const y = Math.round(readScrollY());
    if (!force && y === lastY) return;
    lastY = y;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        applyFrame(lastY);
      });
    }
  }

  queueUpdate(true);

  const observer = new MutationObserver((records) => {
    if (records.some((m) => m.type === "attributes")) {
      queueUpdate(true);
    }
  });

  observer.observe(html, {
    attributes: true,
    attributeFilter: ["data-no-bg-parallax"],
  });

  window.addEventListener("scroll", () => queueUpdate(), { passive: true });
  window.addEventListener("resize", () => queueUpdate(true), { passive: true });
  window.addEventListener("pageshow", () => queueUpdate(true));
})();