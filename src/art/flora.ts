import { circle, f, leaf, rng } from './util'

type Kind = 'euc' | 'olive'
type Pt = [x: number, y: number, angle: number]

/**
 * Deterministic botanical corner — eucalyptus, olive, gypsophila and garden
 * roses — in a 600×600 box anchored at the top-left. Every stem, leaf and
 * petal is its own element so it can be grown in:
 *   .branch > .stem (pathLength=1, drawn)   .leaf/.dot[data-t] (popped along the stem)
 *   .bloom .petal (unfurled)   .bloom-core   .bud
 * Layers (.layer-back/mid/front) are parallaxed separately.
 */
export function flora(seed: number): string {
  const r = rng(seed)

  const walk = (x: number, y: number, ang: number, len: number) => {
    let a = ang
    let px = x
    let py = y
    const pts: Pt[] = []
    for (let i = 0; i <= len; i += 6) {
      a += (r() - 0.5) * 0.08
      px += Math.cos(a) * 6
      py += Math.sin(a) * 6
      pts.push([px, py, a])
    }
    return pts
  }

  /** Position a part; the inner group carries the class so it can scale from its own base. */
  const place = (x: number, y: number, deg: number, cls: string, t: number, body: string) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${Math.round(deg)})"><g class="${cls}" data-t="${t.toFixed(3)}">${body}</g></g>`

  const branch = (x: number, y: number, ang: number, len: number, size: number, kind: Kind) => {
    const pts = walk(x, y, ang, len)
    let leaves = ''
    pts.forEach((p, i) => {
      if (i % 3 || i < 2) return
      const t = i / pts.length
      const sc = size * (1 - t * 0.55)
      for (const side of [1, -1]) {
        const la = p[2] + side * (0.9 + r() * 0.3)
        const op = (0.6 + r() * 0.35).toFixed(2)
        const body =
          kind === 'euc'
            ? `<path d="${circle(sc, 0, sc * 0.82)}" fill="url(#euc)" fill-opacity="${op}"/>`
            : `<path d="${leaf(sc * 2, sc * 0.32)}" fill="url(#olive)" fill-opacity="${op}"/><path class="rib" d="M${f(sc * 0.25)} 0H${f(sc * 1.7)}"/>`
        leaves += place(p[0], p[1], (la * 180) / Math.PI, 'leaf', t, body)
      }
    })
    const d = `M${f(x)} ${f(y)}${pts.map((p) => `L${f(p[0])} ${f(p[1])}`).join('')}`
    return `<g class="branch"><path class="stem" pathLength="1" d="${d}"/>${leaves}</g>`
  }

  /** Gypsophila: a fine arching stem with tiny white blossoms on short sprigs. */
  const spray = (x: number, y: number, ang: number, len: number) => {
    const ex = x + Math.cos(ang) * len
    const ey = y + Math.sin(ang) * len
    const cx = x + Math.cos(ang + 0.18) * len * 0.55
    const cy = y + Math.sin(ang + 0.18) * len * 0.55
    let s = `<path class="stem fine" pathLength="1" d="M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}"/>`
    const tips: [number, number, number][] = [[ex, ey, 1]]
    for (let k = 0; k < 6; k++) {
      const t = 0.35 + k * 0.1
      const bx = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex
      const by = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey
      const ba = ang + (k % 2 ? 0.7 : -0.7) + (r() - 0.5) * 0.3
      const bl = 12 + r() * 16
      const tx = bx + Math.cos(ba) * bl
      const ty = by + Math.sin(ba) * bl
      s += `<path class="stem fine" pathLength="1" d="M${f(bx)} ${f(by)}L${f(tx)} ${f(ty)}"/>`
      tips.push([tx, ty, Math.min(1, t + 0.1)])
    }
    s += tips
      .map(([tx, ty, t]) =>
        place(tx, ty, 0, 'dot', t, `<circle r="${f(2.6 + r() * 1.2)}" fill="#fcf6f1" stroke="#dcc5b8" stroke-width=".6"/><circle r=".9" fill="#dcc29e"/>`),
      )
      .join('')
    return `<g class="branch">${s}</g>`
  }

  /** Garden rose: four rings of petals, each petal drawn from the centre outwards. */
  const bloom = (x: number, y: number, R: number) => {
    let petals = ''
    const rings: [count: number, scale: number, fill: string][] = [
      [6, 1, 'pet'],
      [5, 0.76, 'pet'],
      [5, 0.52, 'pet-deep'],
      [4, 0.3, 'pet-deep'],
    ]
    rings.forEach(([n, k, grad], ri) => {
      const rr = R * k
      const w = rr * (ri === 0 ? 0.62 : 0.56)
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + ri * 23 + (r() - 0.5) * 12
        petals += `<g transform="rotate(${Math.round(a)})"><path class="petal" d="M0 0C${f(-w)} ${f(-rr * 0.35)} ${f(-w * 0.8)} ${f(-rr)} 0 ${f(-rr)}C${f(w * 0.8)} ${f(-rr)} ${f(w)} ${f(-rr * 0.35)} 0 0Z" fill="url(#${grad})"/></g>`
      }
    })
    let core = `<circle r="${f(R * 0.11)}" fill="#e2c29c"/>`
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2
      const d = R * (0.08 + r() * 0.1)
      core += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="1.3" fill="#b08d5a"/>`
    }
    return `<g transform="translate(${x} ${y}) rotate(${Math.round(r() * 72)})"><g class="bloom">${petals}<g class="bloom-core">${core}</g></g></g>`
  }

  const bud = (x: number, y: number, R: number, a: number) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><g class="bud"><path d="M0 ${f(R)}C${f(-R * 0.7)} ${f(R * 0.2)} ${f(-R * 0.5)} ${f(-R * 0.9)} 0 ${f(-R)}C${f(R * 0.5)} ${f(-R * 0.9)} ${f(R * 0.7)} ${f(R * 0.2)} 0 ${f(R)}Z" fill="url(#pet)" stroke="#dcbcae" stroke-width=".5"/><path d="M0 ${f(R)}C${f(-R * 0.6)} ${f(R * 0.6)} ${f(-R * 0.7)} 0 ${f(-R * 0.3)} ${f(-R * 0.2)}C${f(-R * 0.1)} ${f(R * 0.3)} 0 ${f(R * 0.6)} 0 ${f(R)}ZM0 ${f(R)}C${f(R * 0.6)} ${f(R * 0.6)} ${f(R * 0.7)} 0 ${f(R * 0.3)} ${f(-R * 0.2)}C${f(R * 0.1)} ${f(R * 0.3)} 0 ${f(R * 0.6)} 0 ${f(R)}Z" fill="#9aa585" fill-opacity=".85"/></g></g>`

  const back =
    branch(20, 40, 0.55, 420, 16, 'euc') +
    branch(0, 120, 0.25, 360, 9, 'olive') +
    branch(10, 200, 0.05, 260, 12, 'euc') +
    spray(40, 20, 0.8, 250)
  const mid = branch(60, 10, 0.95, 330, 9, 'olive') + branch(110, 20, 1.25, 240, 13, 'euc') + spray(0, 100, 0.32, 280)
  const front =
    bud(250, 170, 13, 40) +
    bud(175, 250, 11, -20) +
    bud(320, 90, 10, 70) +
    bloom(120, 120, 58) +
    bloom(215, 85, 36) +
    bloom(80, 215, 40) +
    bloom(185, 180, 24)

  return `<g class="sway"><g class="layer-back">${back}</g><g class="layer-mid">${mid}</g><g class="layer-front">${front}</g></g>`
}
