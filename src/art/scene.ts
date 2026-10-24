import { circle, f, rng } from './util'

/**
 * The garden the whole day happens in: a rose arch at the end of a petal
 * aisle, white chairs, clipped hedges, string lights and lanterns, hills and
 * a treeline under a big sky. 1600×1000, anchored bottom-centre (slice), so
 * phones see the arch and aisle and wide screens see the whole garden.
 *
 * Every colour is a CSS variable (see animations/day.ts) so the time of day
 * can repaint the scene as you scroll. Layers inside .px groups take a little
 * pointer parallax on desktop.
 */

const AX = 800 // arch centre
const BASE = 762 // where the lawn meets the arch

function treeline(seed: number, y0: number, jitter: number) {
  const r = rng(seed)
  let d = `M-40 ${y0 + 40}V${y0}`
  let x = -40
  let y = y0
  while (x < 1640) {
    if (r() < 0.16) {
      // a cypress spire
      const w = 16 + r() * 12
      const h = 70 + r() * 60
      d += `C${f(x + w * 0.12)} ${f(y - h * 0.62)} ${f(x + w * 0.38)} ${f(y - h)} ${f(x + w / 2)} ${f(y - h)}C${f(x + w * 0.62)} ${f(y - h)} ${f(x + w * 0.88)} ${f(y - h * 0.62)} ${f(x + w)} ${f(y)}`
      x += w
    } else {
      const rr = 18 + r() * 30
      const ny = y0 + (r() - 0.5) * jitter
      d += `A${f(rr)} ${f(rr * 0.92)} 0 0 1 ${f(x + rr * 1.6)} ${f(ny)}`
      x += rr * 1.6
      y = ny
    }
  }
  return `${d}V1000H-40Z`
}

/** White chiavari-style chair, front view, standing on y. */
const chair = (x: number, y: number, s: number) =>
  `M${f(x - 11 * s)} ${f(y - 47 * s)}h${f(22 * s)}v${f(21 * s)}h${f(-22 * s)}Z` +
  `M${f(x - 8 * s)} ${f(y - 44 * s)}h${f(16 * s)}v${f(15 * s)}h${f(-16 * s)}Z` +
  `M${f(x - 1.5 * s)} ${f(y - 44 * s)}h${f(3 * s)}v${f(15 * s)}h${f(-3 * s)}Z` +
  `M${f(x - 13 * s)} ${f(y - 27 * s)}h${f(26 * s)}v${f(5 * s)}h${f(-26 * s)}Z` +
  `M${f(x - 12 * s)} ${f(y - 22 * s)}h${f(3 * s)}v${f(22 * s)}h${f(-3 * s)}Z` +
  `M${f(x + 9 * s)} ${f(y - 22 * s)}h${f(3 * s)}v${f(22 * s)}h${f(-3 * s)}Z`

/** Little garden lantern with a glow that lights at dusk. */
const lantern = (x: number, y: number, s: number) =>
  `<g><circle class="glow" cx="${f(x)}" cy="${f(y - 14 * s)}" r="${f(30 * s)}" fill="url(#lampGlow)"/>` +
  `<path class="lantern-frame" d="M${f(x - 7 * s)} ${f(y)}v${f(-22 * s)}h${f(14 * s)}v${f(22 * s)}ZM${f(x - 9 * s)} ${f(y - 22 * s)}L${f(x)} ${f(y - 31 * s)}L${f(x + 9 * s)} ${f(y - 22 * s)}Z"/>` +
  `<path class="lantern-glass" d="M${f(x - 4.5 * s)} ${f(y - 3 * s)}v${f(-16 * s)}h${f(9 * s)}v${f(16 * s)}Z"/>` +
  `<circle class="lantern-flame" cx="${f(x)}" cy="${f(y - 10 * s)}" r="${f(2.4 * s)}"/></g>`

/** Tiny rose for the arch garland (front view): petals in a spiral. */
const miniRose = (x: number, y: number, rr: number, tone: 'a' | 'b') =>
  `<g><circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" class="mr-${tone}"/><path class="mr-swirl" d="M${f(x)} ${f(y)}m${f(-rr * 0.25)} 0a${f(rr * 0.25)} ${f(rr * 0.25)} 0 1 1 ${f(rr * 0.5)} 0a${f(rr * 0.45)} ${f(rr * 0.45)} 0 1 1 ${f(-rr * 0.9)} 0a${f(rr * 0.68)} ${f(rr * 0.68)} 0 1 1 ${f(rr * 1.36)} 0"/></g>`

function arch() {
  const r = rng(21)
  // posts and a semicircular head, 16px timber
  const frame = `M712 ${BASE}V520A88 88 0 0 1 888 520V${BASE}H872V520A72 72 0 0 0 728 520V${BASE}Z`
  const lattice = [0.25, 0.5, 0.75]
    .map((t) => {
      const y = 520 + (BASE - 520) * t
      return `M712 ${f(y)}h16M872 ${f(y)}h16`
    })
    .join('')
  // garland: heavier on the left, trailing down the left post
  const spots: [number, number][] = [
    [714, 668],
    [710, 626],
    [713, 584],
    [714, 546],
  ]
  for (const deg of [192, 208, 226, 246, 266, 286, 304, 322]) {
    const a = (deg * Math.PI) / 180
    spots.push([AX + Math.cos(a) * 82, 520 + Math.sin(a) * 82])
  }
  spots.push([886, 548], [888, 590])
  let leaves = ''
  let roses = ''
  spots.forEach(([x, y], i) => {
    for (let k = 0; k < 4; k++) {
      const a = r() * 360
      const lx = x + (r() - 0.5) * 26
      const ly = y + (r() - 0.5) * 20
      leaves += `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="${f(7 + r() * 4)}" ry="${f(3 + r() * 1.5)}" transform="rotate(${f(a)} ${f(lx)} ${f(ly)})"/>`
    }
    const n = i % 3 === 0 ? 3 : 2
    for (let k = 0; k < n; k++) roses += miniRose(x + (r() - 0.5) * 20, y + (r() - 0.5) * 16, 7 + r() * 5, r() < 0.5 ? 'a' : 'b')
  })
  // greenery trailing from the head
  const trails = [
    [742, 470, 728, 590],
    [858, 474, 874, 560],
  ]
    .map(([x0, y0, x1, y1]) => `M${x0} ${y0}C${x0 - 10} ${(y0 + y1) / 2} ${x1 + 12} ${(y0 + y1) / 2} ${x1} ${y1}`)
    .join('')
  return `<g class="arch"><path class="arch-wood" d="${frame}"/><path class="arch-lattice" d="${lattice}"/><path class="arch-trail" d="${trails}"/><g class="arch-leaves">${leaves}</g><g class="arch-roses">${roses}</g></g>`
}

/** Festoon: bulbs along a quadratic catenary, each with a glow that lights at dusk. */
function festoon(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number) {
  let bulbs = ''
  for (let i = 1; i < n; i++) {
    const t = i / n
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
    bulbs += `<circle class="glow" cx="${f(x)}" cy="${f(y + 6)}" r="20" fill="url(#bulbGlow)"/><path class="bulb-cap" d="M${f(x - 1.6)} ${f(y)}h3.2v3h-3.2Z"/><circle class="bulb" cx="${f(x)}" cy="${f(y + 6.5)}" r="4.2"/>`
  }
  return `<path class="wire" d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}"/>${bulbs}`
}

function lawnDetails() {
  const r = rng(8)
  // aisle petals, more of them (and larger) nearer the viewer
  let petals = ''
  for (let i = 0; i < 70; i++) {
    const t = Math.sqrt(r())
    const y = BASE + 4 + t * 236
    const hw = 20 + ((y - BASE) / 238) * 260
    const side = r() < 0.5 ? -1 : 1
    const x = AX + side * hw * (0.55 + r() * 0.5)
    const s = 0.5 + t * 1.6
    petals += `<ellipse class="${r() < 0.5 ? 'pa' : 'pb'}" cx="${f(x)}" cy="${f(y)}" rx="${f(3.4 * s)}" ry="${f(2 * s)}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`
  }
  // rows of chairs in perspective
  let chairs = ''
  let shadows = ''
  for (const y of [792, 818, 850, 890, 940, 1004]) {
    const s = 0.36 + ((y - 770) / 230) * 0.95
    const hw = 20 + ((y - BASE) / 238) * 260
    for (let j = 0; j < 3; j++) {
      const off = hw + 22 * s + j * 34 * s
      for (const x of [AX - off, AX + off]) {
        chairs += chair(x, y, s)
        shadows += `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(15 * s)}" ry="${f(2.6 * s)}"/>`
      }
    }
  }
  let lanterns = ''
  for (const y of [806, 862, 936]) {
    const s = 0.5 + ((y - 770) / 230) * 1.1
    const hw = 20 + ((y - BASE) / 238) * 260
    lanterns += lantern(AX - hw + 6, y, s) + lantern(AX + hw - 6, y, s)
  }
  return { petals, chairs, shadows, lanterns }
}

function hedges() {
  const left = `M-40 790V748C-40 740 -34 736 -26 736H648C656 736 660 740 660 748V790Z`
  const right = `M940 790V748C940 740 944 736 952 736H1640V790Z`
  let topiary = ''
  for (const x of [90, 300, 520, 1080, 1300, 1510]) topiary += `M${x - 3} 738V716h6v22Z${circle(x, 704, 24)}`
  return `<path class="hedge" d="${left}${right}"/><path class="topiary" d="${topiary}"/>`
}

function foreground(seed: number, x0: number, x1: number) {
  const r = rng(seed)
  let blades = ''
  let flowers = ''
  for (let i = 0; i < 34; i++) {
    const x = x0 + r() * (x1 - x0)
    const h = 70 + r() * 150
    const w = 5 + r() * 6
    const lean = (r() - 0.5) * 70
    blades += `M${f(x - w / 2)} 1000Q${f(x + lean * 0.3)} ${f(1000 - h * 0.5)} ${f(x + lean)} ${f(1000 - h)}Q${f(x + lean * 0.3 + w * 0.4)} ${f(1000 - h * 0.45)} ${f(x + w / 2)} 1000Z`
    if (i % 5 === 0) {
      const fx = x + lean
      const fy = 1000 - h - 6
      flowers += `<g class="wild">${[0, 72, 144, 216, 288]
        .map((a) => `<ellipse cx="${f(fx)}" cy="${f(fy - 6)}" rx="3.2" ry="6.4" transform="rotate(${a} ${f(fx)} ${f(fy)})"/>`)
        .join('')}<circle class="wild-c" cx="${f(fx)}" cy="${f(fy)}" r="2.6"/></g>`
    }
  }
  return `<path class="blades" d="${blades}"/>${flowers}`
}

/** Soft cumulus made of overlapping lobes; each drifts on its own slow loop. */
function clouds() {
  const r = rng(17)
  const cloud = (x: number, y: number, s: number) => {
    const lobes: [number, number, number][] = [[-60, 6, 34], [-24, -10, 44], [22, -18, 52], [66, -2, 38], [100, 10, 26], [0, 14, 40]]
    const shade = `<ellipse class="cloud-shade" cx="${f(x + 20 * s)}" cy="${f(y + 20 * s)}" rx="${f(112 * s)}" ry="${f(20 * s)}"/>`
    return (
      shade +
      lobes
        .map(([dx, dy, rr]) => `<ellipse cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" rx="${f(rr * s * (1 + r() * 0.2))}" ry="${f(rr * s * 0.62)}"/>`)
        .join('')
    )
  }
  return [
    [260, 170, 1.1],
    [720, 110, 0.8],
    [1020, 330, 0.7],
    [1460, 200, 1],
  ]
    .map(([x, y, s], i) => `<g class="cloud c${i}">${cloud(x, y, s)}</g>`)
    .join('')
}

function stars() {
  const r = rng(5)
  const groups = ['', '', '']
  for (let i = 0; i < 110; i++) {
    const x = r() * 1600
    const y = r() * 560
    groups[i % 3] += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + r() * 1.4)}"/>`
  }
  return groups.map((g, i) => `<g class="twinkle t${i}">${g}</g>`).join('')
}

export function scene() {
  const { petals, chairs, shadows, lanterns } = lawnDetails()
  const v = (name: string) => `style="stop-color:var(--${name})"`
  return `<svg class="scene" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<radialGradient id="sunGlow"><stop offset="0" ${v('sun-glow')} stop-opacity=".9"/><stop offset=".35" ${v('sun-glow')} stop-opacity=".35"/><stop offset="1" ${v('sun-glow')} stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#e9ecff" stop-opacity=".5"/><stop offset="1" stop-color="#e9ecff" stop-opacity="0"/></radialGradient>
<radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffd88a" stop-opacity=".85"/><stop offset=".4" stop-color="#ffc766" stop-opacity=".3"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient>
<radialGradient id="lampGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".8"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
<linearGradient id="lawnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ${v('lawn-a')}/><stop offset="1" ${v('lawn-b')}/></linearGradient>
<radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#05081a" stop-opacity="0"/><stop offset="1" stop-color="#05081a" stop-opacity=".55"/></radialGradient>
</defs>
<g class="sky-stars">${stars()}</g>
<g class="moon"><circle r="200" fill="url(#moonGlow)"/><circle r="30" fill="#f6f2e8"/><circle cx="-9" cy="-6" r="5.5" fill="#e3ddcd" opacity=".7"/><circle cx="10" cy="9" r="3.6" fill="#e3ddcd" opacity=".6"/><circle cx="6" cy="-12" r="2.4" fill="#e3ddcd" opacity=".6"/></g>
<g class="sun"><circle r="330" fill="url(#sunGlow)"/><circle class="sun-disc" r="56"/></g>
<g class="clouds">${clouds()}</g>
<g class="land">
<g class="px" data-depth="5"><path class="hill-far" d="M-40 662C140 612 300 602 470 630C610 652 700 614 860 600C1010 587 1150 642 1300 624C1420 610 1520 618 1640 632V1000H-40Z"/></g>
<g class="px" data-depth="9"><path class="trees-far" d="${treeline(3, 676, 22)}"/></g>
<g class="px" data-depth="14"><path class="trees" d="${treeline(9, 716, 16)}"/>${festoon(300, 388, AX, 520, 1300, 388, 16).replace(/class="wire"/, 'class="wire wire-back"')}</g>
<g class="px" data-depth="20">
${hedges()}
<path class="lawn" d="M-40 770C500 756 1100 756 1640 770V1000H-40Z" fill="url(#lawnGrad)"/>
<path class="aisle" d="M782 ${BASE}L818 ${BASE}L1082 1004L518 1004Z"/>
<g class="aisle-petals">${petals}</g>
<g class="chair-shade">${shadows}</g>
<path class="chairs" d="${chairs}" fill-rule="evenodd"/>
<g class="lanterns">${lanterns}</g>
<g class="festoons">${festoon(-60, 330, 330, 560, 714, 440, 14)}${festoon(886, 440, 1270, 560, 1660, 330, 14)}</g>
${arch()}
</g>
</g>
<g class="px fg" data-depth="34">${foreground(31, -20, 300)}${foreground(47, 1300, 1620)}</g>
<rect class="vignette" x="-40" y="-40" width="1680" height="1080" fill="url(#vignette)"/>
</svg>`
}

/** Fireflies: an HTML layer so they can drift anywhere and gather into a heart. */
export function fireflies(n: number) {
  const r = rng(13)
  return Array.from({ length: n }, () => {
    const vars = [
      `left:${f(4 + r() * 92)}%`,
      `top:${f(18 + r() * 70)}%`,
      `--dx:${f((r() - 0.5) * 80)}px`,
      `--dy:${f((r() - 0.5) * 60)}px`,
      `--dur:${f(5 + r() * 6)}s`,
      `--blink:${f(1.6 + r() * 2.4)}s`,
      `--delay:${f(-r() * 8)}s`,
    ].join(';')
    return `<span class="ff" style="${vars}"><span class="ff-dot"></span></span>`
  }).join('')
}
