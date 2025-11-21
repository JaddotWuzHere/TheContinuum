(() => {
  const waitFor = (sel, cb) => {
    const el = document.querySelector(sel);
    if (el) return cb(el);
    requestAnimationFrame(() => waitFor(sel, cb));
  };

  const tri01 = (x) => {
    const f = x - Math.floor(x);
    return 1 - Math.abs(2 * f - 1);
  };

  const saw01 = (x) => {
    const f = x - Math.floor(x);
    return f < 0 ? f + 1 : f;
  };

  const easeInOutSine01 = (u) => 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
  const GAMMA = 1.15; 

  waitFor("#rays", (el) => {
    const doc = document;
    const root = doc.documentElement;

    const N = 6;

    const T_ALPHA    = [52, 60, 68, 56, 64, 72];
    const T_OFF      = [29, 37, 45, 53, 61, 67];
    const PHI_ALPHA  = [0.2, 2.6, 1.1, 4.2, 0.8, 3.5];
    const PHI_OFF    = [5.1, 0.9, 3.4, 1.6, 5.7, 2.2];

    const ALPHA_BASE = [0.12, 0.11, 0.10, 0.13, 0.11, 0.10];
    const ALPHA_AMP  = [0.05, 0.045, 0.04, 0.05, 0.05, 0.04];

    const MIN_VH     = [-34, -8, -22, -16, -30, -12];
    const MAX_VH     = [ 12, 30,   8,  24,  16,  36];

    const DRIFT      = [0.010, 0.008, 0.012, 0.014, 0.009, 0.013];

    const JITTER      = [0.012, 0.010, 0.011, 0.014, 0.013, 0.009];
    const BURST_BOOST = [1.3, 1.2, 1.4, 1.3, 1.5, 1.2];

    const FLASH_LEN   = 0.070;
    const FLASH_GAIN  = 0.16;

    const burstStart = new Array(N).fill(-1);
    const burstEnd   = new Array(N).fill(-1);
    const nextBurst  = new Array(N).fill(0);
    const flashStart = new Array(N).fill(-1);

    const aSmooth = new Array(N).fill(0);
    let cut     = new Array(N).fill(1.0);
    let nextCut = new Array(N).fill(0);

    const MAX_CONCURRENT_BURSTS = 2;
    const activeBurstCount = (t) => {
      let c = 0;
      for (let i = 0; i < N; i++) if (t >= burstStart[i] && t <= burstEnd[i]) c++;
      return c;
    };

    const armBurst = (i, now) => {
      const dur = 0.5 + Math.random() * 0.6;
      const gap = 20 + Math.random() * 10;
      burstStart[i] = now;
      burstEnd[i]   = now + dur;
      nextBurst[i]  = burstEnd[i] + gap;
      flashStart[i] = now;
    };

    const t0 = performance.now() / 1000;
    for (let i = 0; i < N; i++) {
      const a0 = ALPHA_BASE[i] + 0.5 * ALPHA_AMP[i];
      aSmooth[i] = a0;
      el.style.setProperty(`--aR${i + 1}`, a0.toFixed(3));
      el.style.setProperty(`--offR${i + 1}`, "0vh");
      const firstGap = 2.0 + Math.random() * 5.0;
      nextBurst[i] = t0 + firstGap;
    }

    el.style.willChange = "background-position, background-image, filter, opacity";
    const MIN_A = 0.04, MAX_A = 0.24;

    let rafId = 0;
    const tick = () => {
      const y =
        (doc.scrollingElement && doc.scrollingElement.scrollTop) ||
        doc.scrollTop || window.scrollY || 0;
      root.style.setProperty("--scrollY", `${y.toFixed(1)}px`);

      const t = performance.now() / 1000;

      for (let i = 0; i < N; i++) {
        if (t >= nextBurst[i] && t > burstEnd[i]) {
          if (activeBurstCount(t) < MAX_CONCURRENT_BURSTS) {
            armBurst(i, t);
          } else {
            nextBurst[i] = t + (0.4 + Math.random() * 0.8);
          }
        }
      }

      for (let i = 0; i < N; i++) {
        const tw = t + DRIFT[i] * t * 0.2 + (y * 0.0009 * (i + 1));

        let fGate = 0;
        if (t >= burstStart[i] && t <= burstEnd[i]) {
          const u = (t - burstStart[i]) / (burstEnd[i] - burstStart[i]);
          fGate = Math.pow(Math.sin(Math.PI * u), 0.7);
        }

        const pulse = Math.sin((2 * Math.PI * tw) / T_ALPHA[i] + PHI_ALPHA[i]);
        const baseTarget = ALPHA_BASE[i] + ALPHA_AMP[i] * (0.5 + 0.5 * pulse);

        const meanDrop = 0.55 * fGate;
        const mean = baseTarget * (1 - meanDrop);

        const k1 = 4.8 + 0.5 * i;
        const k2 = 7.2 + 0.3 * i;
        const s1 = Math.sin(tw * k1);
        const s2 = Math.sin(tw * k2 + 1.234);
        const sq = (x) => (x >= 0 ? 1 : -1);
        const flickerNoise = fGate > 0
          ? (0.6 * sq(s1) + 0.4 * sq(s2))
          : (0.6 * s1     + 0.4 * s2);

        const jitterNow = fGate * JITTER[i] * BURST_BOOST[i];
        let flash = 0;
        const fs = flashStart[i];
        if (fs >= 0 && t >= fs && t <= fs + FLASH_LEN) {
          const v = (t - fs) / FLASH_LEN;
          const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * v);
          flash = FLASH_GAIN * hann;
        }

        if (t >= nextCut[i]) {
          const inHzMin = 12, inHzMax = 20;
          const outHzMin = 0.8, outHzMax = 1.5;
          const rate = fGate > 0
            ? (inHzMin + Math.random() * (inHzMax - inHzMin))
            : (outHzMin + Math.random() * (outHzMax - outHzMin));
          nextCut[i] = t + (1 / rate);

          if (fGate > 0) {
            cut[i] = Math.random() < 0.55 ? 0.20 : 1.0;
          } else {
            cut[i] = Math.random() < 0.20 ? 0.55 : 1.0;
          }
        }

        const dimTerm = jitterNow * 0.5 * Math.abs(flickerNoise);
        let aTarget = mean - dimTerm - flash;
        aTarget *= cut[i];
        aTarget = Math.max(MIN_A, Math.min(MAX_A, aTarget));

        const lambdaQuiet = 0.96;
        const lambdaBurst = 0.55;
        const lambda = fGate > 0 ? lambdaBurst : lambdaQuiet;
        aSmooth[i] = lambda * aSmooth[i] + (1 - lambda) * aTarget;
        el.style.setProperty(`--aR${i + 1}`, aSmooth[i].toFixed(3));

        const u = saw01(tw / T_OFF[i] + PHI_OFF[i] / (2 * Math.PI));
        const eased = Math.pow(easeInOutSine01(u), GAMMA);
        const off = MIN_VH[i] + (MAX_VH[i] - MIN_VH[i]) * eased;
        el.style.setProperty(`--offR${i + 1}`, `${off.toFixed(2)}vh`);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) cancelAnimationFrame(rafId);
        else rafId = requestAnimationFrame(tick);
      },
      { passive: true }
    );
  });
})();
