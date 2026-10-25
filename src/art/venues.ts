import type { Art } from './scene'
import { circle, f, rng } from './util'

/*
 * The two venue scenes that take over from the garden for their celebration,
 * in the same 1600×1000 scene, anchored bottom-centre. Each is painted in its
 * own light (the shared sky shows above it), so neither is colour-graded.
 *
 *   palace  the Sangeet at SNJ Gold: a gold-lit Mughal facade at night —
 *           a great pink-gold dome over a cusped portal, lit arched bays,
 *           chhatris along the roofline, a red-carpet stair between deep-red roses
 *   bazaar  the Haldi: a soft, traditional Meena Bazaar — hanging marigold
 *           strands and pastel parasols, striped stalls, a draped haldi stage
 */

const AX = 800
type Rand = () => number
const gauss = (r: Rand) => (r() + r() + r() - 1.5) / 1.5

/** A pointed arch standing on `bottom`, springing at `spring`, rising to a point at `top`. */
const archPath = (cx: number, hw: number, top: number, spring: number, bottom: number) =>
  `M${f(cx - hw)} ${f(bottom)}V${f(spring)}C${f(cx - hw)} ${f(spring - (spring - top) * 0.55)} ${f(cx - hw * 0.35)} ${f(top + (spring - top) * 0.12)} ${f(cx)} ${f(top)}C${f(cx + hw * 0.35)} ${f(top + (spring - top) * 0.12)} ${f(cx + hw)} ${f(spring - (spring - top) * 0.55)} ${f(cx + hw)} ${f(spring)}V${f(bottom)}Z`

/** An onion dome on a base `w` wide at `base`, `h` tall, with a finial. */
function dome(cx: number, base: number, w: number, h: number, fill: string, finial = true) {
  const d = `M${f(cx - w * 0.42)} ${f(base)}C${f(cx - w * 0.66)} ${f(base - h * 0.28)} ${f(cx - w * 0.52)} ${f(base - h * 0.72)} ${f(cx)} ${f(base - h)}C${f(cx + w * 0.52)} ${f(base - h * 0.72)} ${f(cx + w * 0.66)} ${f(base - h * 0.28)} ${f(cx + w * 0.42)} ${f(base)}Z`
  let ribs = ''
  for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) ribs += `M${f(cx + k * w * 0.42)} ${f(base)}Q${f(cx + k * w * 0.62)} ${f(base - h * 0.55)} ${f(cx)} ${f(base - h)}`
  const top = finial
    ? `<path d="M${f(cx)} ${f(base - h)}V${f(base - h - h * 0.32)}" stroke="#f3cf7d" stroke-width="${f(w * 0.03)}"/>${[0.08, 0.18, 0.27].map((t) => `<ellipse cx="${f(cx)}" cy="${f(base - h - h * t)}" rx="${f(w * 0.05)}" ry="${f(w * 0.035)}" fill="#f6d68a"/>`).join('')}`
    : ''
  return `<path d="${d}" fill="${fill}"/><path d="${ribs}" fill="none" stroke="#fff3d6" stroke-opacity=".35" stroke-width="${f(w * 0.012)}"/><path d="M${f(cx - w * 0.48)} ${f(base)}H${f(cx + w * 0.48)}" stroke="#7a4a14" stroke-width="${f(w * 0.05)}"/>${top}`
}

/** A chhatri: a little domed pavilion on slender pillars. */
function chhatri(cx: number, base: number, w: number) {
  const h = w * 0.9
  let s = `<rect x="${f(cx - w * 0.55)}" y="${f(base - w * 0.1)}" width="${f(w * 1.1)}" height="${f(w * 0.1)}" fill="#a8701e"/>`
  for (const k of [-0.42, 0, 0.42]) s += `<rect x="${f(cx + k * w - w * 0.05)}" y="${f(base - h)}" width="${f(w * 0.1)}" height="${f(h - w * 0.1)}" fill="#e8b65a"/>`
  // the glow between the pillars
  s += `<rect x="${f(cx - w * 0.37)}" y="${f(base - h + w * 0.08)}" width="${f(w * 0.74)}" height="${f(h - w * 0.2)}" fill="url(#chhatriGlow)"/>`
  s += `<path d="M${f(cx - w * 0.62)} ${f(base - h)}H${f(cx + w * 0.62)}L${f(cx + w * 0.5)} ${f(base - h - w * 0.1)}H${f(cx - w * 0.5)}Z" fill="#c48a2e"/>`
  return s + dome(cx, base - h - w * 0.1, w * 1.05, w * 0.85, 'url(#domeSmall)')
}

/** Scalloped (multifoil) trim following an arch: little cusps all round its opening. */
function cusps(cx: number, hw: number, top: number, spring: number, n: number) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const t = i / n
    // walk the arch: up the left side's curve, over the point, down the right
    const a = Math.PI * (1 - t)
    const x = cx + Math.cos(a) * hw
    const y = spring - Math.sin(a) * (spring - top) * (0.85 + 0.15 * Math.sin(a))
    d += circle(x, y, hw * 0.075)
  }
  return d
}

export function palace(): Art {
  const r = rng(91)
  const ROOF = 468
  const BASE = 800
  // bays either side of the portal: centre x and half-width
  const bays: [number, number][] = []
  for (const k of [1, 2, 3, 4]) for (const m of [-1, 1]) bays.push([AX + m * (130 + (k - 1) * 185 + 92), 62])

  let walls = ''
  let niches = ''
  let trims = ''
  let jaali = ''
  let lamps = ''
  let tops = ''
  for (const [x, hw] of bays) {
    const top = 528
    const spring = 588
    walls += `<rect x="${f(x - 92)}" y="${ROOF}" width="184" height="${BASE - ROOF}" fill="url(#wall)"/>`
    // a carved panel framing the arch, a lit niche inside, a balustrade across its foot
    trims += `<rect x="${f(x - hw - 16)}" y="${top - 30}" width="${f(hw * 2 + 32)}" height="${BASE - 20 - top + 30}" fill="none" stroke="#ffe6a8" stroke-opacity=".55" stroke-width="2"/><rect x="${f(x - hw - 10)}" y="${top - 24}" width="${f(hw * 2 + 20)}" height="${BASE - 26 - top + 24}" fill="none" stroke="#8a5a18" stroke-opacity=".6" stroke-width="1.4"/>`
    niches += `<path d="${archPath(x, hw, top, spring, BASE - 34)}" fill="url(#nicheGlow)"/>`
    trims += `<path d="${archPath(x, hw, top, spring, BASE - 34)}" fill="none" stroke="#fff0c4" stroke-width="2.4"/><path d="${cusps(x, hw - 4, top + 6, spring, 12)}" fill="#f7d58a"/>`
    // a small chandelier hanging in each niche
    lamps += `<path d="M${x} ${top + 4}V${top + 46}" stroke="#ffe7a6" stroke-width="1.2"/><path d="M${x - 16} ${top + 50}Q${x} ${top + 64} ${x + 16} ${top + 50}Q${x} ${top + 44} ${x - 16} ${top + 50}Z" fill="#fff4cf"/>${[-12, -6, 0, 6, 12].map((dx) => `<path d="M${x + dx} ${top + 55}l1.6 4-1.6 5-1.6-5Z" fill="#fff8e0"/>`).join('')}`
    // a jaali screen above the panel and a balustrade at its foot
    jaali += `<rect x="${f(x - hw)}" y="${ROOF + 8}" width="${f(hw * 2)}" height="20" fill="url(#jaali)"/>`
    trims += `<rect x="${f(x - hw - 4)}" y="${BASE - 46}" width="${f(hw * 2 + 8)}" height="12" fill="url(#balusters)"/><rect x="${f(x - hw - 6)}" y="${BASE - 48}" width="${f(hw * 2 + 12)}" height="3" fill="#ffe2a0"/>`
    tops += chhatri(x, ROOF, 46 + r() * 4)
  }
  // pilasters between the bays, each with a slim finial
  let pilasters = ''
  for (const k of [0, 1, 2, 3, 4]) for (const m of [-1, 1]) {
    const x = AX + m * (130 + k * 185)
    pilasters += `<rect x="${x - 9}" y="${ROOF - 14}" width="18" height="${BASE - ROOF + 14}" fill="url(#pilaster)"/><path d="M${x} ${ROOF - 14}V${ROOF - 40}" stroke="#f3cf7d" stroke-width="2.5"/><circle cx="${x}" cy="${ROOF - 42}" r="3.6" fill="#f6d68a"/>`
  }

  // the portal: a tall cusped arch under the great dome
  const P = { hw: 92, top: 470, spring: 560 }
  const portal = `<rect x="${AX - 130}" y="${ROOF - 70}" width="260" height="${BASE - ROOF + 70}" fill="url(#wall)"/>
<rect x="${AX - 120}" y="${ROOF - 60}" width="240" height="${BASE - ROOF + 50}" fill="none" stroke="#ffe6a8" stroke-opacity=".7" stroke-width="2.4"/>
<rect x="${AX - 112}" y="${ROOF - 52}" width="224" height="${BASE - ROOF + 40}" fill="url(#jaaliFine)" opacity=".55"/>
<path d="${archPath(AX, P.hw + 12, P.top - 16, P.spring, BASE)}" fill="#7a4c14" opacity=".55"/>
<path d="${archPath(AX, P.hw, P.top, P.spring, BASE)}" fill="url(#portalGlow)"/>
<path d="${archPath(AX, P.hw, P.top, P.spring, BASE)}" fill="none" stroke="#fff3cc" stroke-width="3"/>
<path d="${cusps(AX, P.hw - 6, P.top + 10, P.spring, 16)}" fill="#fbe2a4"/>
<path d="M${AX} ${P.top + 18}V${P.top + 70}" stroke="#fff0c0" stroke-width="1.4"/>
<path d="M${AX - 34} ${P.top + 78}Q${AX} ${P.top + 102} ${AX + 34} ${P.top + 78}Q${AX} ${P.top + 66} ${AX - 34} ${P.top + 78}Z" fill="#fffaf0"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M${AX - 28 + i * 7} ${P.top + 86}l2 5-2 7-2-7Z" fill="#fffbea"/>`).join('')}
<rect x="${AX - 150}" y="${ROOF - 82}" width="300" height="14" fill="#c48a2e"/><rect x="${AX - 150}" y="${ROOF - 82}" width="300" height="3" fill="#ffe6a8"/>`
  const bigDome = `${dome(AX, ROOF - 82, 230, 176, 'url(#domeBig)')}
<rect x="${AX - 104}" y="${ROOF - 96}" width="208" height="16" fill="url(#jaali)"/>`
  const corners = [-1, 1].map((m) => chhatri(AX + m * 128, ROOF - 70, 52)).join('')

  // cornices: a row of little arches along the roofline and the plinth, strung with bulbs
  let arcade = ''
  for (let x = -40; x < 1640; x += 14) arcade += `M${x} ${ROOF + 2}a7 7 0 0 1 14 0`
  let bulbs = ''
  let halos = ''
  for (let x = -30; x < 1640; x += 22) {
    if (Math.abs(x - AX) < 130) continue
    bulbs += circle(x, ROOF - 4, 1.7)
    halos += circle(x, ROOF - 4, 7)
  }
  for (let x = -30; x < 1640; x += 26) {
    bulbs += circle(x, BASE - 4, 1.8)
    halos += circle(x, BASE - 4, 8)
  }

  // the stair: red carpet between gold edges, widening towards us
  let stair = ''
  for (let i = 0; i < 9; i++) {
    const y0 = BASE + i * 24
    const w0 = 150 + i * 30
    stair += `<path d="M${AX - w0} ${y0}H${AX + w0}L${AX + w0 + 15} ${y0 + 24}H${AX - w0 - 15}Z" fill="${i % 2 ? '#7a1622' : '#8e1d2a'}"/><path d="M${AX - w0} ${y0}H${AX + w0}" stroke="#d9a94c" stroke-width="1.6"/>`
  }
  const carpet = `<path d="M${AX - 70} ${BASE}H${AX + 70}L${AX + 150} 1045H${AX - 150}Z" fill="#a1202f" opacity=".85"/><path d="M${AX - 64} ${BASE}L${AX - 140} 1045M${AX + 64} ${BASE}L${AX + 140} 1045" stroke="#e6b45a" stroke-width="2"/>`

  // deep-red roses massed along the foot of the facade, either side of the stair
  const roses = ['', '', '']
  const leaves = ['', '']
  for (let i = 0; i < 900; i++) {
    const x = -40 + r() * 1680
    const y = BASE - 20 + Math.abs(gauss(r)) * 120 + r() * 10
    const inStair = Math.abs(x - AX) < 150 + (y - BASE) * 1.3 + 10
    if (inStair || y > 1050) continue
    const R = 5 + r() * 6 + (y - BASE) * 0.04
    if (r() < 0.35) leaves[i % 2] += circle(x + gauss(r) * 6, y + 4, R * 0.9)
    roses[Math.floor(r() * 3)] += circle(x, y, R)
  }

  // dark trees behind the facade, at either end
  let trees = ''
  for (let i = 0; i < 60; i++) {
    const side = i % 2 ? 1 : -1
    const x = AX + side * (420 + r() * 420)
    trees += circle(x, ROOF - 30 - r() * 80, 30 + r() * 40)
  }

  return {
    defs: `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b67b24"/><stop offset=".45" stop-color="#d9a246"/><stop offset="1" stop-color="#f0c165"/></linearGradient>
<linearGradient id="pilaster" x1="0" x2="1"><stop offset="0" stop-color="#8a5818"/><stop offset=".5" stop-color="#f4cf7c"/><stop offset="1" stop-color="#9c6620"/></linearGradient>
<radialGradient id="nicheGlow" cx=".5" cy=".55" r=".65"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffdf8e"/><stop offset="1" stop-color="#d48a24"/></radialGradient>
<radialGradient id="portalGlow" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fffdf4"/><stop offset=".4" stop-color="#ffe9b0"/><stop offset="1" stop-color="#e3a03a"/></radialGradient>
<radialGradient id="chhatriGlow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#e2a446"/></radialGradient>
<radialGradient id="domeBig" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe9d4"/><stop offset=".45" stop-color="#f3b896"/><stop offset=".85" stop-color="#c9784a"/><stop offset="1" stop-color="#9c5530"/></radialGradient>
<radialGradient id="domeSmall" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff0cc"/><stop offset=".5" stop-color="#eebd6a"/><stop offset="1" stop-color="#a36a22"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#fff2c0" stop-opacity=".8"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
<radialGradient id="bloomGold" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2008"/><stop offset="1" stop-color="#140a04"/></linearGradient>
<pattern id="jaali" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#7a4c14"/><path d="M5 0L10 5L5 10L0 5Z" fill="#ffd98a"/><circle cx="5" cy="5" r="1.4" fill="#7a4c14"/></pattern>
<pattern id="jaaliFine" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 1L11 6L6 11L1 6Z" fill="none" stroke="#ffe7aa" stroke-width=".8"/></pattern>
<pattern id="balusters" width="8" height="12" patternUnits="userSpaceOnUse"><rect width="8" height="12" fill="#8a5818"/><path d="M2 0h4c0 3-1.6 4-1.6 6s1.6 3 1.6 6h-4c0-3 1.6-4 1.6-6s-1.6-3-1.6-6Z" fill="#f4cf7c"/></pattern>`,
    body: `<path d="${trees}" fill="#0d1810"/>
<rect x="-40" y="${BASE}" width="1680" height="250" fill="url(#floorG)"/>
${walls}${pilasters}
<path d="${arcade}" fill="none" stroke="#ffe6a8" stroke-opacity=".7" stroke-width="1.4"/>
<rect x="-40" y="${ROOF - 4}" width="1680" height="6" fill="#a8701e"/><rect x="-40" y="${ROOF - 4}" width="1680" height="2" fill="#ffe2a0"/>
${jaali}${niches}${lamps}${trims}${tops}
${portal}${bigDome}${corners}
<rect x="-40" y="${BASE - 8}" width="1680" height="10" fill="#a8701e"/><rect x="-40" y="${BASE - 8}" width="1680" height="2" fill="#ffe2a0"/>
<path d="${halos}" fill="url(#halo)"/><path d="${bulbs}" fill="#fff8dc"/>
<ellipse cx="${AX}" cy="${BASE - 160}" rx="900" ry="330" fill="url(#bloomGold)"/>
${stair}${carpet}
<path d="${leaves[0]}" fill="#1f2a14"/><path d="${leaves[1]}" fill="#2c3a1c"/>
<path d="${roses[0]}" fill="#5c0c18"/><path d="${roses[1]}" fill="#86182a"/><path d="${roses[2]}" fill="#a82a38"/>`,
    box: [-40, 170, 1640, 1045],
  }
}

/* ------------------------------------------------------------------ */

/** A parasol hanging upside down from the canopy: a scalloped dome, ribs, a handle up to its string. */
function parasol(x: number, y: number, R: number, c: string, rim: string, tilt: number) {
  let scallop = ''
  const n = 8
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (i / n)
    scallop += `${i ? 'L' : 'M'}${f(x - Math.cos(a) * R)} ${f(y + Math.sin(a) * R * 0.5)}`
  }
  let ribs = ''
  for (let i = 1; i < n; i++) {
    const a = Math.PI * (i / n)
    ribs += `M${f(x)} ${f(y - R * 0.05)}L${f(x - Math.cos(a) * R)} ${f(y + Math.sin(a) * R * 0.5)}`
  }
  let fringe = ''
  for (let i = 0; i <= n * 2; i++) {
    const a = Math.PI * (i / (n * 2))
    fringe += circle(x - Math.cos(a) * R, y + Math.sin(a) * R * 0.5 + 3, 1.6)
  }
  return `<g transform="rotate(${f(tilt)} ${f(x)} ${f(y - R * 0.6)})"><path d="M${f(x)} ${f(y - R * 0.05)}V${f(y - R * 0.9)}" stroke="#8a6a3a" stroke-width="2"/><path d="${scallop}Q${f(x)} ${f(y - R * 0.5)} ${f(x - R)} ${f(y)}Z" fill="${c}"/><path d="${ribs}" fill="none" stroke="${rim}" stroke-width="1"/><path d="${fringe}" fill="${rim}"/></g>`
}

/** A striped stall with a scalloped awning, seen at an angle (`m` = which side of the aisle). */
function stall(x: number, y: number, w: number, h: number, stripes: [string, string], goods: string) {
  const awn = y - h
  let st = ''
  for (let i = 0; i < 8; i++) st += `<rect x="${f(x + (i * w) / 8)}" y="${f(awn - 26)}" width="${f(w / 16)}" height="26" fill="${stripes[1]}"/>`
  let scal = `M${f(x)} ${f(awn)}`
  for (let i = 0; i < 8; i++) scal += `a${f(w / 16)} ${f(w / 22)} 0 0 0 ${f(w / 8)} 0`
  return `<rect x="${f(x)}" y="${f(awn - 26)}" width="${f(w)}" height="26" fill="${stripes[0]}"/>${st}<path d="${scal}V${f(awn - 1)}H${f(x)}Z" fill="${stripes[0]}"/>
<rect x="${f(x + 4)}" y="${f(awn)}" width="5" height="${f(h)}" fill="#b98a5c"/><rect x="${f(x + w - 9)}" y="${f(awn)}" width="5" height="${f(h)}" fill="#b98a5c"/>
<rect x="${f(x + 9)}" y="${f(awn)}" width="${f(w - 18)}" height="${f(h * 0.62)}" fill="#fbf0e2"/>
<rect x="${f(x)}" y="${f(y - h * 0.34)}" width="${f(w)}" height="${f(h * 0.34)}" fill="#e7c49a"/><rect x="${f(x)}" y="${f(y - h * 0.34)}" width="${f(w)}" height="3" fill="#f6dfbd"/>${goods}`
}

export function bazaar(): Art {
  const r = rng(77)
  const FLOOR = 760
  const pastels = ['#f6c9cf', '#fbe3a1', '#cfe8d6', '#f9d3bd', '#e3d4f2', '#ffd27a']

  // overhead: strands of marigolds and hanging parasols, deepest (smallest) first
  let strands = ''
  const beads = ['', '', '']
  for (let x = -30; x < 1650; x += 13 + r() * 6) {
    const len = 90 + Math.abs(Math.sin(x / 90)) * 110 + r() * 50
    strands += `M${f(x)} 80V${f(80 + len)}`
    for (let y = 92; y < 80 + len; y += 9) beads[Math.floor(r() * 3)] += circle(x + gauss(r) * 0.8, y, 4.2)
  }
  let parasols = ''
  const spots: [number, number, number][] = []
  for (let i = 0; i < 26; i++) spots.push([-20 + r() * 1640, 240 + r() * 140, 24 + r() * 26])
  spots.sort((a, b) => a[2] - b[2])
  for (const [x, y, R] of spots) {
    const c = pastels[Math.floor(r() * pastels.length)]
    parasols += `<path d="M${f(x)} 80V${f(y - R * 0.9)}" stroke="#c9b08a" stroke-width=".8"/>` + parasol(x, y, R, c, '#ffffff', gauss(r) * 6)
  }
  // bunting across the top
  let bunting = ''
  for (const [y0, sag] of [
    [110, 50],
    [170, 40],
  ] as const) {
    for (let i = 0; i < 40; i++) {
      const x = -40 + i * 43
      const t = (x % 400) / 400
      const y = y0 + Math.sin(t * Math.PI) * sag
      bunting += `<path d="M${x} ${f(y)}l14 ${f(Math.sin(((x + 14) % 400) / 400 * Math.PI) * sag - Math.sin(t * Math.PI) * sag)}L${x + 7} ${f(y + 22)}Z" fill="${pastels[i % pastels.length]}"/>`
    }
  }

  // the haldi stage: a low carved platform, layered drapes, a marigold arch, a swing seat
  const S = { x0: AX - 190, x1: AX + 190, top: 430, base: FLOOR - 10 }
  let swags = ''
  for (const [i, c] of ['#fff4d0', '#ffd769', '#fff8e8', '#ffcc4d'].entries()) {
    const y = S.top + 30 + i * 22
    swags += `<path d="M${S.x0} ${y}Q${AX - 95} ${y + 70} ${AX} ${y}Q${AX + 95} ${y + 70} ${S.x1} ${y}V${y - 14}H${S.x0}Z" fill="${c}"/>`
  }
  let panels = ''
  for (let i = 0; i < 8; i++) {
    const x = S.x0 + i * ((S.x1 - S.x0) / 8)
    panels += `<rect x="${f(x)}" y="${S.top}" width="${f((S.x1 - S.x0) / 8)}" height="${S.base - S.top}" fill="${i % 2 ? '#fff2c6' : '#ffe08a'}"/>`
  }
  let arch = ''
  for (let i = 0; i <= 60; i++) {
    const a = Math.PI * (i / 60)
    arch += circle(AX - Math.cos(a) * 200, S.top + 40 - Math.sin(a) * 120 + (i % 2) * 3, 9 + (i % 3))
  }
  const legs = [-1, 1].map((m) => `M${AX + m * 200} ${S.top + 40}V${S.base}`).join('')
  let legFlowers = ''
  for (const m of [-1, 1]) for (let y = S.top + 40; y < S.base; y += 12) legFlowers += circle(AX + m * 200 + gauss(r) * 2, y, 9)
  const swing = `<path d="M${AX - 70} ${S.top + 70}V${S.base - 92}M${AX + 70} ${S.top + 70}V${S.base - 92}" stroke="#d08a1e" stroke-width="3" stroke-dasharray="6 3"/>
<rect x="${AX - 86}" y="${S.base - 96}" width="172" height="16" rx="3" fill="#a8743a"/><rect x="${AX - 80}" y="${S.base - 118}" width="160" height="24" rx="10" fill="#fff0d0"/>
<rect x="${AX - 84}" y="${S.base - 126}" width="34" height="34" rx="14" fill="#f6c9cf"/><rect x="${AX + 50}" y="${S.base - 126}" width="34" height="34" rx="14" fill="#f6c9cf"/>`
  const platform = `<rect x="${S.x0 - 30}" y="${S.base}" width="${S.x1 - S.x0 + 60}" height="26" fill="#c8945a"/><rect x="${S.x0 - 30}" y="${S.base}" width="${S.x1 - S.x0 + 60}" height="4" fill="#f0c890"/>
<path d="${Array.from({ length: 12 }, (_, i) => `M${S.x0 - 20 + i * 36} ${S.base + 8}h20v12h-20Z`).join('')}" fill="#e6b47a"/>`

  // stalls down either side, smaller towards the stage
  let stalls = ''
  const stripeSets: [string, string][] = [
    ['#fff6ec', '#f6b6c0'],
    ['#fff6ec', '#f7cf63'],
    ['#fff6ec', '#a8d6b8'],
    ['#fff6ec', '#f4b28a'],
  ]
  const goods = (x: number, y: number, w: number, kind: number) => {
    let g = ''
    if (kind === 0)
      for (let i = 0; i < 6; i++) g += `<ellipse cx="${f(x + w * 0.16 + i * w * 0.13)}" cy="${f(y)}" rx="${f(w * 0.05)}" ry="${f(w * 0.08)}" fill="none" stroke="${pastels[i % 6]}" stroke-width="3"/>` // bangles
    else if (kind === 1)
      for (let i = 0; i < 5; i++) g += `<path d="M${f(x + w * 0.14 + i * w * 0.17)} ${f(y + 8)}c-8 0-10-16 0-18c10 2 8 18 0 18Z" fill="${['#e9a06a', '#d98a52', '#f0b47a'][i % 3]}"/>` // matkas
    else for (let i = 0; i < 8; i++) g += `<circle cx="${f(x + w * 0.12 + i * w * 0.11)}" cy="${f(y)}" r="${f(w * 0.05)}" fill="${['#ffb534', '#ff8f1f', '#fff1a8'][i % 3]}"/>` // flowers
    return g
  }
  for (const m of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const k = 1 - i * 0.18
      const w = 150 * k
      const h = 210 * k
      const x = m < 0 ? AX - 240 - (i + 1) * 158 * (0.6 + k * 0.4) : AX + 240 + i * 158 * (0.6 + k * 0.4)
      const y = FLOOR + 40 - i * 12
      stalls = stall(x, y, w, h, stripeSets[(i + (m > 0 ? 2 : 0)) % 4], goods(x, y - h * 0.4, w, (i + (m > 0 ? 1 : 0)) % 3)) + stalls
    }
  }

  // the floor: a soft petal-strewn path and a rangoli before the stage
  let petals = ''
  for (let i = 0; i < 260; i++) {
    const y = FLOOR + 30 + r() ** 0.8 * 250
    const x = AX + gauss(r) * (80 + (y - FLOOR) * 1.1)
    petals += circle(x, y, 1.6 + (y - FLOOR) * 0.012)
  }
  let rangoli = ''
  for (const [k, n, c] of [
    [1, 28, '#f6b6c0'],
    [0.75, 22, '#ffd769'],
    [0.5, 16, '#fff6ec'],
    [0.28, 10, '#ff9b2f'],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      rangoli += `<ellipse cx="${f(AX + Math.cos(a) * 110 * k)}" cy="${f(FLOOR + 92 + Math.sin(a) * 24 * k)}" rx="${f(9 * k + 3)}" ry="${f(3 * k + 1.5)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(AX + Math.cos(a) * 110 * k)} ${f(FLOOR + 92 + Math.sin(a) * 24 * k)})" fill="${c}"/>`
    }
  }
  const urlis = [-1, 1]
    .map((m) => `<path d="M${AX + m * 250 - 34} ${FLOOR + 28}h68c-4 18-16 24-34 24s-30-6-34-24Z" fill="#c9922e"/><ellipse cx="${AX + m * 250}" cy="${FLOOR + 28}" rx="34" ry="7" fill="#f2c75c"/>${[-18, -6, 6, 18].map((dx) => `<circle cx="${AX + m * 250 + dx}" cy="${FLOOR + 24}" r="7" fill="${dx % 12 ? '#ff9b2f' : '#ffd23f'}"/>`).join('')}`)
    .join('')

  return {
    defs: `<linearGradient id="bzFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6cf"/><stop offset="1" stop-color="#efd5b4"/></linearGradient>
<linearGradient id="bzBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbeedd" stop-opacity="0"/><stop offset=".35" stop-color="#fbeedd" stop-opacity=".9"/><stop offset="1" stop-color="#f6e2c6"/></linearGradient>
<radialGradient id="bzLight" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>`,
    body: `<path d="M-40 520C200 480 420 500 600 470C760 450 860 470 1000 460C1200 450 1400 490 1640 470V780H-40Z" fill="#cfdcc0" opacity=".7"/>
<rect x="-40" y="360" width="1680" height="420" fill="url(#bzBack)"/>
<rect x="-40" y="${FLOOR}" width="1680" height="300" fill="url(#bzFloor)"/>
<path d="${petals}" fill="#ffb534" opacity=".75"/>
${rangoli}
${panels}${swags}
<path d="${legs}" stroke="#7da35e" stroke-width="10"/><path d="${legFlowers}" fill="#ffa21f"/>
<path d="${arch}" fill="#ff9b2f"/><path d="${arch}" fill="#ffd23f" transform="translate(0 -3)" opacity=".75"/>
${swing}${platform}
${stalls}${urlis}
<path d="${strands}" stroke="#d9a86a" stroke-width="1"/>
<path d="${beads[0]}" fill="#ff9b2f"/><path d="${beads[1]}" fill="#ffc93c"/><path d="${beads[2]}" fill="#fff0b8"/>
${bunting}${parasols}
<ellipse cx="${AX}" cy="420" rx="760" ry="320" fill="url(#bzLight)"/>`,
    box: [-40, 70, 1640, 1045],
  }
}
