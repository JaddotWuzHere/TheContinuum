// /static/parallax.js
(() => {
  const root = document.documentElement;
  const cand = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    document.getElementById('quartz-body'),
    document.querySelector('.center'),
    document.querySelector('main'),
    document.querySelector('.content'),
  ].filter(Boolean);

  // read the current scroll offset from candidates + window
  const readY = () => {
    let y = 0;
    for (const el of cand) y = Math.max(y, el.scrollTop || 0);
    y = Math.max(y, window.pageYOffset || 0);
    return y | 0; // int
  };

  // write CSS var on :root
  const setY = (y) => root.style.setProperty('--scrollY', y + 'px');

  // rAF-throttled writer
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setY(readY());
      ticking = false;
    });
  };

  // Attach listeners to all candidates + window (passive)
  const attach = () => {
    setY(readY()); // init (anchors/refresh)
    addEventListener('scroll', onScroll, { passive: true });
    for (const el of cand) el.addEventListener?.('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    addEventListener('pageshow', onScroll);

    // debug once
    console.log(
      '[parallax] attached to',
      cand.map(el => el === document.documentElement ? ':root' :
                     el === document.body ? 'body' :
                     el.id ? `#${el.id}` :
                     el.className ? `.${el.className}` : el.tagName).join(', ')
    );
  };

  // Run now (Quartz pages are already rendered)
  attach();
})();
