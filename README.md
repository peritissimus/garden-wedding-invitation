# Garden wedding invitation

An animated, single-page wedding invitation. Guests open a wax-sealed envelope
(tap the seal **or** scroll), then scroll through the details with soft,
scroll-driven animations.

Live: https://garden-wedding-invitation.vercel.app

## Stack

- [Vite](https://vite.dev) + TypeScript (no UI framework)
- [GSAP](https://gsap.com) + ScrollTrigger for the pinned envelope scene and scroll reveals
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
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
  config.ts        # all invitation content
  render.ts        # page markup
  animations.ts    # GSAP / ScrollTrigger / Lenis
  main.ts          # entry: countdown, calendar, RSVP wiring
  lib/
    flora.ts       # deterministic SVG botanical generator
    calendar.ts    # .ics download + Google Calendar link
    format.ts      # date/time helpers
  styles/main.css
```

Respects `prefers-reduced-motion`: animations and smooth scrolling are
disabled and all content is shown immediately.
