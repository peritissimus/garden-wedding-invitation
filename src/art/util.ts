/** Small deterministic PRNG so the artwork is identical on every load. */
export function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Trim numbers for compact SVG path data. */
export const f = (n: number) => String(Math.round(n * 10) / 10)

export const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`

export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0`

/** Almond leaf growing from the origin along +x: length L, half-width W. */
export const leaf = (L: number, W: number) =>
  `M0 0C${f(L * 0.3)} ${f(-W)} ${f(L * 0.72)} ${f(-W * 0.9)} ${f(L)} 0C${f(L * 0.72)} ${f(W * 0.9)} ${f(L * 0.3)} ${f(W)} 0 0Z`

/** Closed smooth blob through jittered points on a circle (Catmull-Rom → Bézier). */
export function blob(cx: number, cy: number, R: number, n: number, jitter: number, seed: number) {
  const r = rng(seed)
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const rr = R + (r() - 0.5) * jitter
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const
  })
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d}Z`
}
