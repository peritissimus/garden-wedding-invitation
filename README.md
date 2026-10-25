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
                         # moves and fades them (only the tiny sky strip is redrawn)
  main.ts                # entry: countdown, calendar, RSVP wiring
  art/                   # hand-built SVG artwork (no image files)
    rose.ts              # the rosebud that blooms (five rings of petals)
    scene.ts             # the garden in depth layers: sky, hills, glasshouse, trees,
                         # hedges, lawn, chairs, the mandap, blurred foreground,
                         # lights; plus the warm/moonlit colour matrices
    ornaments.ts         # wreath, flourish, mandap drawing, icons, swatches, petals
    defs.ts              # shared gradients + watercolour filters
  animations/
    intro.ts             # tap-or-scroll bloom and dive into the light
    day.ts               # scroll-driven time of day: sky, sun/moon, light and
                         # warm/moonlit cross-fades (transform and opacity only)
    hero.ts              # ink-written names
    sections.ts          # card reveals, line drawings, firefly heart, shooting star
  lib/                   # date formatting, calendar export
  styles/main.css
```

## Motion

- Native scrolling is the shared playhead. There is no scroll lock, wheel interception,
  smooth-scroll library or delayed scrub. The rose, names, garden, text and botanical
  drawings advance with scroll distance, stop with the guest and reverse on the way back.
- The opening holds the hero for 1.4 viewport heights while the bud blooms and the light
  gives way to the garden. Tap the rose to scroll through that same sequence; any fresh
  wheel, touch, pointer or keyboard input interrupts the automatic travel immediately.
- Cards move continuously with the document. Paper surfaces use a warm translucent
  gradient and layered shadows instead of live backdrop blur over the moving scenery.
- The garden's light and camera blend continuously between each celebration's real time
  of day. A new day passes through dawn; daytime weddings end in daylight.
- Text settles over a short scroll distance and is fully visible before its card reaches
  the reading position. Botanical strokes, event icons and the closing names share the
  same reversible scroll treatment. Night endings gather the fireflies and draw shooting
  stars according to scroll distance as well.
- Scenery and lighting are painted into canvases once, at up to 2× pixel density
  (1.5× for coarse pointers to reduce phone memory use). Scrolling moves and fades
  those bitmaps; only the tiny sky gradient changes pixels. Colour grading yields
  between short batches so startup work does not monopolise the main thread.
- Ambient clouds, butterflies, birds, petals and twinkling lights retain their gentle
  natural movement. Pointer parallax is limited to precise desktop pointers and settles
  back to centre when the pointer leaves.
- Buttons respond at once with a 0.96 press scale. Hover effects require a fine pointer.
- Reduced motion keeps all reading content and decorative drawings visible, shortens
  the opening to an opacity dissolve and holds the garden camera still. Animated
  decorations and CSS motion are disabled.
- Opening scroll distance lives in `src/animations/tempo.ts`.

## Phone layout checks

Checked in the in-app browser at 320×568, 360×640, 390×844, 430×932 and
844×390: forward and reverse scrolling, opening interruption, readable cards,
calendar controls, day/night lighting, and rotation between portrait and landscape.
The opening uses stable viewport units so collapsing mobile browser bars do not
re-centre the rose; venue artwork stays within its card and landscape spacing
respects device safe areas. Physical-device touch inertia and frame rates still
need checking on iOS Safari and Android Chrome.
