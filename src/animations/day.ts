import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mountStage, type Layout, type Sky } from '../stage'

/*
 * The garden at five moments of the day. Each moment sets the sky, where the
 * sun and moon are and how they're lit, the clouds, how much of the warm
 * (sunset) and moonlit versions of the painted land show over daylight, which
 * lights are on, and where the camera is.
 *
 * The scenery is painted once into canvases (stage.ts), so scrolling only
 * moves and fades them — transforms and opacity, which the GPU composites
 * without repainting anything. The sky gradient and the lights are the only
 * things redrawn, and both are tiny.
 */
interface Moment {
  sky: [string, string, string]
  sun: { x: number; y: number; o: number }
  /** the painted sun's colour as a blend of its day, golden and sunset versions (weights sum to 1) */
  sunLook: [day: number, golden: number, sunset: number]
  rays: number
  moon: { x: number; y: number; o: number }
  stars: number
  /** cloud opacity, and their colour as a blend of day, golden, sunset, dusk and night versions (weights sum to 1) */
  clouds: { o: number; look: [number, number, number, number, number] }
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
  sun: { x: 1230, y: 230, o: 1 },
  sunLook: [1, 0, 0],
  rays: 0.18,
  moon: { x: 380, y: 820, o: 0 },
  stars: 0,
  clouds: { o: 0.95, look: [1, 0, 0, 0, 0] },
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
  sun: { x: 1180, y: 420, o: 1 },
  sunLook: [0, 1, 0],
  rays: 0.6,
  clouds: { o: 0.9, look: [0, 1, 0, 0, 0] },
  birds: 0.9,
  warm: 0.45,
  petals: 0.7,
  cam: 1.08,
  camY: 0,
}
const SUNSET: Moment = {
  ...GOLDEN,
  sky: ['#8d6c9c', '#e3938a', '#fbb878'],
  sun: { x: 1120, y: 640, o: 1 },
  sunLook: [0, 0, 1],
  rays: 0.4,
  clouds: { o: 0.85, look: [0, 0, 1, 0, 0] },
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
  sun: { x: 1080, y: 790, o: 0.8 },
  rays: 0,
  moon: { x: 400, y: 380, o: 0.65 },
  stars: 0.4,
  clouds: { o: 0.6, look: [0, 0, 0, 1, 0] },
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
  sun: { x: 1060, y: 920, o: 0 },
  moon: { x: 420, y: 200, o: 1 },
  stars: 1,
  clouds: { o: 0.16, look: [0, 0, 0, 0, 1] },
  moonMix: 1,
  bokeh: 0.9,
  fireflies: 1,
  night: 1,
  cam: 1.1,
}

function targets(stage: HTMLElement) {
  const q = (s: string) => stage.querySelector<HTMLElement>(s)!
  const qa = (s: string) => [...stage.querySelectorAll<HTMLElement>(s)]
  return {
    /** sky colours and lights, drawn onto canvases by the stage */
    paint: { skyTop: '', skyMid: '', skyBottom: '', lights: 0 } as Sky,
    stars: q('.stars'),
    sun: q('.sun'),
    sunLooks: qa('.sun .slot'),
    moon: q('.moon'),
    clouds: q('.clouds'),
    cloudLooks: qa('.cloud-band .slot'),
    birds: q('.birds'),
    warm: qa('.look.warm'),
    moonlit: qa('.look.moon'),
    rays: q('.rays'),
    bokeh: q('.bokeh'),
    fireflies: q('.fireflies'),
    vignette: q('.vignette'),
    petals: q('.petals-day'),
    cams: [
      [q('.cam-back'), 0.92, 0.6],
      [q('.cam-front'), 1, 1],
      [q('.cam-fg'), 1.2, 1.3],
    ] as [HTMLElement, number, number][],
  }
}
type Targets = ReturnType<typeof targets>

/** Every property a moment controls, as plain values per target. */
function frame(t: Targets, m: Moment, L: Layout) {
  const X = (x: number) => L.ox + x * L.u
  const Y = (y: number) => L.oy + y * L.u
  const out: [gsap.TweenTarget, gsap.TweenVars][] = [
    [t.paint, { skyTop: m.sky[0], skyMid: m.sky[1], skyBottom: m.sky[2], lights: m.lights }],
    [t.stars, { opacity: m.stars }],
    [t.sun, { x: X(m.sun.x), y: Y(m.sun.y), opacity: m.sun.o }],
    [t.moon, { x: X(m.moon.x), y: Y(m.moon.y), opacity: m.moon.o }],
    [t.clouds, { opacity: m.clouds.o }],
    [t.birds, { opacity: m.birds }],
    [t.warm, { opacity: m.warm }],
    [t.moonlit, { opacity: m.moonMix }],
    [t.rays, { x: X(m.sun.x), y: Y(m.sun.y), opacity: m.rays }],
    [t.bokeh, { opacity: m.bokeh }],
    [t.fireflies, { opacity: m.fireflies }],
    [t.vignette, { opacity: m.night * 0.7 }],
    [t.petals, { opacity: m.petals }],
  ]
  t.sunLooks.forEach((el, i) => out.push([el, { opacity: m.sunLook[i] }]))
  t.cloudLooks.forEach((el, i) => out.push([el, { opacity: m.clouds.look[i] }]))
  for (const [el, k, s] of t.cams) out.push([el, { y: m.camY * L.u * k, scale: 1 + (m.cam - 1) * s }])
  return out
}

/**
 * Scroll is the clock: each section is pinned to a moment of the day and the
 * garden blends between them as you pass. The order of the day lines up with
 * the light — ceremony in golden hour, cocktails at sunset, the string lights
 * come on for dinner, and the fireflies and stars arrive for dancing.
 */
export function setupDay(el: HTMLElement, reduced: boolean) {
  const root = document.documentElement
  const stage = mountStage(el)
  const t = targets(el)
  const place = () => {
    const L = stage.layout
    for (const [cam] of t.cams) gsap.set(cam, { transformOrigin: `50% ${L.h - 240 * L.u}px` })
    return L
  }
  for (const [target, vars] of frame(t, HERO, place())) gsap.set(target, vars)
  stage.update(t.paint)

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
    const L = place()
    const max = Math.max(1, root.scrollHeight - innerHeight)
    const centre = (el: HTMLElement) => {
      const top = el.getBoundingClientRect().top + scrollY
      return Math.min(1, Math.max(0, (top + el.offsetHeight / 2 - innerHeight / 2) / max))
    }
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: () => stage.update(t.paint) })
    let t0 = 0
    let from = HERO
    for (const [el, to] of stops) {
      if (!el) continue
      const at = centre(el)
      if (at > t0) {
        const a = frame(t, from, L)
        const b = frame(t, to, L)
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
  // The stage is sized to the large viewport, so a phone's toolbar sliding
  // away doesn't resize it; only a real change (rotation, a resized window)
  // repaints the scenery and re-places everything.
  let timer = 0
  addEventListener('resize', () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (!stage.refit()) return
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
    const layers = [...el.querySelectorAll<HTMLElement>('.px')].map((el) => {
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
