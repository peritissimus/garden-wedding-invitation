import * as scene from './art/scene'
import type { Art, GlowGroup } from './art/scene'

/**
 * The garden behind the invitation, as a stack of canvases.
 *
 * Every piece of scenery is painted once — the daylight layers from their
 * SVG, the sunset and moonlit versions by running those pixels through the
 * colour matrices — and from then on scrolling only moves and fades bitmaps,
 * without repainting the artwork. Even the lights are painted once and faded
 * as a group; only the tiny 1×64 sky gradient is redrawn during scrolling.
 */

/** How the 1600×1000 scene sits on the stage, like SVG's `xMidYMax slice`: scene (x, y) → px (ox + x·u, oy + y·u). */
export interface Layout {
  w: number
  h: number
  u: number
  ox: number
  oy: number
}

/** A region in scene units: x0 y0 x1 y1. */
type Box = Art['box']
type Depth = 'back' | 'front' | 'fg'
type Paintable = Pick<Art, 'defs' | 'body'>
interface Glow {
  el: HTMLCanvasElement
  v: Box
  groups: GlowGroup[]
}

/** Sharp enough on any screen without giving every layer a 3× backing store. */
const DPR = Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2)
/** Ceiling for any one canvas, in device pixels. */
const MAX_PIXELS = 4e6
const DEPTHS: Depth[] = ['front', 'back', 'fg']

function measure(el: HTMLElement): Layout {
  const w = el.clientWidth
  const h = el.clientHeight
  const u = Math.max(w / 1600, h / 1000)
  return { w, h, u, ox: (w - 1600 * u) / 2, oy: h - 1000 * u }
}

/** Let a frame through between pieces of work so nothing on screen stutters. */
const breathe = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r)))

const rgba = (hex: string, a: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`

/** Soft radial glows, drawn once and stamped for every light. */
const sprites = Object.fromEntries(
  Object.entries(scene.GLOW_SPRITES).map(([k, stops]) => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    for (const [o, col, a] of stops) g.addColorStop(o, rgba(col, a))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return [k, c]
  }),
) as Record<keyof typeof scene.GLOW_SPRITES, HTMLCanvasElement>

const paths = new Map<string, Path2D>()
const path = (d: string) => paths.get(d) ?? paths.set(d, new Path2D(d)).get(d)!

function svgMarkup(a: Paintable, v: Box, w: number, h: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${v[0]} ${v[1]} ${v[2] - v[0]} ${v[3] - v[1]}" preserveAspectRatio="none"><defs>${a.defs}</defs>${a.body}</svg>`
}

/**
 * Rasterise artwork into a canvas of its own size. With `keep`, it is painted
 * into a scratch canvas first and that is returned for reading pixels back, so
 * the canvas on screen never becomes a CPU-side "read frequently" canvas
 * (which phones composite far less efficiently).
 */
async function draw(c: HTMLCanvasElement, a: Paintable, v: Box, keep = false) {
  const url = URL.createObjectURL(new Blob([svgMarkup(a, v, c.width, c.height)], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })
    if (!keep) {
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      return null
    }
    const scratch = document.createElement('canvas')
    scratch.width = c.width
    scratch.height = c.height
    scratch.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, c.width, c.height)
    c.getContext('2d')!.drawImage(scratch, 0, 0)
    return scratch
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** The same artwork through a colour matrix, for browsers that won't let us read the painted pixels back. */
let looks = 0
const filtered = (a: Paintable, v: Box, m: number[]): Paintable => {
  const id = `look${++looks}`
  return {
    defs: `${a.defs}<filter id="${id}" filterUnits="userSpaceOnUse" x="${v[0]}" y="${v[1]}" width="${v[2] - v[0]}" height="${v[3] - v[1]}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m.join(' ')}"/></filter>`,
    body: `<g filter="url(#${id})">${a.body}</g>`,
  }
}

/**
 * Re-colour a painted layer through 4×5 colour matrices — feColorMatrix's
 * maths, on straight (unpremultiplied) sRGB like `color-interpolation-filters="sRGB"`.
 * Returns null if the pixels can't be read.
 */
async function grade(src: HTMLCanvasElement, matrices: number[][], css: string, live: () => boolean): Promise<HTMLCanvasElement[] | null> {
  let px: Uint8ClampedArray
  try {
    px = src.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, src.width, src.height).data
  } catch {
    return null
  }
  const canvases: HTMLCanvasElement[] = []
  let yielded = performance.now()
  for (const [rr, rg, rb, , ro, gr, gg, gb, , go, br, bg, bb, , bo] of matrices) {
    const out = new ImageData(src.width, src.height)
    const d = out.data
    const r0 = ro * 255
    const g0 = go * 255
    const b0 = bo * 255
    // Keep startup work interruptible while the guest is already opening the rose.
    for (let start = 0; start < px.length; start += 65_536) {
      const end = Math.min(px.length, start + 65_536)
      for (let p = start; p < end; p += 4) {
        const a = px[p + 3]
        if (!a) continue
        const r = px[p]
        const g = px[p + 1]
        const b = px[p + 2]
        d[p] = rr * r + rg * g + rb * b + r0
        d[p + 1] = gr * r + gg * g + gb * b + g0
        d[p + 2] = br * r + bg * g + bb * b + b0
        d[p + 3] = a
      }
      if (performance.now() - yielded >= 5) {
        await breathe()
        if (!live()) return null
        yielded = performance.now()
      }
    }
    const c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    c.style.cssText = css
    c.getContext('2d')!.putImageData(out, 0, 0)
    canvases.push(c)
  }
  return canvases
}

function drawGlow({ el, v, groups }: Glow) {
  const ctx = el.getContext('2d')!
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, el.width, el.height)
  const kx = el.width / (v[2] - v[0])
  const ky = el.height / (v[3] - v[1])
  ctx.setTransform(kx, 0, 0, ky, -v[0] * kx, -v[1] * ky)
  for (const group of groups) {
    for (const op of group.ops) {
      ctx.globalAlpha = op.a
      if (op.k === 'shape') {
        ctx.fillStyle = op.fill
        ctx.fill(path(op.d))
      } else ctx.drawImage(sprites[op.k], op.x - op.rx, op.y - op.ry, op.rx * 2, op.ry * 2)
    }
  }
  ctx.globalAlpha = 1
}

export interface Sky {
  skyTop: string
  skyMid: string
  skyBottom: string
}

export function mountStage(root: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!
  // The artwork is generated on first use, a piece per frame, so the rose
  // appears straight away instead of waiting for thousands of leaves.
  const art: Partial<Record<Depth, Art>> = {}
  const artOf = (d: Depth) => (art[d] ??= scene[d]())
  let extras: { lights: ReturnType<typeof lightsOf>; fx: ReturnType<typeof scene.fx>; stars: ReturnType<typeof scene.stars> } | null = null
  /** lights need the trees and the front of the garden drawn first (they record where the lights hang) */
  const lightsOf = () => ({ back: scene.glowBack(), front: scene.glowFront(), fairies: scene.fairyLights(), trees: scene.treeLights() })
  const more = () => (extras ??= { lights: lightsOf(), fx: scene.fx(), stars: scene.stars() })
  const sky = $<HTMLCanvasElement>('canvas.sky')
  const vignette = $<HTMLCanvasElement>('canvas.vignette')

  let L = measure(root)
  let generation = 0
  let skyDrawn = ''

  /** The part of `box` that can be on screen — with room for the camera's moves and the pointer parallax when `roomy`. */
  function region(box: Box, roomy: boolean): Box | null {
    const mx = roomy ? (L.w * 0.07 + 24) / L.u : 0
    const my = roomy ? (L.h * 0.06 + 24) / L.u : 0
    const v: Box = [
      Math.max(box[0], -L.ox / L.u - mx),
      // the hero's camera looks up at the sky, lowering the land by up to ~340 units
      Math.max(box[1], -L.oy / L.u - my - (roomy ? 340 : 0)),
      Math.min(box[2], (L.w - L.ox) / L.u + mx),
      Math.min(box[3], (L.h - L.oy) / L.u + my),
    ]
    return v[2] > v[0] && v[3] > v[1] ? v : null
  }

  function canvasAt(x: number, y: number, w: number, h: number, ratio: number) {
    const r = Math.min(ratio, Math.sqrt(MAX_PIXELS / (w * h)))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(w * r))
    c.height = Math.max(1, Math.round(h * r))
    c.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`
    return c
  }
  /** A canvas over a scene region, placed in stage px. */
  const sceneCanvas = (v: Box, ratio: number) => canvasAt(L.ox + v[0] * L.u, L.oy + v[1] * L.u, (v[2] - v[0]) * L.u, (v[3] - v[1]) * L.u, ratio)
  /** A canvas for artwork centred on its wrapper's origin (sun, moon, rays). */
  const centredCanvas = (b: Box, ratio: number) => canvasAt(b[0] * L.u, b[1] * L.u, (b[2] - b[0]) * L.u, (b[3] - b[1]) * L.u, ratio)

  /** If a canvas can't be painted (it shouldn't happen), show the artwork as plain SVG in the same place instead. */
  function liveSvg(c: HTMLCanvasElement, a: Paintable, v: Box) {
    const holder = document.createElement('div')
    holder.innerHTML = svgMarkup(a, v, 1, 1)
    const svg = holder.firstElementChild as SVGSVGElement
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('style', `${c.style.cssText};position:absolute;overflow:visible`)
    return svg
  }

  function drawSky(top: string, mid: string, bottom: string) {
    const key = top + mid + bottom
    if (key === skyDrawn) return
    skyDrawn = key
    const ctx = sky.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, sky.height)
    g.addColorStop(0, top)
    g.addColorStop(0.56, mid)
    g.addColorStop(1, bottom)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, sky.width, sky.height)
  }

  /** The night vignette, as CSS `radial-gradient(120% 90% at 50% 42%, transparent 52%, #05081a)`, at thumbnail size. */
  function drawVignette() {
    vignette.width = 96
    vignette.height = Math.max(16, Math.round((96 * L.h) / L.w))
    const ctx = vignette.getContext('2d')!
    const { width: w, height: h } = vignette
    ctx.setTransform(1.2 * w, 0, 0, 0.9 * h, 0.5 * w, 0.42 * h)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g.addColorStop(0.52, 'rgba(5,8,26,0)')
    g.addColorStop(1, 'rgba(5,8,26,1)')
    ctx.fillStyle = g
    ctx.fillRect(-1, -1, 2, 2)
  }

  async function paint() {
    const gen = ++generation
    const live = () => gen === generation
    /** daylight pixels of each depth, kept until its other looks are graded from them */
    const days: Partial<Record<Depth, { scratch: HTMLCanvasElement; css: string; v: Box }>> = {}
    drawVignette()
    // butterflies sit on the scene like everything else, a little larger nearer us
    for (const b of root.querySelectorAll<HTMLElement>('.bfly')) {
      const x = Number(b.dataset.x)
      const y = Number(b.dataset.y)
      b.style.left = `${L.ox + x * L.u}px`
      b.style.top = `${L.oy + y * L.u}px`
      b.style.setProperty('--s', (L.u * (0.75 + (y - 650) / 400)).toFixed(3))
    }

    /** Paint artwork into a fresh canvas and swap it into its slot (the old one stays up until then). */
    const put = async (slot: HTMLElement, c: HTMLCanvasElement, a: Paintable, v: Box, keep = false) => {
      let el: HTMLCanvasElement | SVGSVGElement = c
      let scratch: HTMLCanvasElement | null = null
      try {
        scratch = await draw(c, a, v, keep)
      } catch {
        el = liveSvg(c, a, v)
      }
      if (live()) slot.replaceChildren(el)
      return scratch
    }
    const sheet = (slot: string, a: Art, ratio: number) => async () => {
      const v = region(a.box, false)
      if (v) await put($(slot), sceneCanvas(v, ratio), a, v)
    }
    const centred = (slot: string, a: Art, ratio: number) => () => put($(slot), centredCanvas(a.box, ratio), a, a.box)
    const cloud = (look: keyof typeof scene.CLOUD_LOOKS) => () => {
      const a = scene.clouds(L.w, L.h, look)
      const [x0, y0, x1, y1] = a.box
      return put($(`.cloud-band .${look}`), canvasAt(x0, y0, x1 - x0, y1 - y0, Math.min(DPR, 1.5)), a, a.box)
    }
    const land = (d: Depth) => async () => {
      const a = artOf(d)
      await breathe() // generating the art and painting it are each a frame's work
      const v = region(a.box, true)
      if (!v) return
      const c = sceneCanvas(v, DPR)
      const scratch = await put($(`.cam-${d} .look.day`), c, a, v, true)
      if (scratch) days[d] = { scratch, css: c.style.cssText, v }
    }
    /** Golden hour and moonlight: re-colour the daylight pixels (or, failing that, paint through an SVG filter). */
    const looks = (d: Depth) => async () => {
      const day = days[d]
      const v = day?.v ?? region(artOf(d).box, true)
      if (!v) return
      const kind = d === 'back' ? 'far' : 'near'
      const ms = [scene.LOOKS.warm[kind], scene.LOOKS.moon[kind]]
      const graded = day && await grade(day.scratch, ms, day.css, live)
      if (!live()) return
      if (day) {
        day.scratch.width = day.scratch.height = 0 // let the scratch copy go now
        delete days[d]
      }
      const slots = [$(`.cam-${d} .look.warm`), $(`.cam-${d} .look.moon`)]
      if (graded) {
        if (live()) graded.forEach((c, i) => slots[i].replaceChildren(c))
        return
      }
      for (const [i, m] of ms.entries()) await put(slots[i], sceneCanvas(v, DPR), filtered(artOf(d), v, m), v)
    }
    const glow = (slot: string, box: Box, groups: GlowGroup[]): Glow | null => {
      const v = region(box, true)
      if (!v) return null
      const el = sceneCanvas(v, Math.min(DPR, 1.5))
      $(slot).replaceChildren(el)
      return { el, v, groups }
    }

    const jobs: (() => unknown)[] = [
      // what the hero sees first
      ...DEPTHS.map(land),
      more,
      centred('.sun .day', scene.sun('day'), 1.25),
      () => centred('.rays .slot', more().fx.rays, 0.5)(),
      cloud('day'),
      // the rest of the day, in the order it's needed
      cloud('golden'),
      centred('.sun .golden', scene.sun('golden'), 1.25),
      ...DEPTHS.map(looks),
      cloud('sunset'),
      centred('.sun .sunset', scene.sun('sunset'), 1.25),
      cloud('dusk'),
      cloud('night'),
      () => {
        if (!live()) return
        const sets = more().lights
        const glows = [
          glow('.cam-back .glow:not(.fairy)', [-40, 400, 1640, 700], sets.back),
          glow('.cam-back .fairy.f0', scene.TREE_LIGHT_BOX, [sets.trees[0]]),
          glow('.cam-back .fairy.f1', scene.TREE_LIGHT_BOX, [sets.trees[1]]),
          glow('.cam-front .glow:not(.fairy)', [-40, 380, 1640, 1060], sets.front),
          glow('.cam-front .fairy.f0', scene.FAIRY_BOX, [sets.fairies[0]]),
          glow('.cam-front .fairy.f1', scene.FAIRY_BOX, [sets.fairies[1]]),
        ].filter((g): g is Glow => !!g)
        glows.forEach(drawGlow)
      },
      centred('.moon .slot', scene.moon(), 1.5),
      ...[0, 1, 2].map((i) => () => sheet(`.stars .st-${i}`, more().stars[i], Math.min(DPR, 1.5))()),
      () => sheet('.bokeh .slot', more().fx.bokeh, 1)(),
    ]
    await breathe()
    for (const job of jobs) {
      if (!live()) return
      await job()
      await breathe()
    }
  }

  /*
   * Measure only once the stage's own styles apply. Safari can run this script
   * before the stylesheet has loaded; the unstyled stage is then thousands of
   * pixels tall, and everything painted for that size lands far off screen.
   * After that, re-measure whenever the stage really changes size (rotation, a
   * resized window) and tell the day so it can re-place everything.
   */
  const listeners: ((L: Layout) => void)[] = []
  const styled = () => getComputedStyle(root).position === 'fixed'
  const relayout = (force = false) => {
    const next = measure(root)
    if (!force && next.w === L.w && next.h === L.h) return false
    L = next
    paint()
    listeners.forEach((f) => f(L))
    return true
  }
  const start = () => (styled() ? relayout(true) : requestAnimationFrame(start))
  if (styled()) paint()
  else requestAnimationFrame(start)
  let resizing = 0
  new ResizeObserver(() => {
    clearTimeout(resizing)
    resizing = window.setTimeout(() => styled() && relayout(), 200)
  }).observe(root)

  return {
    get layout() {
      return L
    },
    /** Called with the new layout whenever the stage is (re)measured. */
    onLayout(f: (L: Layout) => void) {
      listeners.push(f)
    },
    /** Only the tiny sky strip changes pixels while scrolling. */
    update(s: Sky) {
      drawSky(s.skyTop, s.skyMid, s.skyBottom)
    },
    /** Re-measure; if the stage changed size, repaint everything for the new size. */
    refit: () => relayout(),
  }
}

export type Stage = ReturnType<typeof mountStage>
