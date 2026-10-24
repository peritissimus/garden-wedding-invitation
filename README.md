# Garden wedding invitation — “Bloom”

A single rosebud on cream paper. Tap it (or scroll) and it blooms ring by
ring, then you fall into its golden heart — and the light becomes the sun over
the garden where the wedding happens.

Scrolling is the clock of the day: the garden behind the page moves from
afternoon to golden hour, sunset, dusk and night. The order of the day lines up
with the light — the ceremony in golden hour, cocktails at sunset, the string
lights and lanterns come on for dinner, stars and fireflies arrive for the
dancing, the fireflies gather into a heart at the RSVP, and a shooting star
crosses the sky at the end.

Live: https://garden-wedding-bloom.vercel.app

## Stack

- [Vite](https://vite.dev) + TypeScript (no UI framework)
- [GSAP](https://gsap.com) + ScrollTrigger for the bloom, the scroll-driven time of day and reveals
- Hand-generated SVG botanicals (no image assets)

## Editing the invitation

All content lives in [`src/config.ts`](src/config.ts): names, the venue's time
zone, the celebrations (each with its own date, time and note), which one is the
main event (countdown + "Save the date"), venue, dress code + colour palette,
RSVP email and deadline (leave the email empty to leave the RSVP button out).
Times are shown as they are at the venue wherever guests open the invitation,
and the countdown and calendar entries are correct in any time zone.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build
```

## Deploy

```bash
vercel deploy --prod --scope peritissimus-projects
```

## Structure

```
src/
  config.ts              # all invitation content
  render.ts              # page markup
  stage.ts               # paints the garden once into canvases; scrolling then only
                         # moves and fades them (plus a tiny sky and the lights)
  main.ts                # entry: countdown, calendar, RSVP wiring
  art/                   # hand-built SVG artwork (no image files)
    rose.ts              # the rosebud that blooms (five rings of petals)
    scene.ts             # the garden in depth layers: sky, hills, glasshouse, trees,
                         # hedges, lawn, chairs, the mandap, blurred foreground,
                         # lights; plus the warm/moonlit colour matrices
    ornaments.ts         # wreath, flourish, mandap drawing, icons, swatches, petals
    defs.ts              # shared gradients + watercolour filters
  animations/
    ease.ts              # Emil Kowalski's custom curves (CustomEase)
    intro.ts             # tap-or-scroll bloom and dive into the light
    day.ts               # scroll-driven time of day: sky, sun/moon, light and
                         # warm/moonlit cross-fades (transform and opacity only)
    hero.ts              # ink-written names
    sections.ts          # card reveals, line drawings, firefly heart, shooting star
  lib/                   # date formatting, calendar export
  styles/main.css
```

## Motion

Timings follow Emil Kowalski's design-engineering guidelines:

- Entrances use a strong ease-out (`cubic-bezier(.23, 1, .32, 1)`), movement on
  screen uses ease-in-out; no `ease-in` anywhere. The dive into the rose eases
  the zoom's logarithm, so it glides evenly instead of lurching at the end.
- Nothing grows from nothing: entrances start at 0.6–0.95 scale with opacity.
  Exits are quicker than entrances (the light clearing, the fireflies drifting
  off).
- The opening is a once-per-visit ceremony (~3.8 s) and always interruptible:
  a fresh scroll, swipe, tap or key eases it up to 4× speed. Returning guests
  get the same bloom at 2.2× (~1.8 s). Pressing the rose gives way at once
  (`scale(.97)`), and tapping it never snaps its breathing pose.
- Calm reading: cards are always there (never popped in), keep one warm paper
  look all day and night, and hold still while the garden changes behind them.
  On desktops text settles in over 300 ms as it comes on screen; on touch
  screens, where a flick outruns any fade, text and numbers are simply shown.
- Only the garden's time of day is scroll-scrubbed. Each change of light eases
  in and out between two cards, so the garden is all but still while you read,
  and it follows the scroll with a short ease-out catch-up rather than snapping.
- The garden is painted once into canvases (at most 2× pixel density), so
  scrolling only moves and fades bitmaps — no repainting, even on phones.
- Buttons press to `scale(.97)`; hover effects are gated behind
  `(hover: hover) and (pointer: fine)`.
- Petals, butterflies, clouds and fireflies are CSS-only (transform + opacity).
- Native scrolling (no smooth-scroll library).
- Pacing lives in `src/animations/tempo.ts` (`opening` and `reveal`; higher = slower).
- `prefers-reduced-motion`: opacity fades only; the camera holds still while the
  light still changes, and decorations that only make sense moving are left out.
