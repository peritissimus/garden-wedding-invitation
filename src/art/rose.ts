import { f, leaf, rng } from './util'

/** Centre of the rose in its 600×600 box. */
export const C = 300

/** Rose petal pointing up from its base at the origin: rounded with a softly notched rim. */
export const petalPath = (L: number, W: number) =>
  `M0 0C${f(-W * 0.55)} ${f(-L * 0.18)} ${f(-W * 0.98)} ${f(-L * 0.62)} ${f(-W * 0.62)} ${f(-L * 0.93)}C${f(-W * 0.38)} ${f(-L * 1.06)} ${f(-W * 0.14)} ${f(-L * 0.98)} 0 ${f(-L * 1.01)}C${f(W * 0.14)} ${f(-L * 0.98)} ${f(W * 0.38)} ${f(-L * 1.06)} ${f(W * 0.62)} ${f(-L * 0.93)}C${f(W * 0.98)} ${f(-L * 0.62)} ${f(W * 0.55)} ${f(-L * 0.18)} 0 0Z`

const rimPath = (L: number, W: number) =>
  `M${f(-W * 0.62)} ${f(-L * 0.93)}C${f(-W * 0.38)} ${f(-L * 1.06)} ${f(-W * 0.14)} ${f(-L * 0.98)} 0 ${f(-L * 1.01)}C${f(W * 0.14)} ${f(-L * 0.98)} ${f(W * 0.38)} ${f(-L * 1.06)} ${f(W * 0.62)} ${f(-L * 0.93)}`

/** Rings from the outside in. Real roses open outer petals first. */
export const RINGS = [
  { n: 6, L: 168, W: 112, d: 18, off: 0 },
  { n: 6, L: 138, W: 92, d: 12, off: 30 },
  { n: 5, L: 108, W: 74, d: 8, off: 14 },
  { n: 5, L: 80, W: 56, d: 5, off: 50 },
  { n: 4, L: 52, W: 38, d: 2, off: 22 },
]

/**
 * An old garden rose seen from above. Every petal is its own group
 * (.rp[data-ring]) rotating about the centre, so the bloom can open ring by
 * ring from a tight bud. Leaves and sepals sit underneath.
 */
export function rose() {
  const r = rng(4)
  const at = (a: number, body: string, cls: string, extra = '') =>
    `<g transform="translate(${C} ${C}) rotate(${f(a)})"><g class="${cls}"${extra}>${body}</g></g>`

  const leaves = [148, 262, 28]
    .map((a, i) => {
      const L = 236 - i * 14
      const W = 50
      return at(
        a,
        `<g transform="rotate(-90)"><path d="${leaf(L, W)}" fill="url(#rleaf)"/><path class="rleaf-rib" d="M8 0H${f(L * 0.9)}${[0.3, 0.5, 0.7]
          .map((t) => `M${f(L * t)} 0l${f(L * 0.12)} ${f(-W * 0.5)}M${f(L * t)} 0l${f(L * 0.12)} ${f(W * 0.5)}`)
          .join('')}"/></g>`,
        'rleaf',
      )
    })
    .join('')

  const sepals = Array.from({ length: 5 }, (_, i) =>
    at(i * 72 + 18, `<g transform="rotate(-90)"><path d="${leaf(84, 8)}" fill="#7f9a6c"/></g>`, 'sepal'),
  ).join('')

  const fills = ['url(#rp1)', 'url(#rp2)', 'url(#rp3)', 'url(#rp4)', 'url(#rp5)']
  let petals = ''
  RINGS.forEach((ring, k) => {
    for (let i = 0; i < ring.n; i++) {
      const a = ring.off + (360 / ring.n) * i + (r() - 0.5) * 8
      const L = ring.L * (0.94 + r() * 0.12)
      const W = ring.W * (0.94 + r() * 0.12)
      petals += at(
        a,
        `<g transform="translate(0 ${-ring.d})"><path d="${petalPath(L, W)}" fill="${fills[k]}"/><path class="rp-rim" d="${rimPath(L, W)}"/><path class="rp-vein" d="M0 -8Q${f(W * 0.08)} ${f(-L * 0.5)} 0 ${f(-L * 0.84)}"/></g>`,
        'rp',
        ` data-ring="${k}"`,
      )
    }
  })

  /*
   * The heart of the rose: a tight spiral of cupped petals, each wrapping part
   * of the way round the centre, smaller and deeper as they go in, with shadow
   * between them and light catching their rims. It turns and opens with the
   * innermost ring, and stays crisp when the camera dives into it.
   */
  const P = (cx: number, cy: number, R: number, a: number) => `${f(cx + Math.cos(a) * R)} ${f(cy + Math.sin(a) * R)}`
  let cups = ''
  const n = 9
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const R = 46 * (1 - t * 0.8)
    const a0 = i * 2.4 + (r() - 0.5) * 0.3 // golden-angle turns, so the folds spiral
    const span = 3.3 + r() * 0.8
    const a1 = a0 + span
    const mid = (a0 + a1) / 2
    // the inner edge is an arc of a smaller circle pushed out along the petal's middle: thick in the middle, fine at the tips
    const ox = Math.cos(mid) * R * 0.34
    const oy = Math.sin(mid) * R * 0.34
    const Ri = R * 0.74
    const big = span > Math.PI ? 1 : 0
    const d = `M${P(0, 0, R, a0)}A${f(R)} ${f(R)} 0 ${big} 1 ${P(0, 0, R, a1)}Q${P(0, 0, R * 0.93, a1 + 0.12)} ${P(ox, oy, Ri, a1 - 0.05)}A${f(Ri)} ${f(Ri)} 0 ${big} 0 ${P(ox, oy, Ri, a0 + 0.05)}Q${P(0, 0, R * 0.93, a0 - 0.12)} ${P(0, 0, R, a0)}Z`
    const rim = `M${P(0, 0, R, a0 + 0.15)}A${f(R)} ${f(R)} 0 ${big} 1 ${P(0, 0, R, a1 - 0.15)}`
    // each petal casts a soft shadow onto the one inside it
    cups += `<path d="${d}" fill="#8f4650" opacity=".28" transform="translate(${f(-ox * 0.4 + Math.cos(mid) * 2.2)} ${f(-oy * 0.4 + Math.sin(mid) * 2.2)})"/><path d="${d}" fill="url(#rcup)" transform="translate(${f(-ox * 0.4)} ${f(-oy * 0.4)})"/><path d="${rim}" fill="none" stroke="#fff4f1" stroke-opacity="${(0.55 + t * 0.3).toFixed(2)}" stroke-width="${f(1.6 - t * 0.9)}" stroke-linecap="round"/>`
  }
  // the last tight curl at the very centre
  const curl = `M3 0A3 3 0 1 1 0 -3A5.5 5.5 0 0 1 5.5 1.5A8 8 0 0 1 -4 7`
  const core = at(
    0,
    `<circle r="50" fill="url(#rwell)"/>${cups}<path d="${curl}" fill="none" stroke="#a9565f" stroke-width="1.6" stroke-linecap="round"/><circle r="2.2" fill="#8f4650"/>`,
    'rp rose-core',
    ` data-ring="${RINGS.length - 1}"`,
  )

  return `<svg class="rose" viewBox="0 0 600 600" aria-hidden="true">
<defs>
${[
  ['rp1', '#e6a9a3', '#f3cfc8', '#fbeee9'],
  ['rp2', '#df9d98', '#f0c4bd', '#fae6e0'],
  ['rp3', '#d58e8c', '#eab5b0', '#f6dcd6'],
  ['rp4', '#c97f80', '#e2a7a4', '#f2d0cb'],
  ['rp5', '#b86f73', '#d89696', '#eec2bf'],
]
  .map(([id, a, b, c]) => `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`)
  .join('')}
<linearGradient id="rleaf" x1="0" x2="1"><stop stop-color="#5f7f55"/><stop offset="1" stop-color="#9ab38a"/></linearGradient>
<radialGradient id="rheart" cx=".5" cy=".5" r=".5"><stop stop-color="#fff8e4" stop-opacity=".7"/><stop offset=".4" stop-color="#f9dc93" stop-opacity=".3"/><stop offset="1" stop-color="#f7d27a" stop-opacity="0"/></radialGradient>
<radialGradient id="rwell" cx=".5" cy=".5" r=".5"><stop stop-color="#9c4b56"/><stop offset=".55" stop-color="#c06f76" stop-opacity=".85"/><stop offset="1" stop-color="#d98d90" stop-opacity="0"/></radialGradient>
<linearGradient id="rcup" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7d6d1"/><stop offset=".5" stop-color="#e3a3a2"/><stop offset="1" stop-color="#b9666f"/></linearGradient>
</defs>
<g class="rose-zoom">
<g class="rose-leaves">${leaves}</g>
<g class="rose-sepals">${sepals}</g>
<g class="rose-petals">${petals}${core}</g>
<g class="rose-heart"><circle cx="${C}" cy="${C}" r="26" fill="url(#rheart)"/></g>
</g>
</svg>`
}
