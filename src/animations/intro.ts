import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { C, RINGS } from '../art/rose'
import { TEMPO } from './tempo'

interface IntroOptions {
  reduced: boolean
  hero: () => gsap.core.Timeline
}

const BUD = RINGS.map((_, k) => ({ scale: [0.29, 0.34, 0.4, 0.49, 0.62][k], rotation: 58 + k * 14 }))
const LOCAL = '0 0'
const ZOOM = 16
const glide = gsap.parseEase('sine.inOut')
// An even optical zoom: equal ratios of scale feel like equal distances.
const zoomEase = (t: number) => (ZOOM ** glide(t) - 1) / (ZOOM - 1)

/** Native scroll is the playhead, including the opening. Nothing locks or consumes input. */
export function setupIntro({ reduced, hero }: IntroOptions) {
  const root = document.documentElement
  const intro = document.getElementById('intro')!
  const heroSection = document.getElementById('hero')!
  const seal = document.getElementById('seal') as HTMLButtonElement
  const rings = RINGS.map((_, k) => [...intro.querySelectorAll(`.rp[data-ring="${k}"]`)])
  root.classList.add('has-intro')
  heroSection.inert = true

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } })
  if (reduced) {
    tl.to(intro, { autoAlpha: 0, duration: 1, ease: 'none' }, 0).add(hero(), 0)
  } else {
    rings.forEach((els, k) => gsap.set(els, { ...BUD[k], svgOrigin: LOCAL }))
    gsap.set('.rleaf', { scale: 0.5, svgOrigin: LOCAL })
    gsap.set('.rose-heart', { autoAlpha: 0 })
    tl.to('.intro-copy', { autoAlpha: 0, y: -8, duration: 0.45 }, 0)
      .to('.sepal', { scale: 1.3, autoAlpha: 0, duration: 0.8, svgOrigin: LOCAL }, 0)
      .to('.rleaf', { scale: 1, duration: 1.3, svgOrigin: LOCAL }, 0.05)
    rings.forEach((els, k) =>
      tl.to(els, { scale: 1, rotation: 0, duration: 1.15, stagger: 0.035, svgOrigin: LOCAL }, 0.08 + k * 0.16),
    )
    tl.to('.rose-heart', { autoAlpha: 1, duration: 0.6 }, 0.8)
      .to('.rose-zoom', { scale: ZOOM, svgOrigin: `${C} ${C}`, duration: 1.35, ease: zoomEase }, 1.35)
      .to('#intro-light', { autoAlpha: 1, scale: 1, duration: 0.7 }, 1.9)
      .to(['.rose-wrap', '.intro-bg'], { autoAlpha: 0, duration: 0.3 }, 2.4)
      .to('#intro-light', { autoAlpha: 0, duration: 0.65 }, 2.7)
      .to(intro, { autoAlpha: 0, duration: 0.25 }, 3.1)
      .add(hero(), 2.65)
  }

  const opening = ScrollTrigger.create({
    id: 'opening',
    trigger: heroSection,
    start: 'top top',
    end: () => `+=${heroSection.offsetHeight * (reduced ? 0.25 : TEMPO.opening)}`,
    pin: true,
    anticipatePin: 1,
    animation: tl,
    scrub: true,
    onUpdate: ({ progress }) => {
      root.classList.toggle('is-opening', progress > 0)
      root.classList.toggle('show-stage', reduced || progress > 0.5)
      intro.inert = progress >= 0.82
      heroSection.inert = progress < 0.82
    },
  })

  // Tapping is a convenience for guests who don't scroll. A fresh gesture always takes over.
  let travel: gsap.core.Tween | undefined
  const cancel = () => travel?.kill()
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('pointerdown', cancel, { passive: true })
  window.addEventListener('keydown', cancel)
  seal.addEventListener('click', () => {
    cancel()
    const cursor = { y: scrollY }
    travel = gsap.to(cursor, {
      y: opening.end,
      duration: reduced ? 0 : 2.2,
      ease: 'sine.inOut',
      onUpdate: () => window.scrollTo(0, cursor.y),
      onComplete: () => heroSection.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }),
    })
  })
  return opening
}
