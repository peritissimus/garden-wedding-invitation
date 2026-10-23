/**
 * Deterministic botanical corner: eucalyptus + olive sprigs and soft blooms.
 * Returned as layered <g> groups so each layer can be parallaxed separately.
 */
type Leaf = 'euc' | 'olive'

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646)
}

const f = (n: number) => n.toFixed(1)

export function flora(seed: number): string {
  const r = rng(seed)

  const branch = (x: number, y: number, ang: number, len: number, leaf: number, kind: Leaf) => {
    let a = ang, px = x, py = y
    const pts: [number, number, number][] = []
    for (let i = 0; i <= len; i += 6) {
      a += (r() - 0.5) * 0.08
      px += Math.cos(a) * 6
      py += Math.sin(a) * 6
      pts.push([px, py, a])
    }
    let s = `<path class="stem" d="M${x} ${y}${pts.map((p) => ` L${f(p[0])} ${f(p[1])}`).join('')}" fill="none" stroke="#7d8869" stroke-width="1.1" stroke-linecap="round"/>`
    pts.forEach((p, i) => {
      if (i % 3 || i < 2) return
      const sc = leaf * (1 - (i / pts.length) * 0.55)
      for (const side of [1, -1]) {
        const la = p[2] + side * (0.9 + r() * 0.3)
        const deg = (la * 180) / Math.PI
        const op = (0.55 + r() * 0.35).toFixed(2)
        if (kind === 'euc') {
          const cx = p[0] + Math.cos(la) * sc * 0.9, cy = p[1] + Math.sin(la) * sc * 0.9
          s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(sc * 0.85)}" ry="${f(sc * 0.75)}" fill="url(#euc)" opacity="${op}" transform="rotate(${deg.toFixed(0)} ${f(cx)} ${f(cy)})"/>`
        } else {
          s += `<path d="M0 0C${f(sc * 0.5)} ${f(-sc * 0.28)} ${f(sc * 1.4)} ${f(-sc * 0.22)} ${f(sc * 2)} 0C${f(sc * 1.4)} ${f(sc * 0.22)} ${f(sc * 0.5)} ${f(sc * 0.28)} 0 0Z" fill="url(#olive)" opacity="${op}" transform="translate(${f(p[0])} ${f(p[1])}) rotate(${deg.toFixed(0)})"/>`
        }
      }
    })
    return s
  }

  const bloom = (x: number, y: number, R: number) => {
    let s = `<g class="bloom" style="transform-origin:${x}px ${y}px"><g transform="translate(${x} ${y}) rotate(${(r() * 72).toFixed(0)})">`
    for (let k = 0; k < 3; k++) {
      const rr = R * (1 - k * 0.28)
      for (let i = 0; i < 5; i++)
        s += `<path d="M0 0C${f(-rr * 0.55)} ${f(-rr * 0.4)} ${f(-rr * 0.45)} ${f(-rr)} 0 ${f(-rr)}C${f(rr * 0.45)} ${f(-rr)} ${f(rr * 0.55)} ${f(-rr * 0.4)} 0 0Z" fill="url(#pet)" stroke="#d9b9ab" stroke-width=".5" opacity="${(0.92 - k * 0.1).toFixed(2)}" transform="rotate(${i * 72 + k * 36})"/>`
    }
    for (let i = 0; i < 9; i++) {
      const a = r() * 6.28, d = r() * R * 0.14
      s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="1.4" fill="#b08d5a"/>`
    }
    return s + '</g></g>'
  }

  const bud = (x: number, y: number, R: number, a: number) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><ellipse rx="${R * 0.55}" ry="${R}" fill="url(#pet)" stroke="#d9b9ab" stroke-width=".5"/><path d="M0 ${R}c-${R * 0.5} -${R * 0.3} -${R * 0.6} -${R * 0.9} 0 -${R * 0.6}c${R * 0.6} -${R * 0.3} ${R * 0.5} ${R * 0.6} 0 ${R * 0.6}z" fill="#9aa585" opacity=".8"/></g>`

  const defs = `<defs><radialGradient id="pet" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#e7c3b5"/><stop offset=".55" stop-color="#f4e2d9"/><stop offset="1" stop-color="#fdf7f2"/></radialGradient><linearGradient id="euc" x1="0" x2="1"><stop stop-color="#b7c1ad"/><stop offset="1" stop-color="#8e9d88"/></linearGradient><linearGradient id="olive" x1="0" x2="1"><stop stop-color="#7f8d68"/><stop offset="1" stop-color="#a9b38f"/></linearGradient></defs>`

  const back =
    branch(20, 40, 0.55, 420, 16, 'euc') + branch(0, 120, 0.25, 360, 9, 'olive') + branch(10, 200, 0.05, 260, 12, 'euc')
  const mid = branch(60, 10, 0.95, 330, 9, 'olive') + branch(110, 20, 1.25, 240, 13, 'euc')
  const front =
    bud(250, 170, 13, 40) + bud(175, 250, 11, -20) + bud(320, 90, 10, 70) +
    bloom(120, 120, 58) + bloom(215, 85, 36) + bloom(80, 215, 40) + bloom(185, 180, 24)

  return `${defs}<g class="layer-back">${back}</g><g class="layer-mid">${mid}</g><g class="layer-front">${front}</g>`
}
