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
/** Top of the mandap's flowers and ferns, in scene units. */
const MANDAP_TOP = 492

/**
 * The hero, with the camera tilted up far enough that the mandap stays clear
 * of the names and date — on short, wide screens (a laptop) the text takes
 * up more of the height, so the garden has to sit lower.
 */
function heroFor(L: Layout, textBottom: number): Moment {
  const origin = L.h - 240 * L.u
  const mandap = origin + (L.oy + MANDAP_TOP * L.u - origin) * HERO.cam
  const lift = Math.max(HERO.camY * L.u, textBottom + 28 - mandap)
  return { ...HERO, camY: lift / L.u }
}
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

/** First light on a new day: the moon going down, a rosy sky, the lights switched off. */
const DAWN: Moment = {
  ...GOLDEN,
  sky: ['#9db3d8', '#f2cfc8', '#fde2c4'],
  sun: { x: 1150, y: 600, o: 1 },
  sunLook: [0, 0.4, 0.6],
  rays: 0.3,
  moon: { x: 420, y: 560, o: 0.35 },
  stars: 0.12,
  clouds: { o: 0.85, look: [0, 0.5, 0.5, 0, 0] },
  birds: 0.3,
  warm: 0.75,
  moonMix: 0.25,
  night: 0.12,
  petals: 0.4,
  cam: 1.06,
}

/** The day's light in order, for carrying on into the evening after the last celebration. */
const EVENING = [AFTERNOON, GOLDEN, SUNSET, DUSK, NIGHT]

/** The light at a celebration's real time of day (24h "HH:MM"). */
function lightAt(time: string): Moment {
  const [h, m] = time.split(':').map(Number)
  const hour = h + m / 60
  if (hour < 11) return GOLDEN // morning sun
  if (hour < 16) return AFTERNOON
  if (hour < 17.5) return GOLDEN
  if (hour < 18.5) return SUNSET
  if (hour < 19) return DUSK
  return NIGHT
}

function targets(stage: HTMLElement) {
  const q = (s: string) => stage.querySelector<HTMLElement>(s)!
  const qa = (s: string) => [...stage.querySelectorAll<HTMLElement>(s)]
  return {
    /** sky colours and lights, drawn onto canvases by the stage; `night` sets the cards' theme */
    paint: { skyTop: '', skyMid: '', skyBottom: '', lights: 0, night: 0 } as Sky & { night: number },
    stars: q('.stars'),
    sun: q('.sun'),
    sunLooks: qa('.sun .slot'),
    moon: q('.moon'),
    clouds: q('.clouds'),
    cloudLooks: qa('.cloud-band .slot'),
    birds: q('.birds'),
    butterflies: q('.butterflies'),
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
    [t.paint, { skyTop: m.sky[0], skyMid: m.sky[1], skyBottom: m.sky[2], lights: m.lights, night: m.night }],
    [t.stars, { opacity: m.stars }],
    [t.sun, { x: X(m.sun.x), y: Y(m.sun.y), opacity: m.sun.o }],
    [t.moon, { x: X(m.moon.x), y: Y(m.moon.y), opacity: m.moon.o }],
    [t.clouds, { opacity: m.clouds.o }],
    [t.birds, { opacity: m.birds }],
    [t.butterflies, { opacity: m.birds }],
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
 * garden blends between them as you pass. Each celebration gets the light of
 * its own hour — a morning haldi in golden sun, the string lights and
 * fireflies for an evening sangeet — and when the next one is on a new day,
 * dawn breaks in between. After the last one the day carries on into the
 * evening, so the fireflies can gather at the RSVP under the stars.
 */
export function setupDay(el: HTMLElement, reduced: boolean) {
  const root = document.documentElement
  const touch = matchMedia('(pointer: coarse)').matches
  const stage = mountStage(el)
  const t = targets(el)
  const place = () => {
    const L = stage.layout
    for (const [cam] of t.cams) gsap.set(cam, { transformOrigin: `50% ${L.h - 240 * L.u}px` })
    return L
  }
  /** Each frame: the sky and lights; after dark the stars and fairy lights twinkle and the fireflies wake. */
  const paint = () => {
    stage.update(t.paint)
    root.classList.toggle('is-dusk', t.paint.night > 0.4)
    root.classList.toggle('is-night', t.paint.night > 0.75)
  }
  /** How far down the hero's text reaches, scroll prompt included (it sits at the top of the page). */
  const heroText = () =>
    Math.max(0, ...['.hero .date-block', '.hero .scroll-cue'].map((s) => document.querySelector(s)?.getBoundingClientRect().bottom ?? 0)) + scrollY
  const setHero = (L: Layout) => {
    for (const [target, vars] of frame(t, heroFor(L, heroText()), L)) gsap.set(target, vars)
    paint()
  }
  setHero(place())

  const byId = (id: string) => document.getElementById(id)
  const events = [...document.querySelectorAll<HTMLElement>('.event')]
  /** where each moment falls: on a section, or part way between two (`t` of the way) */
  type Stop = { at: HTMLElement | { a: HTMLElement; b: HTMLElement; t: number } | null; m: Moment }
  const stops: Stop[] = [
    { at: byId('story'), m: AFTERNOON },
    { at: byId('when'), m: AFTERNOON },
  ]
  events.forEach((el, i) => {
    const m = lightAt(el.dataset.time ?? '12:00')
    const prev = events[i - 1]
    if (prev && prev.dataset.date !== el.dataset.date && stops[stops.length - 1].m.night > 0.3) stops.push({ at: { a: prev, b: el, t: 0.5 }, m: DAWN })
    stops.push({ at: el, m })
  })
  const last = EVENING.indexOf(stops[stops.length - 1].m)
  stops.push(
    { at: byId('venue'), m: EVENING[Math.min(last + 1, 4)] },
    { at: byId('attire'), m: EVENING[Math.min(last + 2, 4)] },
    { at: byId('rsvp'), m: NIGHT },
    { at: byId('footer'), m: NIGHT },
  )
  // Evening never jumps straight from day to night (the halfway mix is a flat grey): it goes
  // through sunset and dusk on the way, however short the scroll between the two.
  for (let i = stops.length - 1; i > 0; i--) {
    const [from, to] = [stops[i - 1], stops[i]]
    if (!(from.at instanceof HTMLElement && to.at instanceof HTMLElement) || from.m.night > 0.3 || to.m.night < 0.7) continue
    const [a, b] = [from.at, to.at]
    const between = from.m === SUNSET ? [{ t: 0.5, m: DUSK }] : [{ t: 1 / 3, m: SUNSET }, { t: 2 / 3, m: DUSK }]
    stops.splice(i, 0, ...between.map(({ t, m }) => ({ at: { a, b, t }, m })))
  }

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
    const position = (at: Stop['at']) => (at instanceof HTMLElement ? centre(at) : centre(at!.a) + (centre(at!.b) - centre(at!.a)) * at!.t)
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: paint })
    if (!progress) setHero(L)
    let t0 = 0
    let from = heroFor(L, heroText())
    for (const { at: where, m: to } of stops) {
      if (!where) continue
      const at = position(where)
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
    // the light eases after your scroll rather than snapping with it — on a phone, a flick
    // through two sections becomes a gentle change of light instead of a flash
    trigger = ScrollTrigger.create({ animation: tl, start: 0, end: 'max', scrub: reduced ? true : touch ? 1.6 : 1 })
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
