import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './ease'
import { heroTimeline, prepareHero } from './hero'
import { setupIntro } from './intro'
import { setupSections } from './sections'

gsap.registerPlugin(ScrollTrigger)

/** Petals only animate while their container is on screen. */
function livePetals() {
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('live', e.isIntersecting)),
  )
  document.querySelectorAll('.petals').forEach((p) => io.observe(p))
}

export function setupAnimations() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.toggle('reduced', reduced)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  let lenis: Lenis | null = null
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.12 })
    const l = lenis
    l.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => l.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    livePetals()
  }

  prepareHero(reduced)
  setupSections(reduced)
  setupIntro({ lenis, reduced, hero: () => heroTimeline(reduced) })

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger })
}
