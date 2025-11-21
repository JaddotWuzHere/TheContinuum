// /static/parallax.js
(() => {
  const root = document.documentElement;

  let lastY = -1;
  let ticking = false;

  function updateVariable(y) {
    root.style.setProperty("--scrollY", y + "px");
  }

  function onScroll() {
    const y = (window.scrollY || window.pageYOffset || 0) | 0;

    // Skip if scroll value hasn't changed
    if (y === lastY) return;
    lastY = y;

    // Throttle updates to animation frames
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateVariable(lastY);
        ticking = false;
      });
    }
  }

  // Initial update
  onScroll();

  // Events
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("pageshow", onScroll);
})();
