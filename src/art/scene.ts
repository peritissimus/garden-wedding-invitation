import { circle, f, rng, scallop } from './util'
import { petalPath } from './rose'

/**
 * The garden, painted in depth layers that share one coordinate system
 * (1600×1000, anchored bottom-centre like SVG's `xMidYMax slice`):
 *
 *   sky      stars, sun, moon, clouds                           (no camera)
 *   back     hills, haze, glasshouse, trees, hedges, far lights (camera ×0.6)
 *   front    lawn, aisle, chairs, urns, beds, the mandap        (camera ×1)
 *   fg       out-of-focus roses framing the bottom corners      (camera ×1.3)
 *   glows    the lights themselves — never colour-graded
 *   fx       sunbeams and night bokeh
 *
 * None of this goes into the page as live SVG. Each piece is an SVG string
 * that stage.ts paints once into a canvas, so while you scroll the browser
 * only moves and fades a few bitmaps — cheap even on a phone — instead of
 * repainting thousands of leaves every frame.
 */

/** A piece of scenery: gradients etc. in `defs`, shapes in `body`, and the part of the scene it covers (x0 y0 x1 y1). */
export interface Art {
  defs: string
  body: string
  box: [number, number, number, number]
}

const AX = 800
const FOOT = 760 // where the mandap stands
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
export function rosette(x: number, y: number, R: number, rot: number, tone: keyof typeof ROSE_TONES) {
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

/**
 * The night sky in three sheets so they can twinkle out of step without
 * repainting anything: the Milky Way with a third of the stars (steady),
 * then two more thirds that each fade in and out on their own rhythm.
 */
export function stars(): [Art, Art, Art] {
  const r = rng(5)
  const groups = ['', '', '']
  for (let i = 0; i < 150; i++) groups[i % 3] += circle(r() * 1600, r() * 620, 0.5 + r() * 1.3)
  let milky = ''
  for (let i = 0; i < 320; i++) {
    const t = r()
    milky += `<circle cx="${f(60 + 1480 * t + gauss(r) * 20)}" cy="${f(560 - 470 * t + gauss(r) * 46)}" r="${f(0.35 + r() * 0.7)}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`
  }
  const box: Art['box'] = [-40, 0, 1640, 660]
  const sheet = (d: string) => ({ defs: '', body: `<path d="${d}" fill="#fff"/>`, box })
  return [
    {
      defs: `<radialGradient id="milkyGlow"><stop offset="0" stop-color="#d9defa" stop-opacity=".16"/><stop offset=".6" stop-color="#c6cdf2" stop-opacity=".06"/><stop offset="1" stop-color="#c6cdf2" stop-opacity="0"/></radialGradient>`,
      body: `<ellipse cx="800" cy="300" rx="860" ry="120" transform="rotate(-17 800 300)" fill="url(#milkyGlow)"/><g fill="#fff">${milky}<path d="${groups[0]}"/></g>`,
      box,
    },
    sheet(groups[1]),
    sheet(groups[2]),
  ]
}

/** The sun in three lights (cross-faded as it sinks); centred on 0,0. */
export const SUN_LOOKS = {
  day: { disc: '#fff9e6', glow: '#ffeec2' },
  golden: { disc: '#ffe6a3', glow: '#ffcf7a' },
  sunset: { disc: '#ffbb73', glow: '#ff9566' },
}
export function sun(look: keyof typeof SUN_LOOKS): Art {
  const { disc, glow } = SUN_LOOKS[look]
  const stop = (o: number, a: number) => `<stop offset="${o}" stop-color="${glow}" stop-opacity="${a}"/>`
  return {
    defs: `<radialGradient id="sunGlow-${look}">${stop(0, 0.95)}${stop(0.3, 0.38)}${stop(1, 0)}</radialGradient>`,
    body: `<circle r="360" fill="url(#sunGlow-${look})"/><circle r="54" fill="${disc}"/>`,
    box: [-360, -360, 360, 360],
  }
}

/** Full moon with a soft halo; centred on 0,0. */
export function moon(): Art {
  return {
    defs: `<radialGradient id="moonGlow"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".45"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>`,
    body: `<circle r="210" fill="url(#moonGlow)"/><circle r="30" fill="#f7f3ea"/><circle cx="-9" cy="-6" r="5.5" fill="#e4dece" opacity=".7"/><circle cx="10" cy="9" r="3.6" fill="#e4dece" opacity=".6"/><circle cx="6" cy="-13" r="2.4" fill="#e4dece" opacity=".6"/>`,
    box: [-210, -210, 210, 210],
  }
}

/** Cloud colours (top-lit → shaded underside) through the day. */
export const CLOUD_LOOKS = {
  day: ['#ffffff', '#dde7ee'],
  golden: ['#fff6e6', '#efc8a2'],
  sunset: ['#f9c6b0', '#b77f96'],
  dusk: ['#7f73a3', '#4b4577'],
  night: ['#2c335e', '#1d2348'],
}
/** Where each cloud sits: left % and top % of the sky, width in px. */
const CLOUD_SPOTS: [number, number, number][] = [
  [8, 9, 300],
  [36, 4, 220],
  [58, 22, 180],
  [80, 8, 260],
  [94, 26, 160],
]

/**
 * Painterly cumulus — lobes shaded top-lit, softly blurred — laid out across
 * the sky of a `w`×`h` stage. Unlike the rest of the scene this is in CSS px:
 * clouds keep their size whatever the screen.
 */
export function clouds(w: number, h: number, look: keyof typeof CLOUD_LOOKS): Art {
  const r = rng(17)
  const [top, bottom] = CLOUD_LOOKS[look]
  const lobes = () => {
    const base = `<ellipse cx="10" cy="22" rx="150" ry="22"/>`
    const puffs = Array.from({ length: 9 }, (_, i) => {
      const x = -120 + i * 30 + (r() - 0.5) * 16
      const rr = 26 + Math.sin((i / 8) * Math.PI) * 30 + r() * 10
      return `<ellipse cx="${f(x)}" cy="${f(14 - rr * 0.55)}" rx="${f(rr)}" ry="${f(rr * 0.82)}"/>`
    }).join('')
    return `<g filter="url(#cloudSoft)" fill="url(#cloudG-${look})">${base}${puffs}</g>`
  }
  let x0 = Infinity
  let x1 = -Infinity
  let y1 = 0
  const body = CLOUD_SPOTS.map(([x, y, cw]) => {
    const left = (x / 100) * w
    const top = (y / 100) * h
    x0 = Math.min(x0, left)
    x1 = Math.max(x1, left + cw)
    y1 = Math.max(y1, top + (cw * 140) / 360)
    return `<g transform="translate(${f(left)} ${f(top)}) scale(${(cw / 360).toFixed(4)}) translate(180 90)">${lobes()}</g>`
  }).join('')
  return {
    defs: `<linearGradient id="cloudG-${look}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><filter id="cloudSoft" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`,
    body,
    box: [x0 - 12, 0, x1 + 12, y1 + 12],
  }
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
/** A strand's wire and its unlit bulbs, as painted into the scenery. */
const strandArt = (st: ReturnType<typeof strand>) =>
  `<path d="${st.wire}" fill="none" stroke="#6b6458" stroke-width="1.2"/><path d="${st.bulbs
    .map((b) => `M${f(b.x - 1.5)} ${f(b.y - 6.5)}h3v3h-3Z${circle(b.x, b.y, 3.6)}`)
    .join('')}" fill="#f7f1df"/>`

/** Leaf texture for clipped hedges and topiary (each painted layer carries its own copy). */
const HEDGE_TEX = `<pattern id="hedgeTex" width="14" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#fff" opacity=".07"/><circle cx="10" cy="8" r="2.6" fill="#000" opacity=".06"/><circle cx="12" cy="2" r="1.6" fill="#fff" opacity=".05"/></pattern>`

const BACK_STRAND = strand(250, 432, AX, 560, 1350, 432, 22, 0.1, 0.5)

/** Flowering trees among the green: cherry pink and jacaranda lilac, shaded like the oaks. */
const BLOSSOM = {
  pink: ['#cf98a9', '#e2b0bf', '#efc9d3', '#fae0e6'],
  lilac: ['#a596c2', '#baacd5', '#d0c4e5', '#e6ddf3'],
}
/** Treetops near the middle of the garden, filled while drawing the back layer, for the fairy lights strung through them at night. */
const CANOPIES: { x: number; y: number; R: number }[] = []

export function back(): Art {
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
  // the treeline proper: oaks and poplars, smaller behind the mandap so it reads against the sky.
  // A few flower: cherry pink and jacaranda lilac either side of the mandap and further out.
  const d = rng(77) // details get their own sequence so the treeline itself never moves
  const blossomAt: [number, number, keyof typeof BLOSSOM][] = [
    [470, 640, 'pink'],
    [960, 1130, 'lilac'],
    [140, 320, 'lilac'],
    [1280, 1460, 'pink'],
  ]
  let trees = ''
  let sprinkle = ''
  CANOPIES.length = 0
  let x = -60
  while (x < 1680) {
    const behindArch = x > 640 && x < 960
    if (!behindArch && r() < 0.3) {
      trees += poplar(x, 744, 34 + r() * 16, 170 + r() * 80)
      x += 34 + r() * 24
    } else {
      const R0 = behindArch ? 34 + r() * 12 : 52 + r() * 40
      const spot = behindArch ? -1 : blossomAt.findIndex(([a, b]) => x > a && x < b)
      const kind = spot >= 0 ? blossomAt.splice(spot, 1)[0][2] : null
      trees += oak(r, x, 748, R0, kind ? BLOSSOM[kind] : tones)
      const cy = 748 - R0 * 1.22
      // a fine sprinkle of open flowers, mostly on the sunlit upper right of the crown
      if (kind)
        for (let i = 0; i < R0 * 0.55; i++) {
          const a = -Math.PI * (0.05 + d() * 0.9)
          const q = 0.25 + Math.sqrt(d()) * 0.7
          sprinkle += circle(x + Math.cos(a) * q * R0 * 0.8 + R0 * 0.08, cy + Math.sin(a) * q * R0 * 0.6, 0.6 + d() * 0.8)
        }
      if (x > 120 && x < 1480) CANOPIES.push({ x, y: cy, R: R0 })
      x += R0 * (1.1 + r() * 0.5)
    }
  }
  // climbing roses scrambling over the hedges
  const roses: Record<string, string> = { '#f2c4cc': '', '#fffaf4': '', '#e5aab6': '', '#f7e3c3': '' }
  const tones4 = Object.keys(roses)
  let briars = ''
  for (const [x0, x1] of [
    [-40, 652],
    [948, 1640],
  ]) {
    for (let rx = x0 + 12; rx < x1 - 12; rx += 12 + d() * 24) {
      const ry = 731 + d() * 34
      for (let k = 0; k < 3; k++) briars += leafAt(rx + (d() - 0.5) * 14, ry + (d() - 0.5) * 8, 4 + d() * 3, 1.5, d() * Math.PI * 2)
      const n = 2 + Math.floor(d() * 4)
      const c = tones4[Math.floor(d() * tones4.length)]
      for (let k = 0; k < n; k++) roses[c] += circle(rx + (d() - 0.5) * 11, ry + (d() - 0.5) * 7, 1.5 + d() * 1.3)
    }
  }
  // clipped hedges framing the lawn, with a little leaf texture
  const hedge = (x0: number, x1: number) =>
    `M${x0} 812V738C${x0} 730 ${x0 + 6} 726 ${x0 + 14} 726H${x1 - 14}C${x1 - 6} 726 ${x1} 730 ${x1} 738V812Z`
  const hedges = hedge(-40, 652) + hedge(948, 1640)
  return {
    defs: `<linearGradient id="ridgeA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d9d9"/><stop offset="1" stop-color="#b6c9c3"/></linearGradient>
<linearGradient id="ridgeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2c6b3"/><stop offset="1" stop-color="#9eb49e"/></linearGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="poplarG" x1="0" x2="1"><stop offset="0" stop-color="#4c6a45"/><stop offset=".55" stop-color="#6c8c5b"/><stop offset="1" stop-color="#8aa975"/></linearGradient>
<linearGradient id="hedgeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db07a"/><stop offset=".35" stop-color="#6f925f"/><stop offset="1" stop-color="#4a6643"/></linearGradient>
${HEDGE_TEX}
<linearGradient id="glassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6eff0"/><stop offset="1" stop-color="#bccdd0"/></linearGradient>`,
    body: `<path d="M-40 640C120 596 300 588 470 612C620 634 720 600 870 588C1030 576 1160 626 1310 612C1440 600 1540 606 1640 618V1000H-40Z" fill="url(#ridgeA)"/>
<rect x="-40" y="560" width="1680" height="140" fill="url(#haze)" opacity=".7"/>
<path d="M-40 668C160 640 360 632 560 648C720 660 860 640 1000 634C1140 628 1300 654 1460 646C1540 642 1600 646 1640 650V1000H-40Z" fill="url(#ridgeB)"/>
<g class="woods">${woods}</g>
${glasshouse(1240, 660)}
<rect x="-40" y="610" width="1680" height="110" fill="url(#haze)" opacity=".45"/>
<g class="trees">${trees}<path d="${sprinkle}" fill="#fffafb" opacity=".75"/></g>
<rect x="-40" y="690" width="1680" height="60" fill="url(#haze)" opacity=".35"/>
${strandArt(BACK_STRAND)}
<path d="${hedges}" fill="url(#hedgeG)"/><path d="${hedges}" fill="url(#hedgeTex)"/>
<path d="${briars}" fill="#5d8150"/>${Object.entries(roses)
      .map(([c, p]) => `<path d="${p}" fill="${c}"/>`)
      .join('')}
<path d="M-26 727H638M962 727H1626" fill="none" stroke="#b3cc9b" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
    // from the tips of the strand down to the bottom of the hills
    box: [-40, 420, 1640, 1000],
  }
}

/* ------------------------------------------------------------------ */
/* Front: lawn, aisle, chairs, beds, urns, lanterns, the mandap       */
/* ------------------------------------------------------------------ */

const ROSE_TONES = {
  blush: [['#e3a5a0', '#fbe6e1'], ['#d99491', '#f6d4cf'], ['#cf8486', '#efc3bf'], ['#c27478', '#e6aeb0'], '#b9686f'],
  ivory: [['#e6d9c6', '#fffbf4'], ['#dfcfb8', '#fdf5e9'], ['#d6c4aa', '#f8eddd'], ['#ccb89b', '#f1e3cf'], '#c4ad8a'],
  peach: [['#eab08f', '#fde6d6'], ['#e3a183', '#f9d8c3'], ['#db9377', '#f3c8af'], ['#d0846a', '#ecb69b'], '#c4775e'],
  lilac: [['#c7aed6', '#f4ebf8'], ['#bea2cf', '#eee2f4'], ['#b394c6', '#e6d6ee'], ['#a787bb', '#dccbe6'], '#9b78ae'],
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
      `<circle cx="${f(x)}" cy="${f(y - 36 * s)}" r="${f(1.7 * s)}" fill="#c98585"/>` +
      // a posy tucked into the knot
      `<path d="${leafAt(x - 2 * s, y - 34 * s, 5 * s, 1.7 * s, 2.4)}${leafAt(x + 2 * s, y - 34 * s, 5 * s, 1.7 * s, 0.75)}${leafAt(x, y - 39 * s, 4 * s, 1.4 * s, -1.6)}" fill="#6f9561"/>` +
      rosette(x - 3.2 * s, y - 35.4 * s, 2.3 * s, (x * 7) % 72, 'ivory') +
      rosette(x + 3.2 * s, y - 35.4 * s, 2.3 * s, (x * 5) % 72, 'lilac') +
      rosette(x, y - 37 * s, 3 * s, (x * 13) % 72, 'blush')
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

/** The lawn up close: tufts of grass and a scatter of daisies, clover and buttercups, larger nearer us. */
function meadow(r: Rand) {
  const blades = ['', '']
  const dots: Record<string, string> = { '#ffffff': '', '#d9c6ec': '', '#f3d36b': '', '#f6cdd6': '' }
  let eyes = ''
  for (let i = 0; i < 900; i++) {
    const y = 776 + 236 * r() ** 0.85
    const x = -40 + r() * 1680
    const s = scaleAt(y)
    if (Math.abs(x - AX) < hwAt(y) + 10 * s) continue // keep the aisle clear
    const tone = r() < 0.55 ? 0 : 1
    for (let k = 0; k < 4; k++) {
      const bx = x + (r() - 0.5) * 6 * s
      const h = (4 + r() * 6) * s * 1.3
      const lean = (r() - 0.5) * h * 0.8
      const w = 0.9 * s
      blades[tone] += `M${f(bx - w)} ${f(y)}Q${f(bx + lean * 0.4)} ${f(y - h * 0.6)} ${f(bx + lean)} ${f(y - h)}Q${f(bx + lean * 0.4 + w)} ${f(y - h * 0.5)} ${f(bx + w)} ${f(y)}Z`
    }
  }
  for (let i = 0; i < 520; i++) {
    const y = 778 + 230 * r() ** 0.9
    const x = -40 + r() * 1680
    const s = scaleAt(y)
    if (Math.abs(x - AX) < hwAt(y) + 8 * s) continue
    const kind = r()
    if (kind < 0.4) {
      dots['#ffffff'] += circle(x, y, 1.7 * s) // daisy, with a yellow eye
      eyes += circle(x, y, 0.65 * s)
    } else if (kind < 0.65) dots['#d9c6ec'] += circle(x, y, 1.3 * s)
    else if (kind < 0.85) dots['#f3d36b'] += circle(x, y, 1.1 * s)
    else dots['#f6cdd6'] += circle(x, y, 1.3 * s)
  }
  return (
    `<path d="${blades[0]}" fill="#6a9358"/><path d="${blades[1]}" fill="#a3c587"/>` +
    Object.entries(dots)
      .map(([c, d]) => `<path d="${d}" fill="${c}"/>`)
      .join('') +
    `<path d="${eyes}" fill="#f2c14e"/>`
  )
}

/** A floral rangoli at the foot of the mandap: rings of petals round a marigold heart, seen almost edge-on. */
function rangoli(cx: number, cy: number, R: number, squash: number) {
  const rings: [number, number, string][] = [
    [1, 30, '#f2c4cc'],
    [0.8, 26, '#fffaf2'],
    [0.6, 20, '#dccff0'],
    [0.4, 14, '#f7dc8f'],
  ]
  let art = `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 1.06)}" ry="${f(R * 1.06 * squash)}" fill="#f3ead9" opacity=".7"/>`
  for (const [k, n, colour] of rings) {
    let d = ''
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 3
      const [x0, y0] = [cx + Math.cos(a) * R * k * 0.55, cy + Math.sin(a) * R * k * 0.55 * squash]
      const [x1, y1] = [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k * squash]
      // a petal pointing outwards: long when it lies across our view, short and flat when it points at us
      const W = R * k * 0.16 * (squash * Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)))
      d += leafAt(x0, y0, Math.hypot(x1 - x0, y1 - y0), Math.max(W, 0.5), Math.atan2(y1 - y0, x1 - x0))
    }
    art += `<path d="${d}" fill="${colour}"/>`
  }
  return `${art}<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 0.2)}" ry="${f(R * 0.2 * squash)}" fill="#f2b51f"/>`
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

/* The mandap: four white fan columns — a slim cage bound in gold flaring
   into pleated blades — crowned with pastel flowers and wild grasses, with a
   floral chandelier hanging in the middle. */

/** Points for the fairy lights woven through the flowers (filled while drawing the mandap). */
const FAIRY: { x: number; y: number }[] = []
/** The rim of the front fans, and the crystal chandelier hanging between them. */
export const MANDAP = { top: 532, chandelier: { x: AX, y: 606 } }

const LEAF_TONES = ['#4f7349', '#628a57', '#79a068', '#97b980']
/** Tiny florets: baby's breath, lilac hydrangea, pale yellow and blush. */
const FLORETS = ['#fffdf8', '#fffdf8', '#e4d8f2', '#f5e6a6', '#f6d3db']
const BLOOMS = ['blush', 'ivory', 'lilac', 'blush', 'ivory', 'lilac', 'peach'] as const

/**
 * A fan column standing on `ground` at `cx`, `k` times full size: a slim cage
 * bound in gold, flaring into a fluted white fan whose rim is a row of pointed
 * petal tips. The fan is one sculpted shape, shaded round like a cone, with
 * embossed creases running up from the waist between the petals.
 */
function fanColumn(cx: number, ground: number, k: number) {
  const waist = ground - 112 * k
  const top = waist - 118 * k
  const W = 66 * k
  /** the cage narrows from 15 at the ground to 7 at the waist */
  const hw = (y: number) => (7 + (8 * (y - waist)) / (ground - waist)) * k
  let slats = ''
  for (let j = -2; j <= 2; j++) slats += `M${f(cx + (j / 2) * hw(ground))} ${f(ground)}L${f(cx + (j / 2) * hw(waist))} ${f(waist)}`
  let art = `<path d="${slats}" fill="none" stroke="#f6f4ee" stroke-width="${f(2.6 * k)}"/><path d="${slats}" fill="none" stroke="#c3c9d1" stroke-width="${f(0.8 * k)}" transform="translate(${f(1.1 * k)} 0)"/>`
  for (const y of [ground - 5 * k, (ground + waist) / 2, waist + 3 * k])
    art += `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(hw(y) + 1.5 * k)}" ry="${f(2.2 * k)}" fill="none" stroke="#c9a24a" stroke-width="${f(1.5 * k)}"/>`
  // the rim: petal tips with creases (valleys) between them; the outer ones curl out and down
  const N = 13
  const rim = (u: number, dip: number) => [cx + u * W * (1.04 + 0.08 * Math.abs(u) ** 3), top + Math.abs(u) ** 1.5 * 30 * k + dip] as const
  const tips = Array.from({ length: N }, (_, i) => rim((i / (N - 1)) * 2 - 1, 0))
  const valleys = Array.from({ length: N - 1 }, (_, i) => rim(((i + 0.5) / (N - 1)) * 2 - 1, 11 * k))
  const neck = waist + 4 * k
  const P = (p: readonly [number, number]) => `${f(p[0])} ${f(p[1])}`
  // sides bow outwards like a trumpet; between tips the rim scallops down into each crease
  let d = `M${f(cx - 6 * k)} ${f(neck)}Q${f(cx - W * 0.16)} ${f(top + (waist - top) * 0.42)} ${P(tips[0])}`
  for (let i = 0; i < N - 1; i++) {
    const [vx, vy] = valleys[i]
    d += `Q${f((tips[i][0] + vx) / 2)} ${f(Math.min(tips[i][1], vy) - 2 * k)} ${f(vx)} ${f(vy)}Q${f((vx + tips[i + 1][0]) / 2)} ${f(Math.min(vy, tips[i + 1][1]) - 2 * k)} ${P(tips[i + 1])}`
  }
  d += `Q${f(cx + W * 0.16)} ${f(top + (waist - top) * 0.42)} ${f(cx + 6 * k)} ${f(neck)}Z`
  art += `<path d="${d}" fill="url(#fanG)" stroke="#c9ced8" stroke-width="${f(0.6 * k)}"/>`
  // creases: a shadowed groove with a highlight beside it, from the waist up into each valley
  let grooves = ''
  for (const v of valleys) {
    const u = (v[0] - cx) / W
    grooves += `M${f(cx + u * 4 * k)} ${f(neck)}Q${f(cx + u * W * 0.22)} ${f(top + (waist - top) * 0.45)} ${P(v)}`
  }
  art += `<path d="${grooves}" fill="none" stroke="#c8cdd8" stroke-width="${f(1.1 * k)}"/><path d="${grooves}" fill="none" stroke="#ffffff" stroke-width="${f(0.8 * k)}" opacity=".9" transform="translate(${f(1.3 * k)} 0)"/>`
  return { art, top, W }
}

/** Greenery, ferns, florets and roses for one layer of the mandap, painted back to front. */
function bouquet(r: Rand) {
  const leaves = ['', '', '', '']
  const florets: Record<string, string> = {}
  let stems = ''
  let roses = ''
  const inside = (cx: number, cy: number, rx: number, ry: number) => {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r())
    return [cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry] as const
  }
  const leaf = (x: number, y: number, L: number, W: number, a: number, tone = Math.floor(r() * 4)) => (leaves[tone] += leafAt(x, y, L, W, a))
  const floret = (x: number, y: number, k: number) => {
    const c = FLORETS[Math.floor(r() * FLORETS.length)]
    florets[c] = (florets[c] ?? '') + circle(x, y, (1.1 + r() * 1.3) * k)
  }
  /** a frond arching out of the flowers, leaflets in pairs along it */
  const fern = (x: number, y: number, len: number, a: number, k: number) => {
    const bend = (r() - 0.5) * 0.8
    const at = (t: number) => {
      const b = a + bend * t
      return [x + Math.cos(b) * len * t, y + Math.sin(b) * len * t, b] as const
    }
    const [ex, ey] = at(1)
    const [mx, my] = at(0.5)
    stems += `M${f(x)} ${f(y)}Q${f(mx * 2 - (x + ex) / 2)} ${f(my * 2 - (y + ey) / 2)} ${f(ex)} ${f(ey)}`
    const tone = 2 + Math.floor(r() * 2)
    for (let t = 0.25; t < 1; t += 0.14) {
      const [px, py, b] = at(t)
      for (const side of [-1, 1]) leaf(px, py, 6 * k * (1.1 - t * 0.6), 1.8 * k, b + side * 0.95, tone)
    }
  }
  return {
    inside,
    leaf,
    floret,
    /** a mound of flowers filling an ellipse, with ferns arching out of its top */
    heap(cx: number, cy: number, rx: number, ry: number, k: number, lush = 1, ferns = 1) {
      const n = Math.max(3, Math.round(((rx * ry) / 60) * lush))
      for (let i = 0; i < n * 4; i++) {
        const [x, y] = inside(cx, cy, rx * 1.08, ry * 1.15)
        leaf(x, y, (8 + r() * 9) * k, (3 + r() * 2.4) * k, r() * Math.PI * 2)
      }
      for (let i = 0; i < n * 0.5 * ferns; i++) {
        const [x, y] = inside(cx, cy - ry * 0.4, rx * 0.95, ry * 0.6)
        // fronds lean away from the middle of the heap, like spilling over
        const lean = ((x - cx) / rx) * 1.1
        fern(x, y, (16 + r() * 22) * k, -Math.PI / 2 + lean + (r() - 0.5) * 0.7, k)
      }
      for (let i = 0; i < n * 3; i++) floret(...inside(cx, cy, rx, ry), k)
      for (let i = 0; i < n * 0.7; i++) {
        const [x, y] = inside(cx, cy, rx * 0.9, ry * 0.85)
        roses += rosette(x, y, (6 + r() * 8) * k, r() * 72, BLOOMS[Math.floor(r() * BLOOMS.length)])
      }
    },
    paint: () =>
      `<path d="${stems}" fill="none" stroke="#6f8f5c" stroke-width=".9" stroke-linecap="round"/>` +
      leaves.map((d, i) => `<path d="${d}" fill="${LEAF_TONES[i]}"/>`).join('') +
      Object.entries(florets)
        .map(([c, d]) => `<path d="${d}" fill="${c}"/>`)
        .join('') +
      roses,
  }
}

function mandap(r: Rand) {
  const G = FOOT + 2
  const far = bouquet(r)
  const near = bouquet(r)
  const feet = bouquet(r)
  let art = `<ellipse cx="${AX}" cy="${G + 2}" rx="210" ry="12" fill="#2c3a22" opacity=".12"/>`
  // the two fans behind, a little smaller and peeking out at the sides
  for (const m of [-1, 1]) {
    const x = AX + m * 138
    const c = fanColumn(x, G - 10, 0.74)
    art += c.art
    far.heap(x, c.top + 9, c.W * 0.85, 10, 0.74, 1.8)
    far.heap(x + m * c.W * 0.7, c.top + 26, 12, 16, 0.74, 1.2, 0.5) // spilling down the outside
    far.heap(x, G - 34, 30, 24, 0.74, 1.4, 0.6)
    for (let i = 0; i < 3; i++) FAIRY.push(pt(far.inside(x, c.top + 8, c.W * 0.8, 6)))
  }
  art += far.paint()
  // posies where the strands of lights are tied to the back fans
  const ties = bouquet(rng(47))
  for (const m of [-1, 1]) ties.heap(AX + m * 188, 590, 9, 7, 0.74, 2.4, 0.4)
  art += ties.paint()
  // the two in front
  for (const m of [-1, 1]) {
    const x = AX + m * 92
    const c = fanColumn(x, G, 1)
    art += c.art
    near.heap(x, c.top + 10, c.W * 0.86, 14, 1, 1.9)
    near.heap(x + m * c.W * 0.72, c.top + 30, 14, 20, 1, 1.3, 0.5)
    for (let i = 0; i < 6; i++) FAIRY.push(pt(near.inside(x, c.top + 8, c.W * 0.85, 9)))
    // flowers heaped round the foot of the cage and climbing it
    feet.heap(x, G - 32, 48, 28, 1, 1.5, 0.6)
    feet.heap(x, G - 74, 16, 20, 0.9, 1.3, 0.4)
  }
  // a dome of flowers bridging the front fans, the chandelier hanging beneath it
  const { top, chandelier: ch } = MANDAP
  near.heap(AX, top + 12, 40, 12, 1, 1.8)
  near.heap(AX, top + 30, 26, 18, 1, 1.8, 0.3)
  for (let i = 0; i < 16; i++) near.leaf(AX + (r() - 0.5) * 34, top + 40 + r() * 16, 7 + r() * 6, 2.6 + r() * 1.8, Math.PI / 2 + (r() - 0.5) * 1.2)
  for (let i = 0; i < 4; i++) FAIRY.push(pt(near.inside(AX, top + 20, 34, 14)))
  art += near.paint()
  // two tiers of crystal drops under a glass bowl
  let drops = ''
  let strings = ''
  for (const [n, w, sag, len] of [
    [13, 36, 9, 5],
    [7, 18, 6, 13],
  ]) {
    for (let i = 0; i < n; i++) {
      const x = ch.x - w / 2 + (i * w) / (n - 1)
      const y = ch.y + len + Math.sin((i / (n - 1)) * Math.PI) * sag
      strings += `M${f(x)} ${f(ch.y + 3)}V${f(y - 1.6)}`
      drops += `M${f(x)} ${f(y - 2.4)}l1.5 2.4-1.5 2.4-1.5-2.4Z`
    }
  }
  art += `<path d="M${ch.x} ${top + 46}V${ch.y - 9}" stroke="#c9a24a" stroke-width="1"/>
<ellipse cx="${ch.x}" cy="${ch.y - 7}" rx="9" ry="2.8" fill="none" stroke="#c9a24a" stroke-width="1.2"/>
<path d="${strings}" stroke="#dfe7ef" stroke-width=".6"/>
<path d="M${ch.x - 21} ${ch.y}Q${ch.x} ${ch.y + 17} ${ch.x + 21} ${ch.y}Q${ch.x} ${ch.y - 8} ${ch.x - 21} ${ch.y}Z" fill="url(#crystalG)" stroke="#d5dde6" stroke-width=".8"/>
<path d="${drops}" fill="#f7fbff" stroke="#c4d0dd" stroke-width=".5"/>`
  return `<g class="mandap">${art}${feet.paint()}</g>`
}
const pt = ([x, y]: readonly [number, number]) => ({ x, y })

/** Flowers spilling over the rim of an urn, round the topiary's stem. */
function urnFlowers(r: Rand, x: number, y: number, s: number) {
  const b = bouquet(r)
  b.heap(x, y - 47 * s, 24 * s, 7 * s, s * 0.85, 2.6, 0.6)
  return b.paint()
}

const SIDE_STRANDS = [strand(-60, 456, 300, 640, 613, 590, 16, 0, 0.45), strand(987, 590, 1300, 640, 1660, 456, 16, 0.12, 0.45)]
/** Lantern positions (filled while drawing the front layer) so their flames can glow. */
const LANTERNS: { x: number; y: number; s: number; i: number }[] = []

/** The wedding's decor (runner, chairs, light strands, mandap), split off from the lawn by front(). */
let decor: Art | null = null

/** The lawn the decor stands on: the same for every celebration. */
export function front(): Art {
  const r = rng(21)
  // lawn with mown stripes converging on the mandap
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
  // more petals drifted up against the mandap at the head of the aisle
  const rp = rng(43)
  for (let i = 0; i < 70; i++) {
    const y = FOOT + 2 + rp() ** 1.6 * 36
    const x = AX + (rp() - 0.5) * 2 * (hwAt(y) + 46)
    const s = 0.35 + rp() * 0.3
    petals += `<path d="${petalPath(7 * s, 5 * s)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rp() * 360)}) scale(1 .5)" fill="url(#ro-${rp() < 0.5 ? 'blush' : rp() < 0.5 ? 'ivory' : 'lilac'}-0)"/>`
  }
  // chairs, back to front: each row ends at the aisle in a heap of flowers, and every other row has a lantern standing in them
  let chairs = ''
  LANTERNS.length = 0
  const ra = rng(29)
  const rows = [790, 812, 838, 870, 910, 962, 1032]
  rows.forEach((y, ri) => {
    const s = scaleAt(y)
    for (let j = 2; j >= 0; j--) {
      const off = hwAt(y) + 22 * s + j * 32 * s
      chairs += chair(AX - off, y, s, j === 0) + chair(AX + off, y, s, j === 0)
    }
    const edge = bouquet(ra)
    // as lush at the far rows as the near ones: about seven of everything whatever the size
    for (const m of [-1, 1]) edge.heap(AX + m * (hwAt(y) + 9 * s), y - 5 * s, 15 * s, 8.5 * s, s, 3.3 / (s * s), 0.35)
    chairs += edge.paint()
    if (ri % 2 === 1)
      for (const m of [-1, 1]) {
        const l = { x: AX + m * (hwAt(y) + 4 * s), y: y + 4, s: s * 1.05, i: 0.15 + ri * 0.1 }
        LANTERNS.push(l)
        chairs += lantern(l.x, l.y, l.s)
      }
  })
  const strands = SIDE_STRANDS.map(strandArt).join('')
  FAIRY.length = 0
  const mandapArt = mandap(r)
  const ru = rng(37)
  const defs = `${roseDefs()}${HEDGE_TEX}
<linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6c288"/><stop offset=".5" stop-color="#8fb072"/><stop offset="1" stop-color="#729760"/></linearGradient>
<clipPath id="lawnClip"><path d="M-40 770C400 760 1200 760 1640 770V1010H-40Z"/></clipPath>
<linearGradient id="runnerG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece4d6"/><stop offset="1" stop-color="#f5efe5"/></linearGradient>
<linearGradient id="chairG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffefb"/><stop offset="1" stop-color="#e4dfd6"/></linearGradient>
<linearGradient id="sashG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c3c0"/><stop offset="1" stop-color="#dc9f9f"/></linearGradient>
<linearGradient id="stoneG" x1="0" x2="1"><stop offset="0" stop-color="#e2dccf"/><stop offset=".6" stop-color="#f3efe6"/><stop offset="1" stop-color="#d1c9b9"/></linearGradient>
<radialGradient id="ballG" cx=".62" cy=".3" r=".8"><stop offset="0" stop-color="#a9c792"/><stop offset=".55" stop-color="#6f9161"/><stop offset="1" stop-color="#486743"/></radialGradient>
<linearGradient id="fanG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d7dae4"/><stop offset=".3" stop-color="#f4f4f6"/><stop offset=".55" stop-color="#ffffff"/><stop offset=".85" stop-color="#e9eaf0"/><stop offset="1" stop-color="#cfd3de"/></linearGradient>
<linearGradient id="crystalG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe5f0"/></linearGradient>`
  decor = {
    defs,
    body: `<path d="M786 ${FOOT + 2}L814 ${FOOT + 2}L${AX + 262} 1010L${AX - 262} 1010Z" fill="url(#runnerG)"/>
<path d="M786 ${FOOT + 2}L${AX - 262} 1010M814 ${FOOT + 2}L${AX + 262} 1010" stroke="#e2dacd" stroke-width="1.2"/>
${rangoli(AX, FOOT + 8, 64, 0.11)}
<g class="petal-strew">${petals}</g>
${chairs}
${strands}
${mandapArt}`,
    // from the grasses on the mandap down to the nearest row of chairs
    box: [-40, 380, 1640, 1045],
  }
  return {
    defs,
    body: `<path d="M-40 770C400 760 1200 760 1640 770V1010H-40Z" fill="url(#lawnG)"/>
<path d="${stripes}" fill="#ffffff" opacity=".07" clip-path="url(#lawnClip)"/>
${meadow(rng(23))}
${border(r, -40, 650)}${border(r, 950, 1640)}
${(
  [
    [150, 800, 0.95],
    [460, 794, 0.8],
    [1140, 794, 0.8],
    [1450, 800, 0.95],
  ] as const
)
  .map(([x, y, k]) => urn(x, y, k) + urnFlowers(ru, x, y, k))
  .join('')}`,
    // the urns' topiary down to the front of the lawn
    box: [-40, 690, 1640, 1045],
  }
}

/** The wedding's decor on the lawn: the runner, chairs and lanterns, light strands and the mandap. */
export function mandapDecor(): Art {
  if (!decor) front()
  return decor!
}

/* ------------------------------------------------------------------ */
/* Foreground: out-of-focus roses (depth of field)                    */
/* ------------------------------------------------------------------ */

export function fg(): Art {
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
  return {
    defs: `${roseDefs()}<filter id="dof" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>`,
    body: `<g filter="url(#dof)">
<path d="${leaves}" fill="#4f7347"/>
${rosette(96, 962, 74, 12, 'blush')}${rosette(250, 1012, 56, 40, 'ivory')}${rosette(1500, 968, 70, 30, 'ivory')}${rosette(1362, 1016, 50, 8, 'peach')}
${rosette(586, 1018, 30, 20, 'blush')}${rosette(1016, 1020, 28, 50, 'ivory')}
</g>`,
    box: [-120, 820, 1720, 1200],
  }
}

/**
 * Time-of-day looks: the painted daylight layers are re-coloured once through
 * a colour matrix (the feColorMatrix maths, fitted to target colours), then
 * cross-faded by opacity while you scroll.
 *   warm  golden hour → sunset (whites → peach, greens → warm olive)
 *   moon  moonlight (whites → pale moon-blue, foliage → deep blue-teal)
 * Far layers get a lifted offset so they stay hazier.
 */
const matrix = (s: string) => s.trim().split(/\s+/).map(Number)
export const LOOKS = {
  warm: {
    near: matrix('0.900 -0.057 0.220 0 -0.004  0.308 0.520 0.159 0 -0.066  0.274 -0.208 0.809 0 -0.032  0 0 0 1 0'),
    far: matrix('0.900 -0.057 0.220 0 0.036  0.308 0.520 0.159 0 -0.026  0.274 -0.208 0.809 0 0.008  0 0 0 1 0'),
  },
  moon: {
    near: matrix('0.327 0.407 0.076 0 -0.25  0.195 0.503 0.0715 0 -0.17  0.2235 0.439 0.202 0 -0.115  0 0 0 1 0'),
    far: matrix('0.30 0.38 0.07 0 -0.17  0.18 0.47 0.066 0 -0.1  0.21 0.41 0.19 0 -0.05  0 0 0 1 0'),
  },
}

/* ------------------------------------------------------------------ */
/* Lights (never graded) and effects                                  */
/* ------------------------------------------------------------------ */

/**
 * The lights are drawn straight onto a canvas (stage.ts) so each can switch
 * on in turn as the evening comes: a group lights up once `lights` passes
 * its place `i` along the strands.
 */
export type GlowOp =
  /** a soft glow: `bulb` (tight, bright centre) or `warm` (broad wash), stretched to an ellipse */
  | { k: 'bulb' | 'warm'; x: number; y: number; rx: number; ry: number; a: number }
  /** a solid shape: lit window panes, a lantern flame, a bulb filament */
  | { k: 'shape'; d: string; fill: string; a: number }
export interface GlowGroup {
  i: number
  ops: GlowOp[]
}
export const GLOW_SPRITES = {
  bulb: [
    [0, '#ffd98c', 0.9],
    [0.35, '#ffc766', 0.32],
    [1, '#ffc766', 0],
  ],
  warm: [
    [0, '#ffd27a', 0.75],
    [1, '#ffd27a', 0],
  ],
} as const

const ellipsePath = (x: number, y: number, rx: number, ry: number) =>
  `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0`
const bulbs = (bs: { x: number; y: number; i: number }[], r: number): GlowGroup[] =>
  bs.map((b) => ({
    i: b.i,
    ops: [
      { k: 'bulb', x: b.x, y: b.y, rx: r, ry: r, a: 1 },
      { k: 'shape', d: circle(b.x, b.y, 3.4), fill: '#fff3c9', a: 1 },
    ],
  }))

/** Lights in the far garden: the glasshouse windows and the strand behind the mandap. */
export function glowBack(): GlowGroup[] {
  const x = 1240
  const g = 660
  let panes = ''
  for (let px = x - 49; px < x + 49; px += 9.2) panes += `M${f(px + 1)} ${g - 35}h7v12h-7ZM${f(px + 1)} ${g - 21}h7v12h-7Z`
  panes += `M${x - 69} ${g - 22}h8v13h-8ZM${x - 60} ${g - 22}h8v13h-8ZM${x + 52} ${g - 22}h8v13h-8ZM${x + 61} ${g - 22}h8v13h-8Z`
  return [
    {
      i: 0.55,
      ops: [
        { k: 'warm', x, y: g - 22, rx: 90, ry: 34, a: 0.38 },
        { k: 'shape', d: panes, fill: '#ffdc96', a: 0.78 },
        { k: 'shape', d: `M${x - 52} ${g - 37}Q${x} ${g - 66} ${x + 52} ${g - 37}Z`, fill: '#ffe4b0', a: 0.32 },
      ],
    },
    ...bulbs(BACK_STRAND.bulbs, 16),
  ]
}

/** Lights around the aisle: a warm wash under the mandap, its chandelier, the side strands and the lanterns. (Call after front().) */
export function glowFront(): GlowGroup[] {
  return [
    {
      i: 0.3,
      ops: [
        { k: 'warm', x: AX, y: FOOT - 110, rx: 200, ry: 150, a: 0.45 },
        { k: 'warm', x: AX, y: FOOT + 30, rx: 230, ry: 60, a: 0.35 },
      ],
    },
    {
      i: 0.25,
      ops: [
        { k: 'bulb', x: MANDAP.chandelier.x, y: MANDAP.chandelier.y + 3, rx: 40, ry: 40, a: 1 },
        { k: 'shape', d: ellipsePath(MANDAP.chandelier.x, MANDAP.chandelier.y + 3, 9, 4), fill: '#fff6dc', a: 0.9 },
      ],
    },
    ...SIDE_STRANDS.flatMap((st) => bulbs(st.bulbs, 22)),
    ...LANTERNS.map((l) => ({
      i: l.i,
      ops: [
        { k: 'warm', x: l.x, y: l.y - 16 * l.s, rx: 34 * l.s, ry: 34 * l.s, a: 1 },
        { k: 'shape', d: ellipsePath(l.x, l.y - 15.5 * l.s, 1.6 * l.s, 3.2 * l.s), fill: '#ffe6a6', a: 1 },
      ],
    }) as GlowGroup),
  ]
}

/** Fairy lights strung through the treetops, in two sets that twinkle out of step. (Call after back().) */
export function treeLights(): [GlowGroup, GlowGroup] {
  const r = rng(53)
  const sets: [GlowGroup, GlowGroup] = [
    { i: 0.62, ops: [] },
    { i: 0.7, ops: [] },
  ]
  for (const c of CANOPIES)
    for (let k = 0; k < c.R / 6; k++) {
      const a = r() * Math.PI * 2
      const q = Math.sqrt(r())
      const x = c.x + Math.cos(a) * q * c.R * 0.8
      const y = c.y + Math.sin(a) * q * c.R * 0.62
      sets[k % 2].ops.push({ k: 'bulb', x, y, rx: 5, ry: 5, a: 0.9 }, { k: 'shape', d: circle(x, y, 0.9 + r() * 0.5), fill: '#fff4d0', a: 1 })
    }
  return sets
}
export const TREE_LIGHT_BOX: Art['box'] = [-40, 520, 1640, 730]

/** Fairy lights woven through the garland, in two sets that twinkle out of step. (Call after front().) */
export function fairyLights(): [GlowGroup, GlowGroup] {
  const r = rng(41)
  const sets: [GlowGroup, GlowGroup] = [
    { i: 0.4, ops: [] },
    { i: 0.4, ops: [] },
  ]
  FAIRY.forEach((p, k) => {
    const core = 1.3 + r() * 1
    sets[k % 2].ops.push({ k: 'bulb', x: p.x, y: p.y, rx: 7, ry: 7, a: 1 }, { k: 'shape', d: circle(p.x, p.y, core), fill: '#fff4d0', a: 1 })
  })
  return sets
}
/** Where the fairy lights are, to size their canvases. */
export const FAIRY_BOX: Art['box'] = [590, 470, 1010, 800]

/** Sunbeams fanning out from the sun (centred on 0,0) and soft bokeh at the bottom corners after dark. */
export function fx(): { rays: Art; bokeh: Art } {
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
  return {
    rays: {
      defs: `<linearGradient id="rayG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff4d2" stop-opacity=".5"/><stop offset=".6" stop-color="#fff4d2" stop-opacity=".12"/><stop offset="1" stop-color="#fff4d2" stop-opacity="0"/></linearGradient><filter id="raySoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>`,
      body: `<g filter="url(#raySoft)">${rays}</g>`,
      box: [-1350, -760, 10, 660],
    },
    bokeh: {
      defs: `<radialGradient id="bokehG"><stop offset="0" stop-color="#ffd27a" stop-opacity=".42"/><stop offset=".72" stop-color="#ffcb6e" stop-opacity=".3"/><stop offset="1" stop-color="#ffcb6e" stop-opacity="0"/></radialGradient>`,
      body: bokeh,
      box: [0, 780, 1600, 1050],
    },
  }
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

const WING_L = 'M12 6.2C8 .4 2.2-.6.9 2.3C-.1 5.1 3.7 7.1 12 7.1ZM12 7.7C6.2 8.3 2.7 10.7 3.9 12.8C5.1 14.6 9.5 12 12 8.5Z'
const WING_R = 'M0 6.2C4 .4 9.8-.6 11.1 2.3C12.1 5.1 8.3 7.1 0 7.1ZM0 7.7C5.8 8.3 9.3 10.7 8.1 12.8C6.9 14.6 2.5 12 0 8.5Z'

/**
 * Butterflies flitting about the flowers by day. Each wing is its own little
 * element so the wingbeat is a transform the GPU animates; stage.ts places
 * them at their scene positions (`data-x`, `data-y`).
 */
export function butterflies() {
  const r = rng(71)
  const spots: [number, number][] = [
    [742, 700],
    [868, 664],
    [652, 752],
    [955, 758],
    [606, 806],
    [1012, 812],
    [330, 798],
    [1270, 798],
  ]
  const looks = [
    ['#ffffff', '#c9b4e4'],
    ['#fbf2c4', '#e2bf5c'],
    ['#fde4ea', '#e6a3b5'],
    ['#efe7fb', '#b49bd8'],
  ]
  return spots
    .map(([x, y], i) => {
      const [a, b] = looks[i % looks.length]
      const vars = [
        `--ax:${f(18 + r() * 28)}px`,
        `--ay:${f(8 + r() * 14)}px`,
        `--dur:${f(7 + r() * 6)}s`,
        `--delay:${f(-r() * 10)}s`,
        `--beat:${f(0.15 + r() * 0.08)}s`,
        `--a:${a}`,
        `--b:${b}`,
      ].join(';')
      return `<span class="bfly" data-x="${x}" data-y="${y}" style="${vars}"><span class="bfly-in"><svg class="wing wl" viewBox="0 0 12 14"><path d="${WING_L}"/><circle cx="2.6" cy="3" r="1.3"/><circle cx="5" cy="11.4" r=".9"/></svg><i class="bfly-body"></i><svg class="wing wr" viewBox="0 0 12 14"><path d="${WING_R}"/><circle cx="9.4" cy="3" r="1.3"/><circle cx="7" cy="11.4" r=".9"/></svg></span></span>`
    })
    .join('')
}

/** A few swallows crossing the afternoon sky. */
export function birds() {
  const r = rng(61)
  return Array.from({ length: 5 }, (_, i) => {
    const s = 0.6 + r() * 0.6
    return `<span class="bird b${i}" style="top:${f(10 + r() * 22)}%;--s:${f(s)};--dur:${f(26 + r() * 16)}s;--delay:${f(-r() * 30)}s"><svg viewBox="-12 -6 24 10"><path d="M-11 0Q-5 -6 0 0Q5 -6 11 0Q5 -3 0 1Q-5 -3 -11 0Z"/></svg></span>`
  }).join('') + doves()
}

/** A pair of white doves crossing the sky together. */
const doves = () =>
  [
    [17, 1.45, -12],
    [20.5, 1.3, -12.9],
  ]
    .map(
      ([top, s, delay]) =>
        `<span class="bird dove" style="top:${top}%;--s:${s};--dur:34s;--delay:${delay}s"><svg viewBox="-13 -7 26 11"><path d="M-12 .5C-8-6-3-5 0-.5C3-5 8-6 12 .5C7-2 3-1 0 1.6C-3-1-7-2-12 .5Z"/></svg></span>`,
    )
    .join('')
