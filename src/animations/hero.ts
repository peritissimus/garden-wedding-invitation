import { gsap } from 'gsap'
import { blur } from './tempo'

export function prepareHero(reduced: boolean) {
  const hero = document.getElementById('hero')!
  if (reduced) {
    hero.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
    gsap.set(hero.querySelectorAll('.h-in, .ink'), { autoAlpha: 0 })
    return
  }
  gsap.set(hero.querySelectorAll('.h-in'), { autoAlpha: 0, y: 8, ...blur(4) })
}

/**
 * Plays as the light clears: petals drift down from the bloom and the names
 * are written with a feathered ink wipe; supporting text settles in after.
 */
export function heroTimeline(reduced: boolean) {
  const hero = document.getElementById('hero')!
  const tl = gsap.timeline({ defaults: { ease: 'emilOut' } })
  const petals = document.querySelector('.stage .petals')
  tl.call(() => petals?.classList.add('shown'), [], 0)

  if (reduced) return tl.to(hero.querySelectorAll('.h-in, .ink'), { autoAlpha: 1, duration: 0.4, ease: 'none' }, 0)

  const settle = { autoAlpha: 1, y: 0, ...blur(0), duration: 0.6, clearProps: 'filter' }
  tl.to(hero.querySelector('.hero-copy > .eyebrow'), settle, 0.05)
  hero.querySelectorAll<HTMLElement>('.ink').forEach((el, i) => {
    tl.fromTo(
      el,
      { '--ink': '100%' },
      { '--ink': '0%', duration: 0.8, ease: 'power2.inOut', onComplete: () => el.classList.add('inked') },
      0.12 + i * 0.32,
    )
  })
  tl.to(hero.querySelector('.amp'), settle, 0.4)
  tl.to(hero.querySelectorAll('.h-late'), { ...settle, stagger: 0.08 }, 0.85)
  return tl
}
