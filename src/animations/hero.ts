import { gsap } from 'gsap'

const t = (el: Element) => Number((el as SVGElement).dataset.t ?? 0)

/** Hide every botanical part so it can be grown in later. */
export function prepareFlora(scope: ParentNode) {
  gsap.set(scope.querySelectorAll('.flora .stem'), { strokeDasharray: 1, strokeDashoffset: 1.001 })
  gsap.set(scope.querySelectorAll('.flora .leaf'), { scale: 0.3, autoAlpha: 0, transformOrigin: '0% 50%' })
  gsap.set(scope.querySelectorAll('.flora .dot, .flora .bloom-core'), { scale: 0.5, autoAlpha: 0, transformOrigin: '50% 50%' })
  gsap.set(scope.querySelectorAll('.flora .petal'), { scale: 0.4, rotation: -28, autoAlpha: 0, transformOrigin: '50% 100%' })
  gsap.set(scope.querySelectorAll('.flora .bud'), { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 100%' })
}

/** Stems draw, leaves sprout as the stem passes them, then roses unfurl. ~1.8s, decorative. */
export function growFlora(scope: ParentNode) {
  const tl = gsap.timeline({ defaults: { ease: 'emilOut' } })
  scope.querySelectorAll('.flora').forEach((svg, si) => {
    const t0 = si * 0.1
    svg.querySelectorAll('.branch').forEach((branch, bi) => {
      const start = t0 + bi * 0.07
      tl.to(branch.querySelectorAll('.stem'), { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, start)
      branch.querySelectorAll('.leaf, .dot').forEach((el) => {
        tl.to(el, { scale: 1, autoAlpha: 1, duration: 0.45 }, start + 0.12 + t(el))
      })
    })
    svg.querySelectorAll('.bloom').forEach((bloom, i) => {
      const at = t0 + 0.4 + i * 0.09
      tl.to(bloom.querySelectorAll('.petal'), { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.7, stagger: 0.012 }, at)
      tl.to(bloom.querySelectorAll('.bloom-core'), { scale: 1, autoAlpha: 1, duration: 0.4 }, at + 0.3)
    })
    tl.to(svg.querySelectorAll('.bud'), { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.08 }, t0 + 0.6)
  })
  return tl
}

export function prepareHero(reduced: boolean) {
  const hero = document.getElementById('hero')!
  if (reduced) {
    hero.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
    gsap.set(hero.querySelectorAll('.h-in, .ink'), { autoAlpha: 0 })
    return
  }
  gsap.set(hero.querySelectorAll('.h-in'), { autoAlpha: 0, y: 8, filter: 'blur(4px)' })
  prepareFlora(hero)
}

/**
 * Plays as the envelope clears. Names are "written" with a feathered ink
 * wipe; supporting text settles in with a short blur. All text is in by ~1.3s.
 */
export function heroTimeline(reduced: boolean) {
  const hero = document.getElementById('hero')!
  const tl = gsap.timeline({ defaults: { ease: 'emilOut' } })
  const petals = hero.querySelector('.petals')
  tl.call(() => petals?.classList.add('shown'), [], 0)

  if (reduced) return tl.to(hero.querySelectorAll('.h-in, .ink'), { autoAlpha: 1, duration: 0.4, ease: 'none' }, 0)

  const settle = { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, clearProps: 'filter' }
  tl.add(growFlora(hero), 0)
  tl.to(hero.querySelector('.hero-copy > .eyebrow'), settle, 0)
  hero.querySelectorAll<HTMLElement>('.ink').forEach((el, i) => {
    tl.fromTo(
      el,
      { '--ink': '100%' },
      { '--ink': '0%', duration: 0.7, ease: 'power2.inOut', onComplete: () => el.classList.add('inked') },
      0.08 + i * 0.28,
    )
  })
  tl.to(hero.querySelector('.amp'), settle, 0.32)
  tl.to(hero.querySelectorAll('.h-late'), { ...settle, stagger: 0.06 }, 0.72)
  return tl
}
