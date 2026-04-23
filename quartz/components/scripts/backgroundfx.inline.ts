function waitForElement(selector: string, cb: (element: HTMLElement) => void) {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    cb(element)
    return
  }

  requestAnimationFrame(() => waitForElement(selector, cb))
}

function saw01(x: number) {
  const f = x - Math.floor(x)
  return f < 0 ? f + 1 : f
}

function easeInOutSine01(u: number) {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * u)
}

function setupBackgroundFx() {
  const root = document.documentElement
  const GLOBAL_KEY = "__continuumBackgroundFxInit"

  if ((window as any)[GLOBAL_KEY]) return
  ;(window as any)[GLOBAL_KEY] = true

  const GAMMA = 1.15
  const RAY_COUNT = 6
  const MAX_CONCURRENT_BURSTS = 2
  const MIN_ALPHA = 0.04
  const MAX_ALPHA = 0.24
  const FLASH_LENGTH = 0.07
  const FLASH_GAIN = 0.16

  const T_ALPHA = [52, 60, 68, 56, 64, 72]
  const T_OFF = [29, 37, 45, 53, 61, 67]
  const PHI_ALPHA = [0.2, 2.6, 1.1, 4.2, 0.8, 3.5]
  const PHI_OFF = [5.1, 0.9, 3.4, 1.6, 5.7, 2.2]
  const ALPHA_BASE = [0.12, 0.11, 0.1, 0.13, 0.11, 0.1]
  const ALPHA_AMP = [0.05, 0.045, 0.04, 0.05, 0.05, 0.04]
  const MIN_VH = [-34, -8, -22, -16, -30, -12]
  const MAX_VH = [12, 30, 8, 24, 16, 36]
  const DRIFT = [0.01, 0.008, 0.012, 0.014, 0.009, 0.013]
  const JITTER = [0.012, 0.01, 0.011, 0.014, 0.013, 0.009]
  const BURST_BOOST = [1.3, 1.2, 1.4, 1.3, 1.5, 1.2]

  waitForElement("#rays", (raysElement) => {
    const burstStart = new Array<number>(RAY_COUNT).fill(-1)
    const burstEnd = new Array<number>(RAY_COUNT).fill(-1)
    const nextBurst = new Array<number>(RAY_COUNT).fill(0)
    const flashStart = new Array<number>(RAY_COUNT).fill(-1)
    const alphaSmooth = new Array<number>(RAY_COUNT).fill(0)
    const cut = new Array<number>(RAY_COUNT).fill(1)
    const nextCut = new Array<number>(RAY_COUNT).fill(0)

    const activeBurstCount = (time: number) => {
      let count = 0
      for (let i = 0; i < RAY_COUNT; i++) {
        if (time >= burstStart[i] && time <= burstEnd[i]) count++
      }
      return count
    }

    const armBurst = (index: number, now: number) => {
      const duration = 0.5 + Math.random() * 0.6
      const gap = 20 + Math.random() * 10
      burstStart[index] = now
      burstEnd[index] = now + duration
      nextBurst[index] = burstEnd[index] + gap
      flashStart[index] = now
    }

    const shouldParallax = () => !root.hasAttribute("data-no-ray-parallax")
    const shouldFlicker = () => !root.hasAttribute("data-no-flicker")
    const shouldMove = () => !root.hasAttribute("data-no-ray-movement")
    const shouldDraw = () => !root.hasAttribute("data-no-rays")

    const startTime = performance.now() / 1000
    for (let i = 0; i < RAY_COUNT; i++) {
      const initialAlpha = ALPHA_BASE[i] + 0.5 * ALPHA_AMP[i]
      alphaSmooth[i] = initialAlpha
      raysElement.style.setProperty(`--aR${i + 1}`, initialAlpha.toFixed(3))
      raysElement.style.setProperty(`--offR${i + 1}`, "0vh")
      nextBurst[i] = startTime + 2 + Math.random() * 5
    }

    raysElement.style.willChange = "background-position, background-image, filter, opacity"

    let rafId = 0
    let running = false

    const tick = () => {
      if (!running) return

      const parallaxOn = shouldParallax()
      const flickerOn = shouldFlicker()
      const movementOn = shouldMove()

      let scrollY = 0
      if (parallaxOn) {
        scrollY =
          document.scrollingElement?.scrollTop ?? document.documentElement.scrollTop ?? window.scrollY ?? 0
        root.style.setProperty("--scrollY", `${scrollY.toFixed(1)}px`)
      }

      const time = performance.now() / 1000

      for (let i = 0; i < RAY_COUNT; i++) {
        if (time >= nextBurst[i] && time > burstEnd[i]) {
          if (activeBurstCount(time) < MAX_CONCURRENT_BURSTS) {
            armBurst(i, time)
          } else {
            nextBurst[i] = time + (0.4 + Math.random() * 0.8)
          }
        }
      }

      for (let i = 0; i < RAY_COUNT; i++) {
        const timeWarp = time + DRIFT[i] * time * 0.2 + scrollY * 0.0009 * (i + 1)

        let flickerGate = 0
        if (time >= burstStart[i] && time <= burstEnd[i]) {
          const u = (time - burstStart[i]) / (burstEnd[i] - burstStart[i])
          flickerGate = Math.pow(Math.sin(Math.PI * u), 0.7)
        }

        const pulse = Math.sin((2 * Math.PI * timeWarp) / T_ALPHA[i] + PHI_ALPHA[i])
        const baseTarget = ALPHA_BASE[i] + ALPHA_AMP[i] * (0.5 + 0.5 * pulse)
        const meanDrop = 0.55 * flickerGate
        const mean = baseTarget * (1 - meanDrop)

        let alphaTarget = mean

        if (flickerOn) {
          const k1 = 4.8 + 0.5 * i
          const k2 = 7.2 + 0.3 * i
          const s1 = Math.sin(timeWarp * k1)
          const s2 = Math.sin(timeWarp * k2 + 1.234)
          const squareWave = (x: number) => (x >= 0 ? 1 : -1)
          const flickerNoise =
            flickerGate > 0
              ? 0.6 * squareWave(s1) + 0.4 * squareWave(s2)
              : 0.6 * s1 + 0.4 * s2

          const jitterNow = flickerGate * JITTER[i] * BURST_BOOST[i]
          let flash = 0
          const flashTime = flashStart[i]
          if (flashTime >= 0 && time >= flashTime && time <= flashTime + FLASH_LENGTH) {
            const v = (time - flashTime) / FLASH_LENGTH
            const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * v)
            flash = FLASH_GAIN * hann
          }

          if (time >= nextCut[i]) {
            const rate =
              flickerGate > 0 ? 12 + Math.random() * (20 - 12) : 0.8 + Math.random() * (1.5 - 0.8)
            nextCut[i] = time + 1 / rate
            cut[i] = flickerGate > 0 ? (Math.random() < 0.55 ? 0.2 : 1) : Math.random() < 0.2 ? 0.55 : 1
          }

          const dimTerm = jitterNow * 0.5 * Math.abs(flickerNoise)
          alphaTarget = (mean - dimTerm - flash) * cut[i]
        }

        alphaTarget = Math.max(MIN_ALPHA, Math.min(MAX_ALPHA, alphaTarget))

        const quietSmoothing = 0.96
        const burstSmoothing = flickerOn ? 0.55 : 0.75
        const smoothing = flickerGate > 0 ? burstSmoothing : quietSmoothing
        alphaSmooth[i] = smoothing * alphaSmooth[i] + (1 - smoothing) * alphaTarget
        raysElement.style.setProperty(`--aR${i + 1}`, alphaSmooth[i].toFixed(3))

        let offset = 0
        if (movementOn) {
          const u = saw01(timeWarp / T_OFF[i] + PHI_OFF[i] / (2 * Math.PI))
          const eased = Math.pow(easeInOutSine01(u), GAMMA)
          offset = MIN_VH[i] + (MAX_VH[i] - MIN_VH[i]) * eased
        }

        raysElement.style.setProperty(`--offR${i + 1}`, `${offset.toFixed(2)}vh`)
      }

      rafId = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || !shouldDraw()) return
      running = true
      rafId = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(rafId)
    }

    start()

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop()
        else start()
      },
      { passive: true },
    )

    new MutationObserver(() => {
      if (shouldDraw()) start()
      else stop()
    }).observe(root, {
      attributes: true,
      attributeFilter: ["data-no-rays", "data-no-ray-parallax", "data-no-flicker", "data-no-ray-movement"],
    })
  })
}

setupBackgroundFx()