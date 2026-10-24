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
  main.ts                # entry: countdown, calendar, RSVP wiring
  art/                   # hand-built SVG artwork (no image files)
    seal.ts              # wax seal that cracks in two
    flora.ts             # eucalyptus / olive / gypsophila / rose corners
    ornaments.ts         # wreath, flourish, mandap drawing, icons, swatches, petals
    defs.ts              # shared gradients + watercolour filters
  animations/
    ease.ts              # Emil Kowalski's custom curves (CustomEase)
    intro.ts             # tap-or-scroll envelope opening
    hero.ts              # ink-written names, botanicals growing in
    sections.ts          # reveals, line drawings, timeline vine
  lib/                   # date formatting, calendar export
  styles/main.css
```

## Motion

Timings follow Emil Kowalski's design-engineering guidelines:

- Entrances use a strong ease-out (`cubic-bezier(.23, 1, .32, 1)`), movement on
  screen uses a strong ease-in-out; no `ease-in` on UI.
- Native scrolling: nothing trails behind the guest's finger. Scroll-linked
  pieces move directly with the scroll.
- Cards are always there — never hidden until you reach them. Text settles in
  over 300ms on desktops; on touch screens, where a flick outruns any fade, text
  and numbers are simply shown. No word-by-word text or rolling numbers.
- Line drawings and icons draw in 0.6–0.8s with no delays, and nothing grows
  from nothing (entrances start at 0.6–0.85 scale with opacity).
- Only the timeline vine and the botanical depth layers are scroll-linked;
  everything else plays once.
- Buttons press to `scale(.97)`; hover effects are gated behind
  `(hover: hover) and (pointer: fine)`.
- Petals and swaying botanicals are CSS-only (transform + opacity) and pause
  when off screen.
- The opening can always be cut short: a fresh scroll, swipe, tap or key press
  plays the rest quickly.
- Pacing lives in `src/animations/tempo.ts`: `opening` (the envelope ceremony,
  slowed at the couple's request) and `reveal` (kept at 1).
- `prefers-reduced-motion`: no movement, opacity fades only.
