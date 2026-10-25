import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setupDay } from './day'
import { heroTimeline, prepareHero } from './hero'
import { setupIntro } from './intro'
import { setupSections } from './sections'

gsap.registerPlugin(ScrollTrigger)

/** Petals only animate while they are on screen. */
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

  // Native scrolling is the shared playhead for the opening, scenery and details.
  ScrollTrigger.config({ ignoreMobileResize: true })
  if (!reduced) livePetals()

  prepareHero(reduced)
  const opening = setupIntro({ reduced, hero: () => heroTimeline(reduced) })
  setupDay(document.getElementById('stage')!, reduced, () => opening.end)
  setupSections(reduced)
  ScrollTrigger.refresh()

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger })
}
