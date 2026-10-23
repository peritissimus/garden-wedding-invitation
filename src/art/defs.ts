/**
 * Gradients and filters shared by every illustration on the page. Rendered
 * once in a zero-size (not display:none) SVG so url(#id) resolves everywhere.
 */
const watercolour = [3, 7, 11, 17, 23]
  .map(
    (seed, i) =>
      `<filter id="wc${i}" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G"/></filter>`,
  )
  .join('')

export const sharedDefs = `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<radialGradient id="pet" cx=".5" cy=".92" r=".95"><stop offset="0" stop-color="#e3bcae"/><stop offset=".5" stop-color="#f3e0d7"/><stop offset="1" stop-color="#fdf8f4"/></radialGradient>
<radialGradient id="pet-deep" cx=".5" cy=".92" r=".9"><stop offset="0" stop-color="#d4a292"/><stop offset=".6" stop-color="#eccdc1"/><stop offset="1" stop-color="#f8e9e2"/></radialGradient>
<linearGradient id="euc" x1="0" x2="1"><stop stop-color="#bac4b1"/><stop offset="1" stop-color="#8c9b87"/></linearGradient>
<linearGradient id="olive" x1="0" x2="1"><stop stop-color="#7c8a65"/><stop offset="1" stop-color="#acb693"/></linearGradient>
<linearGradient id="laurel" x1="0" x2="1"><stop stop-color="#87936f"/><stop offset="1" stop-color="#b4bd9d"/></linearGradient>
<linearGradient id="petal-fall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcf1ec"/><stop offset=".6" stop-color="#efd3c8"/><stop offset="1" stop-color="#e0b4a6"/></linearGradient>
<radialGradient id="wax" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d7a294"/><stop offset=".45" stop-color="#ab6c5f"/><stop offset="1" stop-color="#743f38"/></radialGradient>
<radialGradient id="wax-pool" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#bd7d70"/><stop offset="1" stop-color="#94584d"/></radialGradient>
<radialGradient id="wax-hi" cx=".32" cy=".24" r=".42"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="wc-shade" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#3a2a1a" stop-opacity="0"/><stop offset=".9" stop-color="#3a2a1a" stop-opacity=".1"/><stop offset="1" stop-color="#3a2a1a" stop-opacity=".2"/></radialGradient>
${watercolour}
</defs></svg>`
