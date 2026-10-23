# Garden wedding invitation

An animated, single-page wedding invitation. Guests open a wax-sealed envelope
(tap the seal **or** scroll), then scroll through the details with soft,
scroll-driven animations.

Live: https://garden-wedding-invitation.vercel.app

## Stack

- [Vite](https://vite.dev) + TypeScript (no UI framework)
- [GSAP](https://gsap.com) + ScrollTrigger for the pinned envelope scene and scroll reveals
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
    seal.ts              # wax seal that cracks in two
    flora.ts             # eucalyptus / olive / gypsophila / rose corners
    ornaments.ts         # wreath, flourish, glasshouse, icons, swatches, petals
    defs.ts              # shared gradients + watercolour filters
  animations/
    ease.ts              # Emil Kowalski's custom curves (CustomEase)
    intro.ts             # tap-or-scroll envelope opening
    hero.ts              # ink-written names, botanicals growing in
    sections.ts          # reveals, line drawings, timeline vine, count-up
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
