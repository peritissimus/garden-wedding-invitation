import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { C, RINGS } from '../art/rose'
import { TEMPO } from './tempo'

interface IntroOptions {
  reduced: boolean
  hero: () => gsap.core.Timeline
}

/** How tightly each ring is wound in the bud (outer → inner). */
const BUD = RINGS.map((_, k) => ({ scale: [0.29, 0.34, 0.4, 0.49, 0.62][k], rotation: 58 + k * 14 }))
/** Petals, leaves and sepals live in groups already moved to the centre, so they turn about their own 0,0. */
const LOCAL = '0 0'
/** The zoom group is not transformed, so it turns about the rose centre in SVG space. */
const ORIGIN = `${C} ${C}`

/**
 * Never hold the guest hostage: once the bloom is playing, a fresh scroll,
 * swipe, tap or key press plays the rest quickly. Wheel momentum from the
 * gesture that started it is ignored (it arrives without a pause).
 */
function hurryOnIntent(tl: gsap.core.Timeline, surface: HTMLElement) {
  const started = performance.now()
  let lastWheel = started
  const settled = () => performance.now() - started > 400
  const hurry = () => {
    tl.timeScale(4)
    stop()
  }
  const onWheel = () => {
    const now = performance.now()
    if (now - lastWheel > 250 && settled()) hurry()
    lastWheel = now
  }
  const onTouch = () => settled() && hurry()
  const onKey = (e: KeyboardEvent) => ['ArrowDown', 'PageDown', ' ', 'Enter', 'Escape'].includes(e.key) && hurry()
  window.addEventListener('wheel', onWheel, { passive: true })
  surface.addEventListener('touchstart', onTouch, { passive: true })
  surface.addEventListener('mousedown', onTouch)
  window.addEventListener('keydown', onKey)
  function stop() {
    window.removeEventListener('wheel', onWheel)
    surface.removeEventListener('touchstart', onTouch)
    surface.removeEventListener('mousedown', onTouch)
    window.removeEventListener('keydown', onKey)
  }
  return stop
}

/**
 * A single rosebud. Tapping it — or trying to scroll — makes it bloom ring by
 * ring from the outside in, then we fall into its golden heart; the light
 * becomes the afternoon sun over the garden where the day begins.
 */
export function setupIntro({ reduced, hero }: IntroOptions) {
  const root = document.documentElement
  const intro = document.getElementById('intro')!
  const seal = document.getElementById('seal') as HTMLButtonElement
  const wrap = intro.querySelector<HTMLElement>('.rose-wrap')!
  const rings = RINGS.map((_, k) => [...intro.querySelectorAll(`.rp[data-ring="${k}"]`)])

  // Lock scrolling; pad for the scrollbar we hide so nothing shifts on unlock.
  const gutter = window.innerWidth - root.clientWidth
  root.classList.add('is-locked')
  if (gutter > 0) document.body.style.paddingRight = `${gutter}px`

  if (!reduced) {
    rings.forEach((els, k) => gsap.set(els, { ...BUD[k], svgOrigin: LOCAL }))
    gsap.set('.rleaf', { scale: 0.5, svgOrigin: LOCAL })
    gsap.set('.rose-heart', { autoAlpha: 0 })
    // Arrival: the bud settles in, then the invitation line.
    gsap.from(wrap, { autoAlpha: 0, scale: 0.92, duration: 1.1 * TEMPO.opening, ease: 'emilOut' })
    gsap.from('.intro-copy > *', {
      y: 8,
      autoAlpha: 0,
      filter: 'blur(4px)',
      duration: 0.6 * TEMPO.opening,
      ease: 'emilOut',
      stagger: 0.08 * TEMPO.opening,
      delay: 0.35 * TEMPO.opening,
      clearProps: 'filter',
    })
  }

  let opened = false
  let touchY = 0
  let stopHurry = () => {}
  const onWheel = (e: WheelEvent) => e.deltaY > 2 && open()
  const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY)
  const onTouchMove = (e: TouchEvent) => touchY - e.touches[0].clientY > 16 && open()
  const onKey = (e: KeyboardEvent) => {
    if (e.target === seal || !['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) return
    e.preventDefault()
    open()
  }
  window.addEventListener('wheel', onWheel, { passive: true })
  intro.addEventListener('touchstart', onTouchStart, { passive: true })
  intro.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('keydown', onKey)
  seal.addEventListener('click', open)

  function detach() {
    window.removeEventListener('wheel', onWheel)
    intro.removeEventListener('touchstart', onTouchStart)
    intro.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('keydown', onKey)
    seal.removeEventListener('click', open)
  }

  function finish() {
    stopHurry()
    root.classList.remove('is-locked')
    document.body.style.paddingRight = ''
    root.classList.add('is-open')
    intro.hidden = true
    ScrollTrigger.refresh()
    document.querySelector<HTMLElement>('#hero h1')?.focus({ preventScroll: true })
  }

  function open() {
    if (opened) return
    opened = true
    detach()
    intro.classList.add('is-opening')
    const tl = gsap.timeline({ defaults: { ease: 'emilOut' } })

    if (reduced) {
      root.classList.add('show-stage')
      tl.to(intro, { autoAlpha: 0, duration: 0.5, ease: 'none' }, 0).add(hero(), 0).call(finish, [], 0.5)
      return
    }

    tl.to('.intro-copy', { autoAlpha: 0, y: 8, duration: 0.3 }, 0)
      // the bud gives under your finger, then blooms ring by ring from the outside in
      .to(wrap, { scale: 0.96, duration: 0.12, overwrite: 'auto' }, 0)
      .to(wrap, { scale: 1, duration: 0.5 }, 0.12)
      .to('.sepal', { scale: 1.3, autoAlpha: 0, duration: 0.7, svgOrigin: LOCAL }, 0.05)
      .to('.rleaf', { scale: 1, duration: 1.3, svgOrigin: LOCAL }, 0.05)
    rings.forEach((els, k) =>
      tl.to(els, { scale: 1, rotation: 0, duration: 1.15, stagger: 0.035, svgOrigin: LOCAL }, 0.12 + k * 0.16),
    )
    tl.to('.rose-heart', { autoAlpha: 1, duration: 0.6 }, 0.8)
      // fall into its golden heart — the light becomes the afternoon sun
      .to('.rose-zoom', { scale: 16, svgOrigin: ORIGIN, duration: 1.3, ease: 'power2.in' }, 1.3)
      .to('#intro-light', { autoAlpha: 1, scale: 1, duration: 0.75 }, 1.85)
      .call(() => root.classList.add('show-stage'), [], 2.2)
      .set(['.rose-wrap', '.intro-bg'], { autoAlpha: 0 }, 2.55)
      .to('#intro-light', { autoAlpha: 0, duration: 1.1 }, 2.6)
      .add(hero(), 2.5)
      .call(finish, [], 2.85)
      // written at brisk speed; TEMPO.opening sets the real pace
      .timeScale(1 / TEMPO.opening)
    stopHurry = hurryOnIntent(tl, intro)
  }
}
