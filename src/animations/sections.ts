import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TEMPO, slow } from './tempo'

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)]

/** Fire once, slightly before the element is fully in view, so nothing waits on the reader. */
const once = (trigger: Element, start: string, fn: () => void) => ScrollTrigger.create({ trigger, start, once: true, onEnter: fn })

/** Paths carry pathLength=1, so a single dash hides/reveals any of them. */
const hideStroke = (els: Element[]) => gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1.001 })
const DRAW = { strokeDashoffset: 0, ease: 'power2.inOut' }

export function setupSections(reduced: boolean) {
  document.documentElement.style.setProperty('--tempo', String(TEMPO.reveal))
  reveals(reduced)
  cards(reduced)
  if (reduced) {
    document.querySelectorAll('.ink').forEach((n) => n.classList.add('inked'))
    return
  }
  words()
  flourishes()
  wreath()
  dateMark()
  venue()
  palette()
  rsvp()
  footer()
  countUp()
  events()
  heart()
  shooting()
}

/** Headings, labels, buttons: 600ms strong ease-out, 12px + light blur, 60ms stagger. */
function reveals(reduced: boolean) {
  const els = $$('.reveal')
  gsap.set(els, reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 12, filter: 'blur(4px)' })
  ScrollTrigger.batch(els, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      slow(gsap.to(
        batch,
        reduced
          ? { autoAlpha: 1, duration: 0.3, ease: 'none', stagger: 0.04 }
          : { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'emilOut', stagger: 0.06, clearProps: 'filter,transform' },
      )),
  })
}

/** Love letter: words ink in left to right — the whole paragraph in under a second. */
function words() {
  const box = $('.words')
  if (!box) return
  const ws = $$('.word', box)
  gsap.set(ws, { autoAlpha: 0, y: 6, filter: 'blur(3px)' })
  once(box, 'top 88%', () =>
    slow(gsap.to(ws, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'emilOut', stagger: 0.018, clearProps: 'filter,transform' })),
  )
}

function flourishes() {
  $$('.flourish').forEach((svg) => {
    const paths = $$('.draw', svg)
    const pop = $('.pop', svg)
    hideStroke(paths)
    gsap.set(pop, { scale: 0.5, autoAlpha: 0, transformOrigin: '50% 50%' })
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
  gsap.set(leaves, { scale: 0.3, autoAlpha: 0, transformOrigin: '0% 50%' })
  gsap.set(berries, { scale: 0.5, autoAlpha: 0, transformOrigin: '50% 50%' })
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
  once(path.closest('h2')!, 'top 90%', () => slow(gsap.to(path, { ...DRAW, duration: 0.8, delay: 0.35 })))
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
  gsap.set(dots, { scale: 0.6, rotation: -25, autoAlpha: 0 })
  gsap.set(labels, { autoAlpha: 0, y: 4 })
  once(chips[0].parentElement!, 'top 90%', () => {
    slow(gsap.to(dots, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: 'emilOut', stagger: 0.06, clearProps: 'transform' }))
    slow(gsap.to(labels, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'emilOut', stagger: 0.06, delay: 0.15, clearProps: 'transform' }))
  })
}

function rsvp() {
  const section = $('#rsvp')
  if (!section) return
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

/** Countdown rolls up from zero once, then ticks normally. */
function countUp() {
  const el = $('#countdown')
  if (!el) return
  once(el, 'top 92%', () => {
    $$('strong', el).forEach((s, i) => {
      const target = Number(s.textContent) || 0
      const o = { v: 0 }
      slow(gsap.to(o, {
        v: target,
        duration: 1.1,
        delay: i * 0.06,
        ease: 'expo.out',
        onUpdate: () => (s.textContent = String(Math.round(o.v)).padStart(2, '0')),
      }))
    })
  })
}


/** Each card settles in as it arrives: a short rise and fade, never a wait. */
function cards(reduced: boolean) {
  for (const card of $$('main .card')) {
    gsap.set(card, reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 28, scale: 0.985 })
    once(card, 'top 90%', () =>
      slow(gsap.to(card, reduced ? { autoAlpha: 1, duration: 0.4, ease: 'none' } : { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'emilOut', clearProps: 'transform' })),
    )
  }
}

/** The order of the day: each moment's icon draws itself as its card arrives. */
function events() {
  for (const ev of $$('.event')) {
    const paths = $$('.t-icon .draw', ev)
    hideStroke(paths)
    once(ev, 'top 72%', () => slow(gsap.to(paths, { ...DRAW, duration: 0.8, stagger: 0.08, delay: 0.2 })))
  }
}

/** At the RSVP the fireflies gather into a heart in the night sky, and drift off again after. */
function heart() {
  const layer = $('#fireflies')
  const rsvp = $('#rsvp')
  if (!layer || !rsvp) return
  const flies = $$('.ff', layer)
  const gather = () => {
    const size = Math.min(innerWidth * 0.4, 330) / 32
    const cx = innerWidth / 2
    const cy = innerHeight * 0.2
    flies.forEach((ff, i) => {
      const t = (i / flies.length) * Math.PI * 2
      const hx = 16 * Math.sin(t) ** 3
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      gsap.to(ff, { x: cx + hx * size - ff.offsetLeft, y: cy + hy * size - ff.offsetTop, duration: 1.8, delay: i * 0.012, ease: 'emilInOut', overwrite: true })
    })
  }
  const scatter = () => gsap.to(flies, { x: 0, y: 0, duration: 1.6, ease: 'emilInOut', stagger: 0.008, overwrite: true })
  ScrollTrigger.create({ trigger: rsvp, start: 'top 60%', end: 'bottom 35%', onEnter: gather, onEnterBack: gather, onLeave: scatter, onLeaveBack: scatter })
}

/** A shooting star crosses the night sky when you reach the end. */
function shooting() {
  const sky = $('.shooting')
  const footer = $('#footer')
  if (!sky || !footer) return
  ScrollTrigger.create({
    trigger: footer,
    start: 'top 70%',
    onEnter: () => {
      sky.classList.remove('go')
      void sky.offsetWidth
      sky.classList.add('go')
    },
  })
}
