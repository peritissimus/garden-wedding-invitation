import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { leaf } from '../art/util'
import { growFlora, prepareFlora } from './hero'
import { TOUCH, slow } from './tempo'

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)]

/** Fire once, slightly before the element is fully in view, so nothing waits on the reader. */
const once = (trigger: Element, start: string, fn: () => void) => ScrollTrigger.create({ trigger, start, once: true, onEnter: fn })

/** Paths carry pathLength=1, so a single dash hides/reveals any of them. */
const hideStroke = (els: Element[]) => gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1.001 })
const DRAW = { strokeDashoffset: 0, ease: 'power2.inOut' }

export function setupSections(reduced: boolean) {
  reveals(reduced)
  timeline(reduced)
  if (reduced) {
    document.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
    return
  }
  flourishes()
  wreath()
  dateMark()
  venue()
  palette()
  rsvp()
  footer()
  parallax()
}

/**
 * Text settles in over 300ms as it comes on screen — a fade and a few pixels
 * of rise — so it's done before you get to it. On touch screens, where a flick
 * outruns any fade, it is simply there.
 */
function reveals(reduced: boolean) {
  if (!reduced && TOUCH) return
  const els = $$('.reveal')
  gsap.set(els, reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 8 })
  ScrollTrigger.batch(els, {
    start: 'top bottom',
    once: true,
    onEnter: (batch) =>
      slow(gsap.to(
        batch,
        reduced
          ? { autoAlpha: 1, duration: 0.3, ease: 'emilOut', stagger: 0.04 }
          : { autoAlpha: 1, y: 0, duration: 0.3, ease: 'emilOut', stagger: 0.04, clearProps: 'transform' },
      )),
  })
}

function flourishes() {
  $$('.flourish').forEach((svg) => {
    const paths = $$('.draw', svg)
    const pop = $('.pop', svg)
    hideStroke(paths)
    gsap.set(pop, { scale: 0.8, autoAlpha: 0, transformOrigin: '50% 50%' })
    const tl = slow(gsap.timeline({ paused: true }))
      .to(pop, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'emilOut' }, 0)
      .to(paths, { ...DRAW, duration: 0.9, stagger: 0.05 }, 0.08)
    once(svg, 'top 94%', () => tl.play())
  })
}

function wreath() {
  const svg = $('.wreath')
  if (!svg) return
  const leaves = $$<SVGElement>('.leaf', svg)
  const berries = $$<SVGElement>('.dot', svg)
  const mono = $('.wreath-mono', svg)
  hideStroke($$('.stem', svg))
  // leaves unfurl from their stems rather than from nothing
  gsap.set(leaves, { scale: 0.6, autoAlpha: 0, transformOrigin: '0% 50%' })
  gsap.set(berries, { scale: 0.7, autoAlpha: 0, transformOrigin: '50% 50%' })
  gsap.set(mono, { autoAlpha: 0, y: 4 })
  const tl = slow(gsap.timeline({ paused: true })).to($$('.stem', svg), { ...DRAW, duration: 1.1 }, 0)
  ;[...leaves, ...berries].forEach((el) => tl.to(el, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'emilOut' }, 0.08 + Number(el.dataset.t) * 0.95))
  tl.to(mono, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'emilOut' }, 0.3)
  once(svg, 'top 88%', () => tl.play())
}

/** A pen loop circles the day, just after the heading lands. */
function dateMark() {
  const path = $('.circle-mark .draw')
  if (!path) return
  hideStroke([path])
  once(path.closest('h2')!, 'top 92%', () => slow(gsap.to(path, { ...DRAW, duration: 0.7 })))
}

/**
 * Order of the day: a vine grows down the timeline with the scroll (the only
 * scrubbed piece), sprouting leaves; each moment lights up as the vine
 * reaches it and its icon draws itself.
 */
function timeline(reduced: boolean) {
  const wrap = $('.timeline')
  if (!wrap) return
  const svg = $<SVGSVGElement>('.vine', wrap)!
  const items = $$('.t-item', wrap)
  let grow: SVGPathElement | null = null
  let growTo: ((v: number) => void) | null = null
  let leaves: SVGElement[] = []
  let marks: number[] = []

  const build = () => {
    const h = wrap.offsetHeight
    const x = 8
    let d = `M${x} 0`
    for (let y = 0, k = 0; y < h; y += 56, k++) d += `Q${x + (k % 2 ? 4.5 : -4.5)} ${y + 28} ${x} ${Math.min(h, y + 56)}`
    let ls = ''
    for (let y = 30, i = 0; y < h - 12; y += 38, i++) {
      ls += `<g transform="translate(${x} ${y}) rotate(${i % 2 ? -38 : 218})"><path class="vleaf" data-t="${(y / h).toFixed(3)}" d="${leaf(13, 3.6)}"/></g>`
    }
    svg.setAttribute('viewBox', `0 0 24 ${h}`)
    svg.style.height = `${h}px`
    svg.innerHTML = `<path class="vine-base" d="${d}"/><path class="vine-grow" pathLength="1" d="${d}"/>${ls}`
    grow = svg.querySelector('.vine-grow')
    growTo = grow && !reduced ? gsap.quickTo(grow, 'strokeDashoffset', { duration: 0.15, ease: 'power3.out' }) : null
    leaves = [...svg.querySelectorAll<SVGElement>('.vleaf')]
    marks = items.map((it) => (it.offsetTop + 19) / h)
  }

  const icons = (it: Element) => {
    if (!reduced) slow(gsap.to($$('.t-icon .draw', it), { ...DRAW, duration: 0.6, stagger: 0.06 }))
  }

  const update = (p: number) => {
    if (growTo) growTo(1 - p)
    else if (grow) grow.style.strokeDashoffset = String(1 - p)
    leaves.forEach((l) => l.classList.toggle('on', p >= Number(l.dataset.t)))
    items.forEach((it, i) => {
      const on = p >= marks[i] - 0.01
      it.classList.toggle('lit', on)
      if (on && !it.classList.contains('seen')) {
        it.classList.add('seen')
        icons(it)
      }
    })
  }

  build()
  if (!reduced) hideStroke($$('.t-icon .draw', wrap))
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 65%',
    end: 'bottom 65%',
    onUpdate: (s) => update(s.progress),
    onRefresh: (s) => {
      build()
      update(s.progress)
    },
  })
}

function venue() {
  const svg = $('.venue-art')
  if (!svg) return
  const lines = $$('.v-lines path', svg)
  const fills = $$('.v-fill path', svg)
  hideStroke(lines)
  gsap.set(fills, { autoAlpha: 0 })
  const tl = slow(gsap.timeline({ paused: true }))
   
    .to(lines, { ...DRAW, duration: 0.8, stagger: 0.04 }, 0)
    .to(fills, { autoAlpha: 1, duration: 0.6, ease: 'emilOut', stagger: 0.05 }, 0.6)
  once(svg, 'top 86%', () => tl.play())
}

/** Watercolour swatches bloom in like drops of pigment. */
function palette() {
  const chips = $$('.chip')
  if (!chips.length) return
  const dots = chips.map((c) => c.querySelector('.swatch')!)
  const labels = chips.map((c) => c.querySelector('span')!)
  gsap.set(dots, { scale: 0.85, rotation: -10, autoAlpha: 0 })
  gsap.set(labels, { autoAlpha: 0, y: 4 })
  once(chips[0].parentElement!, 'top 90%', () => {
    slow(gsap.to(dots, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: 'emilOut', stagger: 0.06, clearProps: 'transform' }))
    slow(gsap.to(labels, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'emilOut', stagger: 0.06, delay: 0.08, clearProps: 'transform' }))
  })
}

function rsvp() {
  const section = $('#rsvp')
  if (!section) return
  prepareFlora(section)
  once(section, 'top 70%', () => slow(growFlora(section)))

  const art = $('.rsvp-art', section)
  if (!art) return
  const paths = $$('.draw', art)
  const heart = $('.heart', art)
  hideStroke(paths)
  gsap.set(heart, { y: 14, autoAlpha: 0, transformOrigin: '50% 60%' })
  const tl = slow(gsap.timeline({ paused: true }))
   
    .to(paths, { ...DRAW, duration: 0.7, stagger: 0.12 }, 0)
    .to(heart, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'emilOut' }, 0.5)
    .to(heart, { scale: 1.12, duration: 0.16, ease: 'emilOut', yoyo: true, repeat: 1 }, 1.05)
  once(art, 'top 88%', () => tl.play())
}

function footer() {
  const names = $('.footer .ink')
  if (!names) return
  once(names, 'top 94%', () =>
    slow(gsap.fromTo(
      names,
      { '--ink': '100%' },
      { '--ink': '0%', duration: 0.9, ease: 'power2.inOut', onComplete: () => names.classList.add('inked') },
    )),
  )
}

/** Depth: botanical layers drift at different speeds; hero copy eases away. */
function parallax() {
  $$('.flora').forEach((svg) => {
    const section = svg.closest('section')
    if (!section) return
    const start = section.id === 'hero' ? 'top top' : 'top bottom'
    const layers: [string, number][] = [
      ['.layer-back', 24],
      ['.layer-mid', 48],
      ['.layer-front', 90],
    ]
    layers.forEach(([sel, y]) =>
      gsap.to($(sel, svg), { y, ease: 'none', scrollTrigger: { trigger: section, start, end: 'bottom top', scrub: true } }),
    )
  })
  gsap.to('.hero-copy', {
    yPercent: -10,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  })
}
