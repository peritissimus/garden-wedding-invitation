import type { IconName, ScheduleItem } from '../config'
import { circle, ellipse, f, leaf, rng } from './util'

/** A stroke that draws itself: pathLength=1 lets one dash cover every path. */
const draw = (d: string, attrs = '') => `<path class="draw" pathLength="1" d="${d}"${attrs}/>`

export const sprig = (cls: string) =>
  `<svg class="${cls}" viewBox="0 0 40 16" aria-hidden="true"><path d="M4 8h32"/><path d="M20 8c-2-4-6-6-9-5 2 3 5 5 9 5Zm0 0c2-4 6-6 9-5-2 3-5 5-9 5Z"/></svg>`

/** Symmetric vine flourish with a small blossom in the middle. */
export function flourish() {
  const half = [
    'M94 12C84 12 80 18 72 16C64 14 64 7 70 7C75 7 76 12 72 13',
    'M70 7C58 7 52 13 40 12C30 11 20 12 6 12',
    'M52 11.4C55 7 60 5 64 5.6C61 9 57 11 52 11.4Z',
    'M38 12.2C41 15.5 46 17 50 16.4C47 13.4 43 12.2 38 12.2Z',
  ]
    .map((d) => draw(d))
    .join('')
  const petals = [0, 90, 180, 270]
    .map((a) => `<path transform="rotate(${a})" d="M0 0C-2.2-2.6-1.6-6 0-6.4C1.6-6 2.2-2.6 0 0Z"/>`)
    .join('')
  return `<svg class="flourish" viewBox="0 0 200 24" aria-hidden="true"><g>${half}</g><g transform="matrix(-1 0 0 1 200 0)">${half}</g><g transform="translate(100 12)"><g class="pop">${petals}<circle r="1.2"/></g></g></svg>`
}

/** Laurel wreath around the couple's initials. */
export function wreath(a: string, b: string) {
  const cx = 100
  const cy = 100
  const R = 72

  const branch = (from: number, to: number, dir: 1 | -1) => {
    const steps = 40
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      const ang = ((from + (to - from) * t) * Math.PI) / 180
      const rr = R - t * 5
      return { x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr, tan: ang + (dir * Math.PI) / 2, t }
    })
    let s = `<path class="stem" pathLength="1" d="M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}"/>`
    for (let i = 2; i < steps; i += 2) {
      const p = pts[i]
      const side = (i / 2) % 2 ? 1 : -1
      const L = 17 * (1 - p.t * 0.45)
      const W = 4.8 * (1 - p.t * 0.35)
      const deg = ((p.tan + side * dir * 0.6) * 180) / Math.PI
      s += `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${Math.round(deg)})"><g class="leaf" data-t="${p.t.toFixed(3)}"><path d="${leaf(L, W)}" fill="url(#laurel)"/><path class="rib" d="M1.5 0H${f(L * 0.82)}"/></g></g>`
    }
    const tip = pts[steps]
    s += `<g transform="translate(${f(tip.x)} ${f(tip.y)}) rotate(${Math.round((tip.tan * 180) / Math.PI)})"><g class="leaf" data-t="1"><path d="${leaf(12, 3.4)}" fill="url(#laurel)"/></g></g>`
    for (const bt of [0.2, 0.45, 0.7]) {
      const p = pts[Math.round(bt * steps)]
      const ia = Math.atan2(cy - p.y, cx - p.x)
      s += `<g transform="translate(${f(p.x + Math.cos(ia) * 8)} ${f(p.y + Math.sin(ia) * 8)})"><g class="dot" data-t="${bt}"><circle r="2.6" fill="#dcb4a7"/><circle cx="-.8" cy="-.8" r=".8" fill="#f6e3dc"/></g></g>`
    }
    return s
  }

  return `<svg class="wreath" viewBox="0 0 200 200" aria-hidden="true">${branch(104, 250, 1)}${branch(76, -70, -1)}<g class="wreath-mono"><text x="100" y="113" text-anchor="middle">${a}<tspan class="wreath-amp" dx="5" dy="-3">&amp;</tspan><tspan dx="5" dy="3">${b}</tspan></text></g></svg>`
}

/** Hand-drawn loop that circles the wedding day. */
export const circleMark = () =>
  `<svg class="circle-mark" viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true">${draw(
    'M20 5.5C9 6.5 2.5 13 3.2 21c.8 9 12.5 14 27 13.2 14.8-.8 26.4-7.8 25.6-17C55 8.2 43 3 29 3.8 20 4.3 13.5 8 10.5 12.5',
  )}</svg>`

/** Line-art glasshouse with topiaries, drawn stroke by stroke. */
export function venueArt() {
  const lines = [
    'M6 150H314',
    'M104 150V94H216V150',
    'M98 94H222',
    'M100 94Q160 34 220 94',
    'M160 64V94M130 71.5Q133 82 134 94M190 71.5Q187 82 186 94',
    'M154 64V58H166V64M152 58H168M160 58V51',
    circle(160, 48.5, 2.5),
    'M122 94V150M140 94V150M180 94V150M198 94V150M104 116H146M174 116H216',
    'M148 150V126A12 12 0 0 1 172 126V150M160 114V150',
    'M60 150V112L104 100M74 150V108.2M88 150V104.4',
    'M260 150V112L216 100M246 150V108.2M232 150V104.4',
    'M40 150V128M280 150V128',
    circle(40, 114, 14),
    circle(280, 114, 14),
    'M33 150V142H47V150M273 150V142H287V150',
    'M6 150c2.5-6 7.5-6 10 0c2.5-6 7.5-6 10 0M294 150c2.5-6 7.5-6 10 0c2.5-6 7.5-6 10 0',
    'M152 150L138 170M168 150L182 170',
    'M58 40q4-4 8 0q4-4 8 0M244 30q3-3 6 0q3-3 6 0',
  ]
  const fills = [
    '<path class="glass" d="M100 94Q160 34 220 94Z"/>',
    '<path class="glass" d="M104 150V94H216V150Z"/>',
    '<path class="glass" d="M60 150V112L104 100V150Z"/>',
    '<path class="glass" d="M260 150V112L216 100V150Z"/>',
    `<path class="tree" d="${circle(40, 114, 14)}"/>`,
    `<path class="tree" d="${circle(280, 114, 14)}"/>`,
  ]
  return `<svg class="venue-art" viewBox="0 0 320 172" aria-hidden="true"><g class="v-fill">${fills.join('')}</g><g class="v-lines">${lines
    .map((d) => `<path pathLength="1" d="${d}"/>`)
    .join('')}</g></svg>`
}

/** A marigold head: a ring of small bulging arcs. */
function marigold(cx: number, cy: number, R: number, n: number) {
  const r = 2 * R * Math.sin(Math.PI / n) * 0.62
  let d = `M${f(cx + R)} ${f(cy)}`
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    d += `A${f(r)} ${f(r)} 0 0 1 ${f(cx + Math.cos(a) * R)} ${f(cy + Math.sin(a) * R)}`
  }
  return `${d}Z`
}

const ICONS: Record<IconName, string> = {
  rings: [circle(15.5, 24, 9), circle(24.5, 24, 9), 'M21.5 11.5 24.5 8l3 3.5-3 3.4z', 'M24.5 4.5V3M30 7l1-1M19 7l-1-1']
    .map((d) => draw(d))
    .join(''),
  glasses:
    `<g transform="rotate(-12 12 20)">${draw('M6 10h12c0 5.6-2.7 8.4-6 8.4S6 15.6 6 10Z')}${draw('M12 18.4V30M8.5 30h7')}</g>` +
    `<g transform="rotate(12 28 20)">${draw('M22 10h12c0 5.6-2.7 8.4-6 8.4S22 15.6 22 10Z')}${draw('M28 18.4V30M24.5 30h7')}</g>` +
    draw('M20 6V3M16 7l-1.6-1.6M24 7l1.6-1.6'),
  dinner: [circle(20, 21, 10), circle(20, 21, 6.5), 'M5 9v6.5a1.8 1.8 0 0 0 3.6 0V9M6.8 9v24', 'M34.5 9c-2.6 2.4-2.8 8.6 0 10.6V33']
    .map((d) => draw(d))
    .join(''),
  music:
    draw('M15.5 28.5V10.5L31 7.5v17') +
    draw('M15.5 15 31 12') +
    draw(ellipse(12, 28.8, 3.8, 2.9), ' transform="rotate(-20 12 28.8)"') +
    draw(ellipse(27.5, 25, 3.8, 2.9), ' transform="rotate(-20 27.5 25)"'),
  // a bowl of turmeric paste with a marigold and a drop of oil
  haldi: [
    'M6 22H34C34 29 28 34 20 34S6 29 6 22Z',
    'M4.5 22H35.5',
    'M10 22C12 17.5 28 17.5 30 22',
    marigold(20, 11, 5, 10),
    'M31 5.5c0 2-2 3-2 4.6a2 2 0 0 0 4 0c0-1.6-2-2.6-2-4.6Z',
  ]
    .map((d) => draw(d))
    .join(''),
  sprig: ['M20 35V8', 'M20 16c-4-1-7-4-7-8 4 0 7 3 7 8Zm0 0c4-1 7-4 7-8-4 0-7 3-7 8Z', 'M20 26c-4-1-7-4-7-8 4 0 7 3 7 8Zm0 0c4-1 7-4 7-8-4 0-7 3-7 8Z']
    .map((d) => draw(d))
    .join(''),
}

export function iconFor(item: ScheduleItem): IconName {
  if (item.icon) return item.icon
  const t = item.title.toLowerCase()
  if (/haldi|pithi|turmeric/.test(t)) return 'haldi'
  if (/ceremon|vow|church|wed|phera|nikah|vivah/.test(t)) return 'rings'
  if (/cocktail|drink|toast|champagne|aperitif/.test(t)) return 'glasses'
  if (/dinner|lunch|meal|breakfast|feast|supper/.test(t)) return 'dinner'
  if (/danc|party|music|band|dj|sangeet|garba/.test(t)) return 'music'
  return 'sprig'
}

export const icon = (item: ScheduleItem) =>
  `<svg class="t-icon t-reveal" viewBox="0 0 40 40" aria-hidden="true">${ICONS[iconFor(item)]}</svg>`

/** Open envelope; a heart rises out of it. */
export const rsvpArt = () =>
  `<svg class="rsvp-art" viewBox="0 0 80 64" aria-hidden="true">${draw('M10 24L40 6L70 24')}<path class="heart" d="M40 33c-2.6-5.4-11-4.6-11 1.8 0 5.4 11 11.2 11 11.2s11-5.8 11-11.2c0-6.4-8.4-7.2-11-1.8Z"/><path class="draw front" pathLength="1" d="M10 24V58H70V24L40 44Z"/></svg>`

/** Watercolour dot: displaced edge plus a darker rim, like pigment pooling. */
export const swatch = (color: string, i: number) =>
  `<svg class="swatch" viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#wc${i % 5})"><path d="${circle(30, 30, 21)}" fill="${color}"/><path d="${circle(30, 30, 21)}" fill="url(#wc-shade)"/></g></svg>`

/** Falling petals: CSS-only (transform/opacity), randomised but deterministic. */
export function petals(count: number, seed: number) {
  const r = rng(seed)
  return Array.from({ length: count }, () => {
    const dur = 11 + r() * 9
    const vars = [
      `--x:${f(r() * 100)}%`,
      `--size:${f(9 + r() * 11)}px`,
      `--dur:${f(dur)}s`,
      `--delay:${f(-r() * dur)}s`,
      `--sway:${f(18 + r() * 40)}px`,
      `--spin:${f(2.4 + r() * 2.6)}s`,
      `--o:${(0.55 + r() * 0.4).toFixed(2)}`,
    ].join(';')
    return `<span class="petal-track" style="${vars}"><span class="petal-sway"><svg viewBox="0 0 20 24"><path d="M10 23.5C3.4 19 .2 12.5 1.6 7.2 3 2 8.4.6 10 3.6 11.6.6 17 2 18.4 7.2 19.8 12.5 16.6 19 10 23.5Z" fill="url(#petal-fall)"/><path d="M10 22C9.4 16 9.6 9 10 4.6" fill="none" stroke="#d9ae9f" stroke-width=".5" opacity=".6"/></svg></span></span>`
  }).join('')
}
