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

  const readY = () => {
    let y = 0;
    for (const el of cand) y = Math.max(y, el.scrollTop || 0);
    y = Math.max(y, window.pageYOffset || 0);
    return y | 0; 
  };

  const setY = (y) => root.style.setProperty('--scrollY', y + 'px');

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setY(readY());
      ticking = false;
    });
  };

  const attach = () => {
    setY(readY()); 
    addEventListener('scroll', onScroll, { passive: true });
    for (const el of cand) el.addEventListener?.('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    addEventListener('pageshow', onScroll);

    console.log(
      '[parallax] attached to',
      cand.map(el => el === document.documentElement ? ':root' :
                     el === document.body ? 'body' :
                     el.id ? `#${el.id}` :
                     el.className ? `.${el.className}` : el.tagName).join(', ')
    );
  };

  attach();
})();
