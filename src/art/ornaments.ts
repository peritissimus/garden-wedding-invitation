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

/**
 * Line drawing of the mandap, drawn stroke by stroke: fan columns (a slim
 * cage flaring into a fluted fan) crowned with flowers, a chandelier hanging
 * between the front two, flowers heaped at their feet.
 */
export function venueArt() {
  const lines = ['M8 160H312']
  const fills: string[] = []
  const P = (x: number, y: number) => `${f(x)} ${f(y)}`
  const fill = (cls: string, d: string) => fills.push(`<path class="${cls}" d="${d}"/>`)
  const blooms = (pts: [number, number, number][]) => {
    lines.push(pts.map(([x, y, r]) => circle(x, y, r)).join(''))
    pts.forEach(([x, y, r], i) => fill(['blush', 'lilac', 'ivory'][i % 3], circle(x, y, r)))
  }
  const fan = (cx: number, ground: number, k: number) => {
    const waist = ground - 50 * k
    const top = waist - 56 * k
    const W = 36 * k
    lines.push(`M${P(cx - 6 * k, ground)}L${P(cx - 3 * k, waist)}M${P(cx, ground)}V${f(waist)}M${P(cx + 6 * k, ground)}L${P(cx + 3 * k, waist)}`)
    lines.push(ellipse(cx, waist + 2 * k, 5 * k, 1.6 * k))
    // the fan: sides bowing out like a trumpet, the rim a row of pointed petal tips
    const N = 7
    const rim = (u: number, dip: number) => [cx + u * W * 1.06, top + Math.abs(u) ** 1.5 * 12 * k + dip] as const
    const tips = Array.from({ length: N }, (_, i) => rim((i / (N - 1)) * 2 - 1, 0))
    const valleys = Array.from({ length: N - 1 }, (_, i) => rim(((i + 0.5) / (N - 1)) * 2 - 1, 4.5 * k))
    let d = `M${P(cx - 3 * k, waist)}Q${P(cx - W * 0.18, top + (waist - top) * 0.45)} ${P(...tips[0])}`
    // each petal's sides bulge a little, so the rim reads as soft pointed petals
    const arc = (a: readonly [number, number], b: readonly [number, number]) => `Q${P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 1.6 * k)} ${P(...b)}`
    valleys.forEach((v, i) => (d += arc(tips[i], v) + arc(v, tips[i + 1])))
    d += `Q${P(cx + W * 0.18, top + (waist - top) * 0.45)} ${P(cx + 3 * k, waist)}Z`
    lines.push(d)
    fill('fan', d)
    lines.push(valleys.map(([x, y]) => `M${P(cx + ((x - cx) / W) * 2 * k, waist)}Q${P(cx + (x - cx) * 0.25, top + (waist - top) * 0.45)} ${P(x, y)}`).join(''))
    // flowers on the rim, leaves tucked between
    const n = k > 0.9 ? 7 : 4
    blooms(
      Array.from({ length: n }, (_, i) => {
        const u = (i / (n - 1)) * 2 - 1
        return [cx + u * W * 0.82, top - 1.5 * k + Math.abs(u) ** 1.5 * 9 * k + (i % 2 ? -2.5 : 0.5) * k, (4.2 + (i % 3) * 0.6) * k] as [number, number, number]
      }),
    )
    if (k > 0.9) {
      const leaves = [-1, 1].map((m) => `<path class="sage" d="${leaf(9, 3)}" transform="translate(${P(cx + m * W * 0.9, top + 1)}) rotate(${m > 0 ? -25 : 205})"/>`)
      fills.push(...leaves)
      lines.push([-1, 1].map((m) => `M${P(cx + m * W * 0.9, top + 1)}l${P(m * 8, -3.5)}`).join(''))
    }
    // a heap of flowers at the foot
    blooms(
      k > 0.9
        ? [
            [cx - 7, ground - 5, 4.6],
            [cx + 6, ground - 6, 5],
            [cx, ground - 13, 4.2],
          ]
        : [
            [cx - 4, ground - 4, 3.4],
            [cx + 4, ground - 5, 3.6],
          ],
    )
    return top
  }
  for (const m of [-1, 1]) fan(160 + m * 114, 155, 0.74)
  const top = fan(112, 160, 1)
  fan(208, 160, 1)
  // the chandelier between the front fans, under a little bridge of flowers
  blooms([
    [152, top - 1, 3.6],
    [160, top - 4, 4.2],
    [168, top - 1, 3.6],
  ])
  lines.push(`M160 ${f(top + 2)}V78M150 84Q160 92 170 84Q160 80 150 84Z`)
  lines.push('M152 87.5V92M156 89V95M160 90V97M164 89V95M168 87.5V92')
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
