import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)]

/** Every reveal has a distance, not a timer. Clamp lets the final section finish before page end. */
function scrub(trigger: Element, animation: gsap.core.Animation, start = 'top 96%', end = 'top 60%', invalidateOnRefresh = false) {
  ScrollTrigger.create({ trigger, animation, start: `clamp(${start})`, end: `clamp(${end})`, scrub: true, invalidateOnRefresh })
}
const hideStroke = (els: Element[]) => gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1.001 })
const DRAW = { strokeDashoffset: 0, ease: 'none' }

export function setupSections(reduced: boolean) {
  // Accessible reading comes first: reduced motion leaves all the text and artwork visible.
  if (reduced) {
    document.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
    return
  }
  reveals()
  flourishes()
  wreath()
  dateMark()
  venue()
  rsvp()
  footer()
  events()
  if (!document.documentElement.classList.contains('ends-day')) {
    heart()
    shooting()
  }
}

function reveals() {
  $$('.card, .footer').forEach((block) => {
    const els = $$('.reveal', block)
    if (!els.length) return
    gsap.set(els, { autoAlpha: 0, y: 10 })
    scrub(block, gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09, ease: 'sine.out', paused: true }))
  })
}

function flourishes() {
  $$('.flourish').forEach((svg) => {
    const paths = $$('.draw', svg)
    const pop = $('.pop', svg)
    hideStroke(paths)
    gsap.set(pop, { scale: 0.8, autoAlpha: 0, transformOrigin: '50% 50%' })
    const tl = gsap.timeline({ paused: true })
      .to(pop, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'sine.out' }, 0)
      .to(paths, { ...DRAW, duration: 0.9, stagger: 0.05 }, 0.08)
    scrub(svg, tl)
  })
}

function wreath() {
  const svg = $('.wreath')
  if (!svg) return
  const leaves = $$<SVGElement>('.leaf', svg)
  const berries = $$<SVGElement>('.dot', svg)
  const mono = $('.wreath-mono', svg)
  const stems = $$('.stem', svg)
  hideStroke(stems)
  gsap.set(leaves, { scale: 0.6, autoAlpha: 0, transformOrigin: '0% 50%' })
  gsap.set(berries, { scale: 0.7, autoAlpha: 0, transformOrigin: '50% 50%' })
  gsap.set(mono, { autoAlpha: 0, y: 4 })
  const tl = gsap.timeline({ paused: true }).to(stems, { ...DRAW, duration: 1.1 }, 0)
  ;[...leaves, ...berries].forEach((el) => tl.to(el, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'sine.out' }, 0.08 + Number(el.dataset.t) * 0.95))
  tl.to(mono, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'sine.out' }, 0.3)
  scrub(svg, tl)
}

function dateMark() {
  const path = $('.circle-mark .draw')
  if (!path) return
  hideStroke([path])
  scrub(path.closest('h2')!, gsap.to(path, { ...DRAW, duration: 1, paused: true }))
}

function venue() {
  const svg = $('.venue-art')
  if (!svg) return
  const lines = $$('.v-lines path', svg)
  const fills = $$('.v-fill path', svg)
  hideStroke(lines)
  gsap.set(fills, { autoAlpha: 0 })
  const tl = gsap.timeline({ paused: true })
    .to(lines, { ...DRAW, duration: 0.8, stagger: 0.04 }, 0)
    .to(fills, { autoAlpha: 1, duration: 0.6, ease: 'sine.out', stagger: 0.05 }, 0.6)
  scrub(svg, tl, 'top 96%', 'top 48%')
}

function rsvp() {
  const art = $('.rsvp-art')
  if (!art) return
  const paths = $$('.draw', art)
  const heart = $('.heart', art)
  hideStroke(paths)
  gsap.set(heart, { y: 12, autoAlpha: 0 })
  const tl = gsap.timeline({ paused: true })
    .to(paths, { ...DRAW, duration: 0.7, stagger: 0.12 }, 0)
    .to(heart, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'sine.out' }, 0.35)
  scrub(art, tl)
}

function footer() {
  const names = $('.footer .ink')
  if (!names) return
  scrub(names, gsap.fromTo(names, { '--ink': '100%' }, { '--ink': '0%', duration: 1, ease: 'none', paused: true }))
}

function events() {
  for (const ev of $$('.event')) {
    const icon = $('.t-icon', ev)!
    const paths = $$('.draw', icon)
    hideStroke(paths)
    scrub(icon, gsap.to(paths, { ...DRAW, duration: 0.8, stagger: 0.08, paused: true }))
  }
}

/** Gather, hold and release are all reversible parts of the same scroll gesture. */
function heart() {
  const layer = $('#fireflies')!
  const rsvp = $('#rsvp')!
  const flies = $$('.ff', layer)
  const point = (i: number) => {
    const t = (i / flies.length) * Math.PI * 2
    const size = Math.min(innerWidth * 0.4, 330) / 32
    return {
      x: innerWidth / 2 + 16 * Math.sin(t) ** 3 * size,
      y: innerHeight * 0.2 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * size,
    }
  }
  const tl = gsap.timeline({ paused: true })
    .fromTo(flies, { x: 0, y: 0 }, {
      x: (i: number, ff: HTMLElement) => point(i).x - ff.offsetLeft,
      y: (i: number, ff: HTMLElement) => point(i).y - ff.offsetTop,
      duration: 0.38, stagger: 0.0015, ease: 'sine.inOut', immediateRender: false,
    }, 0)
    .to(flies, { x: 0, y: 0, duration: 0.28, stagger: 0.001, ease: 'sine.inOut' }, 0.72)
  scrub(rsvp, tl, 'top bottom', 'bottom top', true)
}

function shooting() {
  const stars = $$('.shooting i')
  const tl = gsap.timeline({ paused: true })
  stars.forEach((star, i) => {
    tl.fromTo(star, { x: 0, opacity: 0 }, { x: -460, duration: 1, ease: 'none' }, i * 0.6)
      .to(star, { opacity: 1, duration: 0.12, ease: 'none' }, i * 0.6)
      .to(star, { opacity: 0, duration: 0.55, ease: 'none' }, i * 0.6 + 0.45)
  })
  scrub($('#footer')!, tl, 'top bottom', 'bottom bottom')
}
