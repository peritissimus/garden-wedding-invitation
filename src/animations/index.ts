import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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

  // Native scrolling: no smooth-scroll library re-timing the guest's own input.
  if (!reduced) livePetals()

  prepareHero(reduced)
  setupSections(reduced)
  setupIntro({ reduced, hero: () => heroTimeline(reduced) })

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger })
}
