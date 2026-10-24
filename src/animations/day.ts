import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type Palette = Record<string, string | number>

/* The garden at five moments of the day. Numbers are scene units or 0–1 levels. */
const AFTERNOON: Palette = {
  '--sky-top': '#cfe3ec', '--sky-mid': '#f1ecdf', '--sky-bottom': '#fbefdc',
  '--sun': '#fff8e4', '--sun-glow': '#ffe9b8', '--sun-x': 1210, '--sun-y': 250,
  '--moon-x': 360, '--moon-y': 780, '--moon': 0, '--stars': 0,
  '--hill-far': '#bfd0c3', '--trees-far': '#a3b89f', '--trees': '#7f9a78', '--hedge': '#64845d', '--topiary': '#6f9066',
  '--lawn-a': '#a7c08a', '--lawn-b': '#86a66f', '--aisle': '#f6efe4', '--petal-a': '#efc6bd', '--petal-b': '#fbe9e4',
  '--chair': '#fffaf2', '--chair-shade': '#5a6a3c2e',
  '--wood': '#fffaf2', '--leaf': '#6f9064', '--rose-a': '#efc0b7', '--rose-b': '#f8ddd7', '--rose-swirl': '#c98a84',
  '--wire': '#7d7466', '--bulb': '#fbf3dc', '--lights': 0, '--lantern': '#5b5f55', '--glass': '#fdf6e6', '--flame': '#fbe6b0',
  '--fg': '#5f7d55', '--wild': '#fbf3ee', '--wild-c': '#e8c06a',
  '--cloud': '#ffffff', '--cloud-shade': '#e2ebf0', '--clouds': 0.85,
  '--night': 0, '--petals': 1, '--fireflies': 0, '--cam': 1, '--cam-y': 60,
}
/** The hero looks up at the sky; scrolling tilts the camera down onto the garden. */
const HERO: Palette = { ...AFTERNOON, '--cam': 0.94, '--cam-y': 280 }
const GOLDEN: Palette = {
  ...AFTERNOON,
  '--sky-top': '#f2d6b6', '--sky-mid': '#f9e6cc', '--sky-bottom': '#fde9c8',
  '--sun': '#ffe7a8', '--sun-glow': '#ffcf7c', '--sun-x': 1170, '--sun-y': 430,
  '--hill-far': '#cdbd9f', '--trees-far': '#b2a47c', '--trees': '#8f8c5f', '--hedge': '#717a4c', '--topiary': '#7c8552',
  '--lawn-a': '#b9b67a', '--lawn-b': '#9a9c60', '--aisle': '#f8e7cf', '--petal-a': '#f0bfae', '--petal-b': '#fbe2d6',
  '--chair': '#fff3e0', '--wood': '#fff2df', '--leaf': '#7a8a55', '--rose-a': '#f2b9a6', '--rose-b': '#f9d8c8',
  '--fg': '#6a7344', '--wild': '#fff1df', '--petals': 0.7, '--cam': 1.08, '--cam-y': 0,
  '--cloud': '#fff3e2', '--cloud-shade': '#f1d9bd', '--clouds': 0.8,
}
const SUNSET: Palette = {
  ...GOLDEN,
  '--sky-top': '#c98a9a', '--sky-mid': '#efa98f', '--sky-bottom': '#f8c79a',
  '--sun': '#ffc27c', '--sun-glow': '#ff9a6a', '--sun-x': 1120, '--sun-y': 640,
  '--hill-far': '#a98490', '--trees-far': '#8a6b74', '--trees': '#6c5560', '--hedge': '#5a4f52', '--topiary': '#63575a',
  '--lawn-a': '#8d7e6a', '--lawn-b': '#6f6452', '--aisle': '#efcab8', '--petal-a': '#e9a99c', '--petal-b': '#f6cfc2',
  '--chair': '#f7d8c9', '--chair-shade': '#3a28302e', '--wood': '#f6d6c6', '--leaf': '#6f6a4d', '--rose-a': '#ea9f95', '--rose-b': '#f4c4b8',
  '--wire': '#5a4c4c', '--bulb': '#fde6c2', '--lights': 0.25, '--glass': '#fde7c6',
  '--fg': '#4c3f40', '--wild': '#f6d6cc', '--night': 0.15, '--petals': 0.35, '--cam': 1.12,
  '--cloud': '#f6c2b2', '--cloud-shade': '#dc9e98', '--clouds': 0.75,
}
const DUSK: Palette = {
  ...SUNSET,
  '--sky-top': '#3d3f74', '--sky-mid': '#7a6390', '--sky-bottom': '#d6939a',
  '--sun': '#ff9e7a', '--sun-glow': '#f0807a', '--sun-x': 1080, '--sun-y': 760,
  '--moon-x': 380, '--moon-y': 380, '--moon': 0.6, '--stars': 0.35,
  '--hill-far': '#625f86', '--trees-far': '#4b4a6d', '--trees': '#393a58', '--hedge': '#30334c', '--topiary': '#363a55',
  '--lawn-a': '#46506a', '--lawn-b': '#343c54', '--aisle': '#a69bb4', '--petal-a': '#b98ea6', '--petal-b': '#d3b4c6',
  '--chair': '#cfc5dc', '--chair-shade': '#0a0c202e', '--wood': '#d2c9e0', '--leaf': '#3f4a57', '--rose-a': '#c88ea2', '--rose-b': '#dcb3c2', '--rose-swirl': '#8e5f74',
  '--wire': '#2a2a40', '--bulb': '#ffe3a1', '--lights': 1, '--lantern': '#22243a', '--glass': '#ffe0a0', '--flame': '#ffd27a',
  '--fg': '#262a40', '--wild': '#b9aecf', '--wild-c': '#d9b36e', '--night': 0.55, '--petals': 0, '--cam': 1.12,
  '--cloud': '#8a7fa8', '--cloud-shade': '#625a86', '--clouds': 0.45,
}
const NIGHT: Palette = {
  ...DUSK,
  '--sky-top': '#0c1230', '--sky-mid': '#1c2450', '--sky-bottom': '#3a3c6c',
  '--sun-x': 1060, '--sun-y': 900, '--moon-x': 400, '--moon-y': 200, '--moon': 1, '--stars': 1,
  '--hill-far': '#252c4e', '--trees-far': '#1d2342', '--trees': '#161b36', '--hedge': '#141a30', '--topiary': '#181e36',
  '--lawn-a': '#1e2840', '--lawn-b': '#141c30', '--aisle': '#565b7e', '--petal-a': '#7d6a8e', '--petal-b': '#958aa8',
  '--chair': '#8f93b2', '--wood': '#9ea1be', '--leaf': '#243042', '--rose-a': '#8a6a86', '--rose-b': '#a38aa2', '--rose-swirl': '#5d4560',
  '--fg': '#10152a', '--wild': '#7f7aa0', '--night': 1, '--fireflies': 1, '--cam': 1.1,
  '--cloud': '#2b3254', '--cloud-shade': '#1c2240', '--clouds': 0.2,
}

/**
 * Scroll is the clock: each section is pinned to a moment of the day and the
 * garden blends between them as you pass. The order of the day lines up with
 * the light — ceremony in golden hour, cocktails at sunset, the string lights
 * come on for dinner, and the fireflies and stars arrive for dancing.
 */
export function setupDay(stage: HTMLElement, reduced: boolean) {
  gsap.set(stage, HERO)
  const root = document.documentElement
  const events = [...document.querySelectorAll<HTMLElement>('.event')]
  const moments = [GOLDEN, SUNSET, DUSK, NIGHT]
  const stops: [HTMLElement | null, Palette][] = [
    [document.getElementById('story'), AFTERNOON],
    [document.getElementById('when'), GOLDEN],
    ...events.map((el, i): [HTMLElement, Palette] => [el, moments[Math.min(i, moments.length - 1)]]),
    [document.getElementById('footer'), NIGHT],
  ]

  let trigger: ScrollTrigger | null = null
  const build = () => {
    trigger?.kill()
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
      const t = centre(el)
      if (t > t0) tl.fromTo(stage, { ...from }, { ...to, duration: t - t0, immediateRender: false }, t0)
      t0 = Math.max(t0, t)
      from = to
    }
    if (t0 < 1) tl.to({}, { duration: 1 - t0 }, t0)
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

  // A little pointer parallax on desktop: deeper layers drift more.
  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const layers = [...stage.querySelectorAll<SVGGElement>('.px')].map((g) => {
      const depth = Number(g.dataset.depth)
      return {
        depth,
        x: gsap.quickTo(g, 'x', { duration: 1.2, ease: 'power3.out' }),
        y: gsap.quickTo(g, 'y', { duration: 1.2, ease: 'power3.out' }),
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
