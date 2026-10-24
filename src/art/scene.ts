import { circle, f, rng, scallop } from './util'
import { petalPath } from './rose'

/**
 * The garden, painted in depth layers that share one coordinate system
 * (1600×1000, anchored bottom-centre with `slice`):
 *
 *   celestial  sky things: sun, moon, stars, the Milky Way        (no camera)
 *   back       hills, haze, glasshouse, trees, hedges, far lights  (camera ×0.5)
 *   front      lawn, aisle, chairs, urns, beds, the rose arch     (camera ×1)
 *   fg         out-of-focus roses framing the bottom corners      (camera ×1.25)
 *   glow*      the lights themselves — never colour-graded
 *   fx         sunbeams and night bokeh
 *
 * Each land layer is drawn once in daylight colours; the time of day is a
 * colour grade (CSS filter) on the whole layer, so scrolling never repaints
 * the artwork — only the GPU regrades it.
 */

export const VB = 'viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice"'
const AX = 800
const FOOT = 760 // where the arch stands
const VP = 744 // vanishing point of the lawn stripes and aisle

type Rand = () => number
const gauss = (r: Rand) => (r() + r() + r() + r() - 2) / 1.2

/** Rotate/translate helper producing absolute path points. */
const placer = (x: number, y: number, a: number) => (px: number, py: number) =>
  `${f(x + px * Math.cos(a) - py * Math.sin(a))} ${f(y + px * Math.sin(a) + py * Math.cos(a))}`

/** Almond leaf in absolute coordinates (so thousands of leaves can share one path per tone). */
function leafAt(x: number, y: number, L: number, W: number, a: number) {
  const P = placer(x, y, a)
  return `M${P(0, 0)}C${P(L * 0.3, -W)} ${P(L * 0.72, -W * 0.9)} ${P(L, 0)}C${P(L * 0.72, W * 0.9)} ${P(L * 0.3, W)} ${P(0, 0)}Z`
}

/** Garden rose facing us: four rings of the same petals as the opening rose. */
export function rosette(x: number, y: number, R: number, rot: number, tone: 'blush' | 'ivory' | 'peach') {
  const rings: [number, number, number][] = [
    [6, 1, 0],
    [5, 0.74, 30],
    [4, 0.5, 12],
    [3, 0.3, 50],
  ]
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`
  rings.forEach(([n, k, off], ri) => {
    for (let i = 0; i < n; i++)
      s += `<path d="${petalPath(R * k, R * k * 0.78)}" transform="rotate(${f(off + (i * 360) / n)}) translate(0 ${f(-R * 0.05 * (1 - k))})" fill="url(#ro-${tone}-${ri})"/>`
  })
  return `${s}<circle r="${f(R * 0.13)}" fill="url(#ro-${tone}-c)"/></g>`
}

/* ------------------------------------------------------------------ */
/* Celestial                                                          */
/* ------------------------------------------------------------------ */

export function celestial() {
  const r = rng(5)
  const groups = ['', '', '']
  for (let i = 0; i < 150; i++) groups[i % 3] += `<circle cx="${f(r() * 1600)}" cy="${f(r() * 620)}" r="${f(0.5 + r() * 1.3)}"/>`
  let milky = ''
  for (let i = 0; i < 320; i++) {
    const t = r()
    milky += `<circle cx="${f(60 + 1480 * t + gauss(r) * 20)}" cy="${f(560 - 470 * t + gauss(r) * 46)}" r="${f(0.35 + r() * 0.7)}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`
  }
  const v = (name: string) => `style="stop-color:var(--${name})"`
  return `<svg class="layer celestial" ${VB} aria-hidden="true">
<defs>
<radialGradient id="sunGlow"><stop offset="0" ${v('sun-glow')} stop-opacity=".95"/><stop offset=".3" ${v('sun-glow')} stop-opacity=".38"/><stop offset="1" ${v('sun-glow')} stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".45"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>
<radialGradient id="milkyGlow"><stop offset="0" stop-color="#d9defa" stop-opacity=".16"/><stop offset=".6" stop-color="#c6cdf2" stop-opacity=".06"/><stop offset="1" stop-color="#c6cdf2" stop-opacity="0"/></radialGradient>
<linearGradient id="cloudG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ${v('cloud-top')}/><stop offset="1" ${v('cloud-bottom')}/></linearGradient>
<filter id="cloudSoft" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>
<g class="night-sky"><ellipse cx="800" cy="300" rx="860" ry="120" transform="rotate(-17 800 300)" fill="url(#milkyGlow)"/><g class="milky">${milky}</g>${groups
    .map((g, i) => `<g class="twinkle t${i}">${g}</g>`)
    .join('')}</g>
<g class="moon"><circle r="210" fill="url(#moonGlow)"/><circle r="30" fill="#f7f3ea"/><circle cx="-9" cy="-6" r="5.5" fill="#e4dece" opacity=".7"/><circle cx="10" cy="9" r="3.6" fill="#e4dece" opacity=".6"/><circle cx="6" cy="-13" r="2.4" fill="#e4dece" opacity=".6"/></g>
<g class="sun"><circle r="360" fill="url(#sunGlow)"/><circle class="sun-disc" r="54"/></g>
</svg>`
}

/** Painterly cumulus: lobes each shaded top-lit, softly blurred. Each cloud is its own drifting element. */
export function clouds() {
  const r = rng(17)
  const lobes = () => {
    const base = `<ellipse cx="10" cy="22" rx="150" ry="22"/>`
    const puffs = Array.from({ length: 9 }, (_, i) => {
      const x = -120 + i * 30 + (r() - 0.5) * 16
      const rr = 26 + Math.sin((i / 8) * Math.PI) * 30 + r() * 10
      return `<ellipse cx="${f(x)}" cy="${f(14 - rr * 0.55)}" rx="${f(rr)}" ry="${f(rr * 0.82)}"/>`
    }).join('')
    return `<g filter="url(#cloudSoft)" fill="url(#cloudG)">${base}${puffs}</g>`
  }
  const spots: [number, number, number][] = [
    [8, 9, 300],
    [36, 4, 220],
    [58, 22, 180],
    [80, 8, 260],
    [94, 26, 160],
  ]
  return spots
    .map(
      ([x, y, w], i) =>
        `<div class="cloud c${i}" style="left:${x}%;top:${y}%;width:${w}px"><svg viewBox="-180 -90 360 140" aria-hidden="true">${lobes()}</svg></div>`,
    )
    .join('')
}

/* ------------------------------------------------------------------ */
/* Back: hills, haze, glasshouse, trees, hedges                       */
/* ------------------------------------------------------------------ */

/**
 * Broadleaf tree: a canopy of many small leaf clusters, each shaded by how much
 * it faces the light (upper right) — shadow underneath, lit crown on top —
 * so it reads as foliage rather than a cloud of dots.
 */
function oak(r: Rand, x: number, ground: number, R0: number, tones: string[]) {
  const trunkH = R0 * 0.5
  const cy = ground - trunkH - R0 * 0.72
  const clusters = Array.from({ length: 46 }, () => {
    const a = r() * Math.PI * 2
    const d = Math.pow(r(), 0.6)
    const wob = 0.82 + 0.18 * Math.sin(a * 3 + R0)
    const px = x + Math.cos(a) * d * R0 * wob
    const py = cy + Math.sin(a) * d * R0 * 0.78 * wob
    const light = ((px - x) / R0) * 0.55 + ((cy - py) / R0) * 0.8 + (r() - 0.5) * 0.35
    return { px, py, pr: R0 * (0.14 + r() * 0.16), light }
  })
  const pass = (min: number, k: number, dx: number, dy: number) =>
    clusters
      .filter((c) => c.light > min)
      .map((c) => circle(c.px + dx, c.py + dy, c.pr * k))
      .join('')
  const trunk = `M${f(x - R0 * 0.07)} ${f(ground)}C${f(x - R0 * 0.04)} ${f(ground - trunkH * 0.6)} ${f(x - R0 * 0.12)} ${f(ground - trunkH)} ${f(x - R0 * 0.2)} ${f(cy + R0 * 0.36)}L${f(x + R0 * 0.18)} ${f(cy + R0 * 0.36)}C${f(x + R0 * 0.09)} ${f(ground - trunkH)} ${f(x + R0 * 0.05)} ${f(ground - trunkH * 0.6)} ${f(x + R0 * 0.08)} ${f(ground)}Z`
  return (
    `<path d="${trunk}" fill="#55463a"/>` +
    `<path d="${pass(-9, 1.25, 0, R0 * 0.04)}" fill="${tones[0]}"/>` +
    `<path d="${pass(-0.35, 1.05, R0 * 0.02, -R0 * 0.02)}" fill="${tones[1]}"/>` +
    `<path d="${pass(0.15, 0.85, R0 * 0.04, -R0 * 0.05)}" fill="${tones[2]}"/>` +
    `<path d="${pass(0.6, 0.6, R0 * 0.06, -R0 * 0.08)}" fill="${tones[3]}"/>`
  )
}

function poplar(x: number, ground: number, w: number, h: number) {
  const n = 11
  const left = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const hw = (w / 2) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.55) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, t * 1.6)))
    return [x - hw, ground - h * t] as const
  })
  const right = [...left].reverse().map(([lx, ly]) => [2 * x - lx, ly] as const)
  const d = `M${f(left[0][0])} ${f(left[0][1])}${scallop(left, 0.62)}L${f(right[0][0])} ${f(right[0][1])}${scallop(right, 0.62)}Z`
  return `<path d="${d}" fill="url(#poplarG)"/><path d="M${f(x + w * 0.08)} ${f(ground - h * 0.12)}Q${f(x + w * 0.26)} ${f(ground - h * 0.55)} ${f(x + w * 0.02)} ${f(ground - h * 0.92)}" fill="none" stroke="#9fbd8a" stroke-width="${f(w * 0.12)}" stroke-linecap="round" opacity=".35"/>`
}

function glasshouse(x: number, ground: number) {
  const frame = '#fbf8f1'
  let mullions = ''
  for (let mx = x - 46; mx <= x + 46; mx += 9.2) mullions += `M${f(mx)} ${ground - 36}V${ground - 8}`
  return `<g class="glasshouse">
<path d="M${x - 66} ${ground}V${ground - 8}H${x + 66}V${ground}Z" fill="#e9e3d6"/>
<path d="M${x - 50} ${ground - 8}V${ground - 36}H${x + 50}V${ground - 8}Z" fill="url(#glassG)"/>
<path d="M${x - 70} ${ground - 8}V${ground - 24}H${x - 50}V${ground - 8}ZM${x + 50} ${ground - 8}V${ground - 24}H${x + 70}V${ground - 8}Z" fill="url(#glassG)"/>
<path d="M${x - 54} ${ground - 36}Q${x} ${ground - 70} ${x + 54} ${ground - 36}Z" fill="url(#glassG)"/>
<path d="M${x - 8} ${ground - 60}V${ground - 68}H${x + 8}V${ground - 60}ZM${x - 9} ${ground - 68}Q${x} ${ground - 80} ${x + 9} ${ground - 68}Z" fill="${frame}"/>
<path d="${mullions}M${x - 50} ${ground - 22}H${x + 50}M${x - 54} ${ground - 36}H${x + 54}M${x} ${ground - 63}V${ground - 36}M${x - 27} ${ground - 55}V${ground - 36}M${x + 27} ${ground - 55}V${ground - 36}M${x - 70} ${ground - 24}H${x - 50}M${x + 50} ${ground - 24}H${x + 70}" fill="none" stroke="${frame}" stroke-width="1.6"/>
</g>`
}

/** Bulb positions along a sagging strand; i runs 0→1 from the start, so they can light in sequence. */
function strand(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number, i0: number, span: number) {
  const bulbs: { x: number; y: number; i: number }[] = []
  for (let k = 1; k < n; k++) {
    const t = k / n
    bulbs.push({
      x: (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
      y: (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 6,
      i: i0 + t * span,
    })
  }
  return { wire: `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`, bulbs }
}
const bulbBodies = (bs: { x: number; y: number }[]) =>
  bs.map((b) => `M${f(b.x - 1.5)} ${f(b.y - 6.5)}h3v3h-3Z${circle(b.x, b.y, 3.6)}`).join('')
const bulbGlows = (bs: { x: number; y: number; i: number }[], r = 22) =>
  bs
    .map((b) => `<g class="lg" style="--i:${b.i.toFixed(3)}"><circle cx="${f(b.x)}" cy="${f(b.y)}" r="${r}" fill="url(#bulbGlow)"/><circle cx="${f(b.x)}" cy="${f(b.y)}" r="3.4" fill="#fff3c9"/></g>`)
    .join('')

const BACK_STRAND = strand(250, 432, AX, 560, 1350, 432, 22, 0.1, 0.5)

export function backLayer() {
  const r = rng(9)
  const tones = ['#4d6a48', '#62825a', '#789868', '#8fae79']
  const hazy = ['#8fa69a', '#9cb2a4', '#abc0b1', '#b9cdbd']
  // distant woodland: soft clumps on the second ridge
  let woods = ''
  for (let x = -40; x < 1660; x += 26 + r() * 30) {
    const y = 640 + Math.sin(x / 210) * 10 + (r() - 0.5) * 8
    if (x > 1150 && x < 1330) continue // keep the glasshouse clear
    woods += oak(r, x, y + 18, 16 + r() * 14, hazy)
  }
  // the treeline proper: oaks and poplars, smaller behind the arch so it reads against the sky
  let trees = ''
  let x = -60
  while (x < 1680) {
    const behindArch = x > 640 && x < 960
    if (!behindArch && r() < 0.3) {
      trees += poplar(x, 744, 34 + r() * 16, 170 + r() * 80)
      x += 34 + r() * 24
    } else {
      const R0 = behindArch ? 34 + r() * 12 : 52 + r() * 40
      trees += oak(r, x, 748, R0, tones)
      x += R0 * (1.1 + r() * 0.5)
    }
  }
  // clipped hedges framing the lawn, with a little leaf texture
  const hedge = (x0: number, x1: number) =>
    `M${x0} 812V738C${x0} 730 ${x0 + 6} 726 ${x0 + 14} 726H${x1 - 14}C${x1 - 6} 726 ${x1} 730 ${x1} 738V812Z`
  const hedges = hedge(-40, 652) + hedge(948, 1640)
  return `<svg class="layer land back" ${VB} aria-hidden="true">
<defs>
<linearGradient id="ridgeA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d9d9"/><stop offset="1" stop-color="#b6c9c3"/></linearGradient>
<linearGradient id="ridgeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2c6b3"/><stop offset="1" stop-color="#9eb49e"/></linearGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="poplarG" x1="0" x2="1"><stop offset="0" stop-color="#4c6a45"/><stop offset=".55" stop-color="#6c8c5b"/><stop offset="1" stop-color="#8aa975"/></linearGradient>
<linearGradient id="hedgeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db07a"/><stop offset=".35" stop-color="#6f925f"/><stop offset="1" stop-color="#4a6643"/></linearGradient>
<pattern id="hedgeTex" width="14" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#fff" opacity=".07"/><circle cx="10" cy="8" r="2.6" fill="#000" opacity=".06"/><circle cx="12" cy="2" r="1.6" fill="#fff" opacity=".05"/></pattern>
<linearGradient id="glassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6eff0"/><stop offset="1" stop-color="#bccdd0"/></linearGradient>
</defs>
<g id="art-back"><path d="M-40 640C120 596 300 588 470 612C620 634 720 600 870 588C1030 576 1160 626 1310 612C1440 600 1540 606 1640 618V1000H-40Z" fill="url(#ridgeA)"/>
<rect x="-40" y="560" width="1680" height="140" fill="url(#haze)" opacity=".7"/>
<path d="M-40 668C160 640 360 632 560 648C720 660 860 640 1000 634C1140 628 1300 654 1460 646C1540 642 1600 646 1640 650V1000H-40Z" fill="url(#ridgeB)"/>
<g class="woods">${woods}</g>
${glasshouse(1240, 660)}
<rect x="-40" y="610" width="1680" height="110" fill="url(#haze)" opacity=".45"/>
<g class="trees">${trees}</g>
<rect x="-40" y="690" width="1680" height="60" fill="url(#haze)" opacity=".35"/>
<path class="wire" d="${BACK_STRAND.wire}"/><path class="bulb" d="${bulbBodies(BACK_STRAND.bulbs)}"/>
<path d="${hedges}" fill="url(#hedgeG)"/><path d="${hedges}" fill="url(#hedgeTex)"/>
<path d="M-26 727H638M962 727H1626" fill="none" stroke="#b3cc9b" stroke-width="2" stroke-linecap="round" opacity=".7"/>
</g>
</svg>`
}

/* ------------------------------------------------------------------ */
/* Front: lawn, aisle, chairs, beds, urns, lanterns, the rose arch    */
/* ------------------------------------------------------------------ */

const ROSE_TONES = {
  blush: [['#e3a5a0', '#fbe6e1'], ['#d99491', '#f6d4cf'], ['#cf8486', '#efc3bf'], ['#c27478', '#e6aeb0'], '#b9686f'],
  ivory: [['#e6d9c6', '#fffbf4'], ['#dfcfb8', '#fdf5e9'], ['#d6c4aa', '#f8eddd'], ['#ccb89b', '#f1e3cf'], '#c4ad8a'],
  peach: [['#eab08f', '#fde6d6'], ['#e3a183', '#f9d8c3'], ['#db9377', '#f3c8af'], ['#d0846a', '#ecb69b'], '#c4775e'],
} as const

const roseDefs = () =>
  Object.entries(ROSE_TONES)
    .map(([tone, v]) => {
      const rings = (v.slice(0, 4) as unknown as [string, string][])
        .map(([a, b], i) => `<linearGradient id="ro-${tone}-${i}" x1="0" y1="1" x2="0" y2="0"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`)
        .join('')
      return `${rings}<radialGradient id="ro-${tone}-c"><stop stop-color="#f6d98c"/><stop offset="1" stop-color="${v[4]}"/></radialGradient>`
    })
    .join('')

const hwAt = (y: number) => 16 + ((y - FOOT) / 244) * 244 // aisle half-width
const scaleAt = (y: number) => 0.32 + ((y - 770) / 230) * 0.98

/** Chiavari chair seen from behind, with an optional blush sash and bow. */
function chair(x: number, y: number, s: number, sash: boolean) {
  const P = (dx: number, dy: number) => `${f(x + dx * s)} ${f(y - dy * s)}`
  let d = ''
  for (const side of [-1, 1]) {
    d += `M${P(side * 12, 0)}L${P(side * 11.3, 50)}Q${P(side * 11, 54)} ${P(side * 9, 53.4)}L${P(side * 9.2, 0)}Z` // back legs → posts
    d += `M${P(side * 8.6, 0)}L${P(side * 8.2, 22)}L${P(side * 6.8, 22)}L${P(side * 7.2, 0)}Z` // front legs
  }
  d += `M${P(-11, 52)}C${P(-5, 54.5)} ${P(5, 54.5)} ${P(11, 52)}L${P(11, 48.5)}C${P(5, 51)} ${P(-5, 51)} ${P(-11, 48.5)}Z` // top rail
  d += `M${P(-11, 41)}H${f(x + 11 * s)}V${f(y - 39.4 * s)}H${f(x - 11 * s)}Z` // middle rails
  d += `M${P(-11, 32)}H${f(x + 11 * s)}V${f(y - 30.4 * s)}H${f(x - 11 * s)}Z`
  d += `M${P(-4.5, 49)}H${f(x - 3 * s)}V${f(y - 32 * s)}H${f(x - 4.5 * s)}ZM${P(3, 49)}H${f(x + 4.5 * s)}V${f(y - 32 * s)}H${f(x + 3 * s)}Z` // spindles
  d += `M${P(-12.6, 25.5)}H${f(x + 12.6 * s)}V${f(y - 22 * s)}H${f(x - 12.6 * s)}Z` // seat edge
  d += `M${P(-11, 10)}H${f(x + 11 * s)}V${f(y - 8.8 * s)}H${f(x - 11 * s)}Z` // stretcher
  const shadow = `<path d="M${P(-12, 0)}L${P(12, 0)}L${P(-30, -5)}L${P(-58, -5)}Z" fill="#2c3a22" opacity=".09"/><ellipse cx="${f(x - 3 * s)}" cy="${f(y + 1)}" rx="${f(17 * s)}" ry="${f(2.8 * s)}" fill="#2c3a22" opacity=".14"/>`
  const bow = sash
    ? `<path d="M${P(-11.5, 38)}H${f(x + 11.5 * s)}V${f(y - 34 * s)}H${f(x - 11.5 * s)}Z" fill="url(#sashG)"/>` +
      `<path d="M${P(0, 36)}C${P(-6, 42)} ${P(-11, 39)} ${P(-9, 34.5)}C${P(-7, 31)} ${P(-3, 33)} ${P(0, 36)}ZM${P(0, 36)}C${P(6, 42)} ${P(11, 39)} ${P(9, 34.5)}C${P(7, 31)} ${P(3, 33)} ${P(0, 36)}Z" fill="url(#sashG)"/>` +
      `<path d="M${P(-1, 35)}C${P(-3, 28)} ${P(-5, 22)} ${P(-4, 16)}L${P(-2.4, 16.5)}C${P(-3, 22)} ${P(-1.5, 28)} ${P(0.6, 35)}ZM${P(1, 35)}C${P(3, 28)} ${P(4.5, 23)} ${P(5.5, 17)}L${P(7, 17.6)}C${P(5.6, 23)} ${P(3.6, 28)} ${P(1.6, 35)}Z" fill="#d79a9a"/>` +
      `<circle cx="${f(x)}" cy="${f(y - 36 * s)}" r="${f(1.7 * s)}" fill="#c98585"/>`
    : ''
  return shadow + `<path d="${d}" fill="url(#chairG)"/>` + bow
}

function lantern(x: number, y: number, s: number) {
  const P = (dx: number, dy: number) => `${f(x + dx * s)} ${f(y - dy * s)}`
  return (
    `<ellipse cx="${f(x - 4 * s)}" cy="${f(y + 1)}" rx="${f(12 * s)}" ry="${f(2.4 * s)}" fill="#2c3a22" opacity=".15"/>` +
    `<path d="M${P(-8, 0)}H${f(x + 8 * s)}V${f(y - 3 * s)}H${f(x - 8 * s)}ZM${P(-7, 3)}H${f(x + 7 * s)}V${f(y - 27 * s)}H${f(x - 7 * s)}Z" fill="#3b3a35"/>` +
    `<path d="M${P(-5.2, 5)}H${f(x + 5.2 * s)}V${f(y - 25 * s)}H${f(x - 5.2 * s)}Z" fill="#f4efe2" opacity=".85"/>` +
    `<path d="M${P(-1.8, 6)}H${f(x + 1.8 * s)}V${f(y - 13 * s)}H${f(x - 1.8 * s)}Z" fill="#fbf6ea"/>` +
    `<path d="M${P(-9, 27)}L${P(0, 36)}L${P(9, 27)}Z" fill="#3b3a35"/>` +
    `<circle cx="${f(x)}" cy="${f(y - 38.5 * s)}" r="${f(2.4 * s)}" fill="none" stroke="#3b3a35" stroke-width="${f(1.2 * s)}"/>`
  )
}

/** Flower borders in front of the hedges: mounded greens with drifts of pink, white and lavender. */
function border(r: Rand, x0: number, x1: number) {
  let greens = ''
  const blooms: Record<string, string> = { '#f2c4cc': '', '#ffffff': '', '#d8c6ea': '', '#f6e4b0': '' }
  const colours = Object.keys(blooms)
  for (let x = x0; x < x1; x += 18 + r() * 14) greens += circle(x, 784 + r() * 4, 16 + r() * 10)
  for (let i = 0; i < (x1 - x0) / 5; i++) {
    const x = x0 + r() * (x1 - x0)
    const y = 770 + r() * 18
    const c = colours[Math.floor(r() * colours.length)]
    for (let k = 0; k < 4; k++) blooms[c] += circle(x + (r() - 0.5) * 8, y + (r() - 0.5) * 6, 1.8 + r() * 1.6)
  }
  // a few tall lavender spires for height
  let spires = ''
  for (let i = 0; i < (x1 - x0) / 60; i++) {
    const x = x0 + r() * (x1 - x0)
    const h = 26 + r() * 22
    for (let k = 0; k < 7; k++) spires += circle(x + (r() - 0.5) * 2, 776 - (k / 7) * h, 2.6 - k * 0.22)
  }
  return `<path d="${greens}" fill="#5f8455"/><path d="${greens}" fill="#7fa368" transform="translate(3 -4)" opacity=".55"/>${Object.entries(blooms)
    .map(([c, d]) => `<path d="${d}" fill="${c}"/>`)
    .join('')}<path d="${spires}" fill="#b9a3d8"/>`
}

/** Stone urn with a clipped topiary ball. */
function urn(x: number, y: number, s: number) {
  const P = (dx: number, dy: number) => `${f(x + dx * s)} ${f(y - dy * s)}`
  return (
    `<ellipse cx="${f(x - 8 * s)}" cy="${f(y + 1)}" rx="${f(26 * s)}" ry="${f(4 * s)}" fill="#2c3a22" opacity=".16"/>` +
    `<path d="M${P(-14, 0)}H${f(x + 14 * s)}V${f(y - 6 * s)}H${f(x - 14 * s)}ZM${P(-7, 6)}H${f(x + 7 * s)}L${P(5, 18)}H${f(x - 5 * s)}Z` +
    `M${P(-22, 18)}H${f(x + 22 * s)}C${P(22, 34)} ${P(12, 42)} ${P(0, 42)}C${P(-12, 42)} ${P(-22, 34)} ${P(-22, 18)}ZM${P(-25, 42)}H${f(x + 25 * s)}V${f(y - 47 * s)}H${f(x - 25 * s)}Z" fill="url(#stoneG)"/>` +
    `<path d="M${P(-2, 47)}H${f(x + 2 * s)}V${f(y - 58 * s)}H${f(x - 2 * s)}Z" fill="#5d4c3a"/>` +
    `<circle cx="${f(x)}" cy="${f(y - 84 * s)}" r="${f(30 * s)}" fill="url(#ballG)"/>` +
    `<circle cx="${f(x)}" cy="${f(y - 84 * s)}" r="${f(30 * s)}" fill="url(#hedgeTex)"/>`
  )
}

/** Point on the arch centreline: u 0 = left foot, .5 = crown, 1 = right foot. */
function archPoint(u: number) {
  const post = FOOT - 520
  const arc = Math.PI * 84
  const d = u * (2 * post + arc)
  if (d < post) return { x: 716, y: FOOT - d, nx: -1, ny: 0 }
  if (d < post + arc) {
    const t = Math.PI + (d - post) / 84
    return { x: AX + 84 * Math.cos(t), y: 520 + 84 * Math.sin(t), nx: Math.cos(t), ny: Math.sin(t) }
  }
  return { x: 884, y: 520 + (d - post - arc), nx: 1, ny: 0 }
}

/** Lush asymmetric garland: heavy over the crown and down the left, a second cluster on the right. */
const archWeight = (u: number) =>
  0.18 + 1.1 * Math.exp(-(((u - 0.36) / 0.13) ** 2)) + 0.75 * Math.exp(-(((u - 0.74) / 0.07) ** 2)) + 0.35 * Math.exp(-(((u - 0.1) / 0.08) ** 2))

function sampleArch(r: Rand) {
  for (;;) {
    const u = r()
    if (r() * 1.6 < archWeight(u)) return u
  }
}

/** Points for the fairy lights woven through the garland (filled while drawing the arch). */
export const FAIRY: { x: number; y: number }[] = []

function arch(r: Rand) {
  const tones = ['#4f7349', '#628a57', '#79a068', '#97b980']
  const leaves = ['', '', '', '']
  const fillers: string[] = []
  const roses: string[] = []
  for (let i = 0; i < 560; i++) {
    const p = archPoint(sampleArch(r))
    const off = gauss(r) * 14
    const x = p.x + p.nx * off + (r() - 0.5) * 8
    const y = p.y + p.ny * off + (r() - 0.5) * 8
    leaves[Math.floor(r() * 4)] += leafAt(x, y, 9 + r() * 9, 3.2 + r() * 2.6, r() * Math.PI * 2)
  }
  // trailing tendrils hanging from the crown cluster
  let tendrils = ''
  for (const [x0, y0, len] of [
    [742, 470, 120],
    [760, 452, 70],
    [858, 470, 90],
  ]) {
    tendrils += `M${x0} ${y0}C${x0 - 8} ${y0 + len * 0.4} ${x0 + 10} ${y0 + len * 0.7} ${x0 - 2} ${y0 + len}`
    for (let k = 0; k < 9; k++) {
      const t = k / 9
      leaves[k % 4] += leafAt(x0 + Math.sin(t * 5) * 5, y0 + len * t, 8, 3, (k % 2 ? 0.6 : 2.5) + r() * 0.4)
    }
  }
  // roses clustered where the garland is heaviest
  const kinds = ['blush', 'blush', 'ivory', 'peach'] as const
  for (let i = 0; i < 30; i++) {
    const p = archPoint(sampleArch(r))
    const off = gauss(r) * 8
    roses.push(rosette(p.x + p.nx * off, p.y + p.ny * off, 8 + r() * 9, r() * 72, kinds[Math.floor(r() * kinds.length)]))
    if (i % 3 === 0) FAIRY.push({ x: p.x + p.nx * (off + 10), y: p.y + p.ny * (off + 10) })
  }
  for (let i = 0; i < 160; i++) {
    const p = archPoint(sampleArch(r))
    const off = gauss(r) * 16
    fillers.push(circle(p.x + p.nx * off, p.y + p.ny * off, 1.4 + r() * 1.2))
    if (i % 4 === 0) FAIRY.push({ x: p.x + p.nx * off, y: p.y + p.ny * off })
  }
  // floral arrangements at each foot
  const foot = (cx: number) => {
    let s = ''
    for (let i = 0; i < 150; i++) {
      const a = r() * Math.PI
      const d = Math.sqrt(r())
      leaves[Math.floor(r() * 4)] += leafAt(cx + Math.cos(a) * d * 58 * (r() < 0.5 ? -1 : 1), FOOT - Math.sin(a) * d * 34, 10 + r() * 10, 3.6 + r() * 2.8, r() * Math.PI * 2)
    }
    for (let i = 0; i < 7; i++) s += rosette(cx + (r() - 0.5) * 70, FOOT - 6 - r() * 26, 11 + r() * 9, r() * 72, kinds[Math.floor(r() * kinds.length)])
    for (let i = 0; i < 40; i++) fillers.push(circle(cx + (r() - 0.5) * 90, FOOT - r() * 36, 1.5 + r() * 1.4))
    return s
  }
  const feet = foot(716) + foot(884)
  // chiffon drapes hanging from the crown corners
  const drape = (m: 1 | -1) => {
    const X = (dx: number) => f(AX + m * dx)
    return `<path d="M${X(-88)} 478C${X(-94)} 560 ${X(-108)} 660 ${X(-118)} 760Q${X(-110)} 766 ${X(-102)} 760Q${X(-94)} 766 ${X(-86)} 760Q${X(-78)} 766 ${X(-70)} 760Q${X(-62)} 766 ${X(-56)} 760C${X(-62)} 660 ${X(-70)} 560 ${X(-76)} 478Z" fill="url(#chiffon)" opacity=".88"/>`
  }
  const frame = `M711 ${FOOT}V520A89 89 0 0 1 889 520V${FOOT}H879V520A79 79 0 0 0 721 520V${FOOT}Z`
  return `<g class="rose-arch">
<path d="${frame}" fill="url(#chairG)"/>
${drape(1)}${drape(-1)}
<path d="${tendrils}" fill="none" stroke="#5f8455" stroke-width="1.4"/>
${leaves.map((d, i) => `<path d="${d}" fill="${tones[i]}"/>`).join('')}
<path d="${fillers.join('')}" fill="#fffdf8"/>
${roses.join('')}${feet}
</g>`
}

const SIDE_STRANDS = [strand(-60, 456, 330, 612, 724, 470, 16, 0, 0.45), strand(876, 470, 1270, 612, 1660, 456, 16, 0.12, 0.45)]
/** Lantern positions (filled while drawing the front layer) so their flames can glow. */
export const LANTERNS: { x: number; y: number; s: number; i: number }[] = []

export function frontLayer() {
  const r = rng(21)
  // lawn with mown stripes converging on the arch
  let stripes = ''
  for (let i = 0; i < 16; i += 2) {
    const a = -500 + i * 160
    stripes += `M${AX} ${VP}L${a} 1010L${a + 160} 1010Z`
  }
  // the aisle runner, petals heavier at its edges and larger nearer us
  let petals = ''
  for (let i = 0; i < 110; i++) {
    const t = Math.sqrt(r())
    const y = FOOT + 4 + t * 240
    const side = r() < 0.5 ? -1 : 1
    const x = AX + side * hwAt(y) * (0.6 + r() * 0.48)
    const s = 0.5 + t * 1.8
    petals += `<path d="${petalPath(7 * s, 5 * s)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)}) scale(1 .55)" fill="url(#ro-${r() < 0.6 ? 'blush' : 'ivory'}-0)"/>`
  }
  // chairs, back to front; lanterns at every other row
  let chairs = ''
  LANTERNS.length = 0
  const rows = [790, 812, 838, 870, 910, 962, 1032]
  rows.forEach((y, ri) => {
    const s = scaleAt(y)
    for (let j = 2; j >= 0; j--) {
      const off = hwAt(y) + 22 * s + j * 32 * s
      chairs += chair(AX - off, y, s, j === 0) + chair(AX + off, y, s, j === 0)
    }
    if (ri % 2 === 1) for (const m of [-1, 1]) LANTERNS.push({ x: AX + m * (hwAt(y) + 4 * s), y: y + 4, s: s * 1.05, i: 0.15 + ri * 0.1 })
  })
  const lanterns = LANTERNS.map((l) => lantern(l.x, l.y, l.s)).join('')
  const strands = SIDE_STRANDS.map((st) => `<path class="wire" d="${st.wire}"/><path class="bulb" d="${bulbBodies(st.bulbs)}"/>`).join('')
  FAIRY.length = 0
  const archArt = arch(r)
  return `<svg class="layer land front" ${VB} aria-hidden="true">
<defs>
${roseDefs()}
<linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6c288"/><stop offset=".5" stop-color="#8fb072"/><stop offset="1" stop-color="#729760"/></linearGradient>
<clipPath id="lawnClip"><path d="M-40 770C400 760 1200 760 1640 770V1010H-40Z"/></clipPath>
<linearGradient id="runnerG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece4d6"/><stop offset="1" stop-color="#f5efe5"/></linearGradient>
<linearGradient id="chairG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffefb"/><stop offset="1" stop-color="#e4dfd6"/></linearGradient>
<linearGradient id="sashG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c3c0"/><stop offset="1" stop-color="#dc9f9f"/></linearGradient>
<linearGradient id="stoneG" x1="0" x2="1"><stop offset="0" stop-color="#e2dccf"/><stop offset=".6" stop-color="#f3efe6"/><stop offset="1" stop-color="#d1c9b9"/></linearGradient>
<radialGradient id="ballG" cx=".62" cy=".3" r=".8"><stop offset="0" stop-color="#a9c792"/><stop offset=".55" stop-color="#6f9161"/><stop offset="1" stop-color="#486743"/></radialGradient>
<linearGradient id="chiffon" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".22" stop-color="#efe9e2" stop-opacity=".85"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".6"/><stop offset=".68" stop-color="#ebe4dc" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity=".6"/></linearGradient>
</defs>
<g id="art-front"><path d="M-40 770C400 760 1200 760 1640 770V1010H-40Z" fill="url(#lawnG)"/>
<path d="${stripes}" fill="#ffffff" opacity=".07" clip-path="url(#lawnClip)"/>
${border(r, -40, 650)}${border(r, 950, 1640)}
${urn(150, 800, 0.95)}${urn(460, 794, 0.8)}${urn(1140, 794, 0.8)}${urn(1450, 800, 0.95)}
<path d="M786 ${FOOT + 2}L814 ${FOOT + 2}L${AX + 262} 1010L${AX - 262} 1010Z" fill="url(#runnerG)"/>
<path d="M786 ${FOOT + 2}L${AX - 262} 1010M814 ${FOOT + 2}L${AX + 262} 1010" stroke="#e2dacd" stroke-width="1.2"/>
<g class="petal-strew">${petals}</g>
${chairs}
${lanterns}
${strands}
${archArt}
</g>
</svg>`
}

/* ------------------------------------------------------------------ */
/* Foreground: out-of-focus roses (depth of field)                    */
/* ------------------------------------------------------------------ */

export function fgLayer() {
  const r = rng(33)
  let leaves = ''
  const cluster = (cx: number, cy: number, spread: number, n: number) => {
    for (let i = 0; i < n; i++)
      leaves += leafAt(cx + (r() - 0.5) * spread, cy + (r() - 0.3) * spread * 0.6, 50 + r() * 50, 16 + r() * 12, -Math.PI / 2 + (r() - 0.5) * 2.4)
  }
  cluster(120, 1010, 320, 14)
  cluster(1480, 1010, 320, 14)
  cluster(560, 1040, 90, 4)
  cluster(1040, 1040, 90, 4)
  return `<svg class="layer land fg" ${VB} aria-hidden="true">
<defs><filter id="dof" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>
<g id="art-fg" filter="url(#dof)">
<path d="${leaves}" fill="#4f7347"/>
${rosette(96, 962, 74, 12, 'blush')}${rosette(250, 1012, 56, 40, 'ivory')}${rosette(1500, 968, 70, 30, 'ivory')}${rosette(1362, 1016, 50, 8, 'peach')}
${rosette(586, 1018, 30, 20, 'blush')}${rosette(1016, 1020, 28, 50, 'ivory')}
</g>
</svg>`
}

/**
 * Time-of-day looks: the same artwork re-coloured once through a colour
 * matrix (fitted to target colours), then cross-faded by opacity while you
 * scroll — so the light changes without the browser re-filtering every frame.
 *   warm  golden hour → sunset (whites → peach, greens → warm olive)
 *   moon  moonlight (whites → pale moon-blue, foliage → deep blue-teal)
 * Far layers get a lifted offset so they stay hazier.
 */
const LOOKS = {
  warm: {
    near: '0.900 -0.057 0.220 0 -0.004  0.308 0.520 0.159 0 -0.066  0.274 -0.208 0.809 0 -0.032  0 0 0 1 0',
    far: '0.900 -0.057 0.220 0 0.036  0.308 0.520 0.159 0 -0.026  0.274 -0.208 0.809 0 0.008  0 0 0 1 0',
  },
  moon: {
    near: '0.327 0.407 0.076 0 -0.25  0.195 0.503 0.0715 0 -0.17  0.2235 0.439 0.202 0 -0.115  0 0 0 1 0',
    far: '0.30 0.38 0.07 0 -0.17  0.18 0.47 0.066 0 -0.1  0.21 0.41 0.19 0 -0.05  0 0 0 1 0',
  },
}
export function graded(id: 'back' | 'front' | 'fg', look: keyof typeof LOOKS) {
  const m = LOOKS[look][id === 'back' ? 'far' : 'near']
  return `<svg class="layer land-${look}" ${VB} aria-hidden="true"><defs><filter id="${look}-${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m}"/></filter></defs><g filter="url(#${look}-${id})"><use href="#art-${id}"/></g></svg>`
}

/* ------------------------------------------------------------------ */
/* Lights (never graded) and effects                                  */
/* ------------------------------------------------------------------ */

const glowDefs = `<defs>
<radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffd98c" stop-opacity=".9"/><stop offset=".35" stop-color="#ffc766" stop-opacity=".32"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient>
<radialGradient id="warmGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
</defs>`

export function glowBack() {
  const x = 1240
  const g = 660
  let panes = ''
  for (let px = x - 49; px < x + 49; px += 9.2) panes += `M${f(px + 1)} ${g - 35}h7v12h-7ZM${f(px + 1)} ${g - 21}h7v12h-7Z`
  panes += `M${x - 69} ${g - 22}h8v13h-8ZM${x - 60} ${g - 22}h8v13h-8ZM${x + 52} ${g - 22}h8v13h-8ZM${x + 61} ${g - 22}h8v13h-8Z`
  return `<svg class="layer glow" ${VB} aria-hidden="true">${glowDefs}
<g class="lg" style="--i:.55"><ellipse cx="${x}" cy="${g - 22}" rx="90" ry="34" fill="url(#warmGlow)" opacity=".38"/><path d="${panes}" fill="#ffdc96" opacity=".78"/><path d="M${x - 52} ${g - 37}Q${x} ${g - 66} ${x + 52} ${g - 37}Z" fill="#ffe4b0" opacity=".32"/></g>
${bulbGlows(BACK_STRAND.bulbs, 16)}
</svg>`
}

export function glowFront() {
  const r = rng(41)
  const bulbs = SIDE_STRANDS.map((st) => bulbGlows(st.bulbs)).join('')
  const flames = LANTERNS.map(
    (l) =>
      `<g class="lg" style="--i:${l.i.toFixed(2)}"><circle cx="${f(l.x)}" cy="${f(l.y - 16 * l.s)}" r="${f(34 * l.s)}" fill="url(#warmGlow)"/><ellipse class="flame" cx="${f(l.x)}" cy="${f(l.y - 15.5 * l.s)}" rx="${f(1.6 * l.s)}" ry="${f(3.2 * l.s)}" fill="#ffe6a6"/></g>`,
  ).join('')
  const fairy = FAIRY.map((p, k) => `<g class="fairy f${k % 3}"><circle cx="${f(p.x)}" cy="${f(p.y)}" r="7" fill="url(#bulbGlow)"/><circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(1.3 + r() * 1)}" fill="#fff4d0"/></g>`).join('')
  return `<svg class="layer glow" ${VB} aria-hidden="true">${glowDefs}
<g class="lg" style="--i:.3"><ellipse cx="${AX}" cy="${FOOT - 70}" rx="150" ry="190" fill="url(#warmGlow)" opacity=".5"/><ellipse cx="${AX}" cy="${FOOT + 30}" rx="230" ry="60" fill="url(#warmGlow)" opacity=".35"/></g>
${bulbs}${flames}
<g class="lg fairies" style="--i:.4">${fairy}</g>
</svg>`
}

export function fxLayer() {
  const r = rng(51)
  let rays = ''
  for (let i = 0; i < 6; i++) {
    const a = ((158 + i * 10 + (r() - 0.5) * 5) * Math.PI) / 180
    const w = 0.018 + r() * 0.022
    const P = (rr: number, da: number) => `${f(Math.cos(a + da) * rr)} ${f(Math.sin(a + da) * rr)}`
    rays += `<path d="M${P(60, -0.008)}L${P(1300, -w)}L${P(1300, w)}L${P(60, 0.008)}Z" fill="url(#rayG)" opacity="${(0.4 + r() * 0.4).toFixed(2)}"/>`
  }
  let bokeh = ''
  for (let i = 0; i < 11; i++) {
    const left = i % 2 === 0
    const x = left ? 40 + r() * 360 : 1200 + r() * 360
    const y = 820 + r() * 190
    bokeh += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(14 + r() * 24)}" fill="url(#bokehG)" opacity="${(0.3 + r() * 0.35).toFixed(2)}"/>`
  }
  return `<svg class="layer fx" ${VB} aria-hidden="true">
<defs>
<linearGradient id="rayG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff4d2" stop-opacity=".5"/><stop offset=".6" stop-color="#fff4d2" stop-opacity=".12"/><stop offset="1" stop-color="#fff4d2" stop-opacity="0"/></linearGradient>
<filter id="raySoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
<radialGradient id="bokehG"><stop offset="0" stop-color="#ffd27a" stop-opacity=".42"/><stop offset=".72" stop-color="#ffcb6e" stop-opacity=".3"/><stop offset="1" stop-color="#ffcb6e" stop-opacity="0"/></radialGradient>
</defs>
<g class="rays"><g filter="url(#raySoft)">${rays}</g></g>
<g class="bokeh">${bokeh}</g>
</svg>`
}

/** Fireflies: an HTML layer so they can drift anywhere and gather into a heart. */
export function fireflies(n: number) {
  const r = rng(13)
  return Array.from({ length: n }, () => {
    const vars = [
      `left:${f(4 + r() * 92)}%`,
      `top:${f(16 + r() * 72)}%`,
      `--dx:${f((r() - 0.5) * 40)}px`,
      `--dy:${f((r() - 0.5) * 30)}px`,
      `--dur:${f(5 + r() * 6)}s`,
      `--blink:${f(1.6 + r() * 2.4)}s`,
      `--delay:${f(-r() * 8)}s`,
    ].join(';')
    return `<span class="ff" style="${vars}"><span class="ff-dot"></span></span>`
  }).join('')
}

/** A few swallows crossing the afternoon sky. */
export function birds() {
  const r = rng(61)
  return Array.from({ length: 5 }, (_, i) => {
    const s = 0.6 + r() * 0.6
    return `<span class="bird b${i}" style="top:${f(10 + r() * 22)}%;--s:${f(s)};--dur:${f(26 + r() * 16)}s;--delay:${f(-r() * 30)}s"><svg viewBox="-12 -6 24 10"><path d="M-11 0Q-5 -6 0 0Q5 -6 11 0Q5 -3 0 1Q-5 -3 -11 0Z"/></svg></span>`
  }).join('')
}
