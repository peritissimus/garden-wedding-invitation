import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/*
 * The garden at five moments of the day. Each moment sets the sky, the sun
 * and moon, the clouds, how much of the warm (sunset) and moonlit versions of
 * the painted land show over daylight, which lights are on, and where the
 * camera is.
 *
 * Everything is tweened directly on the few elements that change — never via
 * inherited CSS variables on the stage, which would re-style thousands of
 * leaves and petals every scroll frame.
 */
interface Moment {
  sky: [string, string, string]
  sun: { x: number; y: number; disc: string; glow: string }
  rays: number
  moon: { x: number; y: number; o: number }
  stars: number
  clouds: { top: string; bottom: string; o: number }
  birds: number
  /** 0 = daylight, 1 = full warm (sunset) look */
  warm: number
  /** 0 = none, 1 = full moonlight */
  moonMix: number
  lights: number
  bokeh: number
  fireflies: number
  night: number
  petals: number
  cam: number
  camY: number
}

const AFTERNOON: Moment = {
  sky: ['#b9d7ea', '#e3eef1', '#fbf2e2'],
  sun: { x: 1230, y: 230, disc: '#fff9e6', glow: '#ffeec2' },
  rays: 0.18,
  moon: { x: 380, y: 820, o: 0 },
  stars: 0,
  clouds: { top: '#ffffff', bottom: '#dde7ee', o: 0.95 },
  birds: 0.75,
  warm: 0,
  moonMix: 0,
  lights: 0,
  bokeh: 0,
  fireflies: 0,
  night: 0,
  petals: 1,
  cam: 1,
  camY: 60,
}
/** The hero looks up at the sky; scrolling tilts the camera down onto the garden. */
const HERO: Moment = { ...AFTERNOON, cam: 0.94, camY: 280 }
const GOLDEN: Moment = {
  ...AFTERNOON,
  sky: ['#e9cfb2', '#f7dfc0', '#ffdca6'],
  sun: { x: 1180, y: 420, disc: '#ffe6a3', glow: '#ffcf7a' },
  rays: 0.6,
  clouds: { top: '#fff6e6', bottom: '#efc8a2', o: 0.9 },
  birds: 0.9,
  warm: 0.45,
  petals: 0.7,
  cam: 1.08,
  camY: 0,
}
const SUNSET: Moment = {
  ...GOLDEN,
  sky: ['#8d6c9c', '#e3938a', '#fbb878'],
  sun: { x: 1120, y: 640, disc: '#ffbb73', glow: '#ff9566' },
  rays: 0.4,
  clouds: { top: '#f9c6b0', bottom: '#b77f96', o: 0.85 },
  birds: 0.45,
  warm: 1,
  lights: 0.12,
  night: 0.15,
  petals: 0.3,
  cam: 1.12,
}
const DUSK: Moment = {
  ...SUNSET,
  sky: ['#262a5c', '#5c4d84', '#c58693'],
  sun: { x: 1080, y: 790, disc: '#ff9a76', glow: '#e9747a' },
  rays: 0,
  moon: { x: 400, y: 380, o: 0.65 },
  stars: 0.4,
  clouds: { top: '#7f73a3', bottom: '#4b4577', o: 0.6 },
  birds: 0,
  moonMix: 0.62,
  lights: 1,
  bokeh: 0.6,
  night: 0.55,
  petals: 0,
}
const NIGHT: Moment = {
  ...DUSK,
  sky: ['#0a1030', '#171f48', '#30366a'],
  sun: { x: 1060, y: 920, disc: '#ff9a76', glow: '#e9747a' },
  moon: { x: 420, y: 200, o: 1 },
  stars: 1,
  clouds: { top: '#2c335e', bottom: '#1d2348', o: 0.16 },
  moonMix: 1,
  bokeh: 0.9,
  fireflies: 1,
  night: 1,
  cam: 1.1,
}

/** Scene units → px for the `slice`-scaled artwork. */
const unit = () => Math.max(innerWidth / 1600, innerHeight / 1000)

function targets(stage: HTMLElement) {
  const q = <T extends Element>(s: string) => stage.querySelector<T>(s)!
  const qa = <T extends Element>(s: string) => [...stage.querySelectorAll<T>(s)]
  return {
    sky: q<HTMLElement>('.sky'),
    sun: q('.celestial .sun'),
    sunDisc: q('.celestial .sun-disc'),
    sunGlow: qa('#sunGlow stop'),
    moon: q('.celestial .moon'),
    stars: q('.celestial .night-sky'),
    cloudStops: qa('#cloudG stop'),
    clouds: q('.clouds'),
    birds: q('.birds'),
    warm: qa('.land-warm'),
    moonlit: qa('.land-moon'),
    glows: qa<SVGSVGElement>('.layer.glow'),
    rays: q('.fx .rays'),
    bokeh: q('.fx .bokeh'),
    fireflies: q('.fireflies'),
    vignette: q('.vignette'),
    petals: q('.petals'),
    cams: [
      [q<HTMLElement>('.cam-back'), 0.92, 0.6],
      [q<HTMLElement>('.cam-front'), 1, 1],
      [q<HTMLElement>('.cam-fg'), 1.2, 1.3],
    ] as [HTMLElement, number, number][],
  }
}
type Targets = ReturnType<typeof targets>

/** Every property a moment controls, as plain values per target. */
function frame(t: Targets, m: Moment, u: number) {
  const out: [gsap.TweenTarget, gsap.TweenVars][] = [
    [t.sky, { '--sky-top': m.sky[0], '--sky-mid': m.sky[1], '--sky-bottom': m.sky[2] }],
    [t.sun, { x: m.sun.x, y: m.sun.y }],
    [t.sunDisc, { fill: m.sun.disc }],
    [t.sunGlow, { stopColor: m.sun.glow }],
    [t.moon, { x: m.moon.x, y: m.moon.y, opacity: m.moon.o }],
    [t.stars, { opacity: m.stars }],
    [t.cloudStops[0], { stopColor: m.clouds.top }],
    [t.cloudStops[1], { stopColor: m.clouds.bottom }],
    [t.clouds, { opacity: m.clouds.o }],
    [t.birds, { opacity: m.birds }],
    [t.warm, { opacity: m.warm }],
    [t.moonlit, { opacity: m.moonMix }],
    [t.glows, { '--lights': m.lights }],
    [t.rays, { x: m.sun.x, y: m.sun.y, opacity: m.rays }],
    [t.bokeh, { opacity: m.bokeh }],
    [t.fireflies, { opacity: m.fireflies }],
    [t.vignette, { opacity: m.night * 0.7 }],
    [t.petals, { '--petals': m.petals }],
  ]
  for (const [el, k, s] of t.cams) out.push([el, { y: m.camY * u * k, scale: 1 + (m.cam - 1) * s }])
  return out
}

/**
 * Scroll is the clock: each section is pinned to a moment of the day and the
 * garden blends between them as you pass. The order of the day lines up with
 * the light — ceremony in golden hour, cocktails at sunset, the string lights
 * come on for dinner, and the fireflies and stars arrive for dancing.
 */
export function setupDay(stage: HTMLElement, reduced: boolean) {
  const root = document.documentElement
  const t = targets(stage)
  const place = () => {
    const u = unit()
    for (const [el] of t.cams) gsap.set(el, { transformOrigin: `50% ${innerHeight - 240 * u}px` })
    return u
  }
  for (const [target, vars] of frame(t, HERO, place())) gsap.set(target, vars)

  const events = [...document.querySelectorAll<HTMLElement>('.event')]
  const moments = [GOLDEN, SUNSET, DUSK, NIGHT]
  const stops: [HTMLElement | null, Moment][] = [
    [document.getElementById('story'), AFTERNOON],
    [document.getElementById('when'), GOLDEN],
    ...events.map((el, i): [HTMLElement, Moment] => [el, moments[Math.min(i, moments.length - 1)]]),
    [document.getElementById('footer'), NIGHT],
  ]

  let trigger: ScrollTrigger | null = null
  const build = () => {
    const progress = trigger?.progress ?? 0
    trigger?.kill()
    const u = place()
    const max = Math.max(1, root.scrollHeight - innerHeight)
    const centre = (el: HTMLElement) => {
      const top = el.getBoundingClientRect().top + scrollY
      return Math.min(1, Math.max(0, (top + el.offsetHeight / 2 - innerHeight / 2) / max))
    }
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    let t0 = 0
    let from = HERO
    for (const [el, to] of stops) {
      if (!el) continue
      const at = centre(el)
      if (at > t0) {
        const a = frame(t, from, u)
        const b = frame(t, to, u)
        a.forEach(([target, vars], i) => tl.fromTo(target, { ...vars }, { ...b[i][1], duration: at - t0, immediateRender: false }, t0))
      }
      t0 = Math.max(t0, at)
      from = to
    }
    if (t0 < 1) tl.to({}, { duration: 1 - t0 }, t0)
    tl.progress(progress)
    trigger = ScrollTrigger.create({ animation: tl, start: 0, end: 'max', scrub: reduced ? true : 0.8 })
  }
  build()
  let timer = 0
  addEventListener('resize', () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      build()
      ScrollTrigger.refresh()
    }, 250)
  })
  document.fonts?.ready.then(build)

  // Cards switch to dark glass once the sun has gone; fireflies wake for the dancing.
  const dusk = events[2] ?? events[events.length - 1]
  const night = events[3] ?? events[events.length - 1]
  if (dusk)
    ScrollTrigger.create({
      trigger: dusk,
      start: 'top 70%',
      onEnter: () => root.classList.add('is-dusk'),
      onLeaveBack: () => root.classList.remove('is-dusk'),
    })
  if (night)
    ScrollTrigger.create({
      trigger: night,
      start: 'top 75%',
      onEnter: () => root.classList.add('is-night'),
      onLeaveBack: () => root.classList.remove('is-night'),
    })

  // A little pointer parallax on desktop: nearer layers drift more.
  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const layers = [...stage.querySelectorAll<HTMLElement>('.px')].map((el) => {
      const depth = Number(el.dataset.depth)
      return {
        depth,
        x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
      }
    })
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      for (const l of layers) {
        l.x(-nx * l.depth)
        l.y(-ny * l.depth * 0.5)
      }
    })
  }
}
