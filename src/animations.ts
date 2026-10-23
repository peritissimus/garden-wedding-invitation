import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!
const qa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)]

export function setupAnimations() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  const scrollToEl = (el: HTMLElement, duration = 3.2) => {
    if (lenis) lenis.scrollTo(el, { duration, easing: (t) => 1 - Math.pow(1 - t, 3.2) })
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  const hero = q('#hero')
  const seal = q<HTMLButtonElement>('#seal')
  seal.addEventListener('click', () => {
    gsap.fromTo(seal, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' })
    scrollToEl(hero)
  })
  q('#scroll-cue').addEventListener('click', () => scrollToEl(hero))

  if (reduced) {
    document.documentElement.classList.add('reduced')
    return
  }

  // ---------- 1. Envelope scene: scrubbed by scroll, auto-played by tapping the seal ----------
  const flap = q('#flap')
  const scene = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#scene', start: 'top top', end: '+=220%', scrub: 0.8, pin: '.scene-pin', anticipatePin: 1 },
  })
  scene
    .to('#scene-copy', { autoAlpha: 0, y: 30, duration: 0.12 }, 0)
    .to('#scroll-cue', { autoAlpha: 0, duration: 0.08 }, 0)
    .to(seal, { scale: 1.18, duration: 0.06, ease: 'power1.out' }, 0.02)
    .to(seal, { scale: 0.4, rotate: -25, autoAlpha: 0, duration: 0.1, ease: 'power2.in' }, 0.08)
    .to(flap, { rotateX: 180, duration: 0.26, ease: 'power2.inOut' }, 0.12)
    .set(flap, { zIndex: 0 }, 0.25)
    .to('#letter', { yPercent: -52, duration: 0.3, ease: 'power2.out' }, 0.36)
    .to('.envelope-wrap', { y: '14vh', duration: 0.3 }, 0.3)
    .to('.envelope .pocket, .envelope .env-back, #flap', { yPercent: 140, autoAlpha: 0, duration: 0.26, ease: 'power2.in' }, 0.66)
    .to('#letter', { yPercent: -10, scale: 1.3, duration: 0.26, ease: 'power2.inOut' }, 0.66)
    .to('.envelope-wrap', { y: '4vh', duration: 0.26, ease: 'power2.inOut' }, 0.66)
    .to('#letter', { autoAlpha: 0, scale: 1.6, duration: 0.12 }, 0.88)
    .to('.scene-bg', { backgroundColor: '#f2ece2', duration: 0.3 }, 0.7)

  // ---------- 2. Hero: names write in, florals grow and drift ----------
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top 55%', toggleActions: 'play none none reverse' } })
  heroTl
    .from('.flora-tl, .flora-br', { scale: 0.7, autoAlpha: 0, duration: 1.8, ease: 'expo.out', stagger: 0.1 })
    .from('.hero .hero-fade:first-child', { autoAlpha: 0, y: 16, duration: 0.9, ease: 'power3.out' }, 0.2)
    .from(qa('.name').map((n) => qa('.char', n)), {
      yPercent: 70, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1, ease: 'power3.out', stagger: 0.05,
    }, 0.35)
    .from('.hero .amp, .hero .hero-fade:not(:first-child)', { autoAlpha: 0, y: 16, duration: 1, ease: 'power3.out', stagger: 0.15 }, 0.9)

  qa('.flora').forEach((svg) => {
    const dir = svg.classList.contains('flora-br') ? -1 : 1
    const layers: [string, number][] = [['.layer-back', 30], ['.layer-mid', 60], ['.layer-front', 110]]
    layers.forEach(([sel, dist]) => {
      gsap.to(q(sel, svg), {
        y: dist * dir, ease: 'none',
        scrollTrigger: { trigger: svg.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
      })
    })
    gsap.to(qa('.bloom', svg), { rotate: 8, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 })
  })
  gsap.to('.hero-copy', {
    yPercent: -18, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true },
  })

  // ---------- 3. Generic reveals ----------
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  })

  // Love letter: words ink in as you scroll.
  gsap.fromTo('.word', { opacity: 0.12 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.words', start: 'top 80%', end: 'bottom 45%', scrub: true },
  })

  // Line art draws itself.
  qa<SVGPathElement>('.draw path').forEach((p) => {
    const len = p.getTotalLength()
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: p.closest('svg')!, start: 'top 95%', end: 'clamp(top 55%)', scrub: true },
    })
  })

  // Timeline: track fills and each moment lights up as the line reaches it.
  gsap.fromTo('.timeline-fill', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
  })
  qa('.t-item').forEach((item) => {
    gsap.from(item, {
      autoAlpha: 0, x: 24, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 75%', toggleActions: 'play none none reverse',
        onEnter: () => item.classList.add('lit'), onLeaveBack: () => item.classList.remove('lit'),
      },
    })
  })

  // Palette swatches pop in.
  gsap.from('.swatch', {
    scale: 0, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.08,
    scrollTrigger: { trigger: '.palette', start: 'top 88%' },
  })

  // Countdown digits roll in once.
  gsap.from('#countdown > div', {
    y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '#countdown', start: 'top 85%' },
  })

  // Re-measure once web fonts settle (they change text heights).
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}
