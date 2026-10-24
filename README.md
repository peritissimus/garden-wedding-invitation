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

All content lives in [`src/config.ts`](src/config.ts): names, date, ceremony
time, venue, schedule, dress code + colour palette, RSVP email and deadline.
Set `sample: false` once the real details are in.

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
  main.ts                # entry: countdown, calendar, RSVP wiring
  art/                   # hand-built SVG artwork (no image files)
    rose.ts              # the rosebud that blooms (five rings of petals)
    scene.ts             # the garden in depth layers: sky, hills, glasshouse, trees,
                         # hedges, lawn, chairs, the rose arch, blurred foreground,
                         # light glows; plus warm/moonlit colour-matrix copies
    ornaments.ts         # wreath, flourish, glasshouse, icons, swatches, petals
    defs.ts              # shared gradients + watercolour filters
  animations/
    ease.ts              # Emil Kowalski's custom curves (CustomEase)
    intro.ts             # tap-or-scroll bloom and dive into the light
    day.ts               # scroll-driven time of day: sky, sun/moon, light and
                         # warm/moonlit cross-fades (opacity only — no per-frame filters)
    hero.ts              # ink-written names
    sections.ts          # card reveals, line drawings, firefly heart, shooting star
  lib/                   # date formatting, calendar export
  styles/main.css
```

## Motion

Timings follow Emil Kowalski's design-engineering guidelines:

- Entrances use a strong ease-out (`cubic-bezier(.23, 1, .32, 1)`), movement on
  screen uses a strong ease-in-out; no `ease-in` on UI.
- Text reveals are 450–600ms with 18–60ms staggers and fire just before the
  element is in view, so nothing waits on the reader.
- Only the timeline vine is scroll-scrubbed; everything else plays once.
- Buttons press to `scale(.97)`; hover effects are gated behind
  `(hover: hover) and (pointer: fine)`.
- Petals and swaying botanicals are CSS-only (transform + opacity) and pause
  when off screen.
- Native scrolling (no smooth-scroll library). The opening can always be cut
  short: a fresh scroll, swipe, tap or key press plays the rest quickly.
- Pacing lives in `src/animations/tempo.ts` (`opening` and `reveal`; higher = slower).
- `prefers-reduced-motion`: no movement, opacity fades only.
