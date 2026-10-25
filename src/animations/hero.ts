import { gsap } from 'gsap'

export function prepareHero(reduced: boolean) {
  const hero = document.getElementById('hero')!
  gsap.set(hero.querySelectorAll('.h-in'), reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 8 })
  if (reduced) hero.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
}

/** Nested in the opening so the names are written at the guest's own pace, in either direction. */
export function heroTimeline(reduced: boolean) {
  const hero = document.getElementById('hero')!
  const tl = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
  if (reduced) return tl.to(hero.querySelectorAll('.h-in'), { autoAlpha: 1, duration: 1, ease: 'none' }, 0)
  const settle = { autoAlpha: 1, y: 0, duration: 0.5 }
  tl.to(hero.querySelector('.hero-copy > .eyebrow'), settle, 0)
  hero.querySelectorAll<HTMLElement>('.ink').forEach((el, i) => {
    tl.fromTo(el, { '--ink': '100%' }, { '--ink': '0%', duration: 0.85 }, 0.08 + i * 0.2)
  })
  tl.to(hero.querySelector('.amp'), settle, 0.3)
  tl.to(hero.querySelectorAll('.h-late'), { ...settle, stagger: 0.08 }, 0.65)
  return tl
}
