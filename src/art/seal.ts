import { blob } from './util'

/**
 * Wax seal with an embossed monogram. The art is drawn once and reused three
 * times: whole (at rest) and as two halves clipped along a jagged crack, which
 * swap in when the seal breaks.
 */
export function seal(monogram: string) {
  const outer = blob(50, 50, 44, 20, 6, 11)
  const pool = blob(50, 50, 33, 16, 1.6, 5)
  const crack = 'L46 14L55 31L45 49L54 66L47 82L51 112'
  const type = 'font-family="Pinyon Script, cursive" font-size="25" text-anchor="middle"'

  return `<svg class="seal-svg" viewBox="0 0 100 100" aria-hidden="true">
<defs>
<clipPath id="seal-clip-l"><path d="M-12 -12H51${crack}H-12Z"/></clipPath>
<clipPath id="seal-clip-r"><path d="M112 -12H51${crack}H112Z"/></clipPath>
<g id="seal-art">
<path d="${outer}" fill="url(#wax)"/>
<path d="${pool}" fill="url(#wax-pool)"/>
<path d="${pool}" fill="none" stroke="#5a2a23" stroke-opacity=".32" stroke-width="1" transform="translate(.5 .7)"/>
<path d="${pool}" fill="none" stroke="#f4d6cb" stroke-opacity=".3" stroke-width=".8" transform="translate(-.4 -.5)"/>
<circle cx="50" cy="50" r="27" fill="none" stroke="#f4d6cb" stroke-opacity=".32" stroke-width=".6" stroke-dasharray=".8 2.4"/>
<text x="50.6" y="59" ${type} fill="#4a211b" fill-opacity=".45">${monogram}</text>
<text x="50" y="58.2" ${type} fill="#f6dfd6">${monogram}</text>
<path d="${outer}" fill="url(#wax-hi)"/>
</g>
</defs>
<use class="seal-whole" href="#seal-art"/>
<g class="seal-half seal-l" clip-path="url(#seal-clip-l)"><use href="#seal-art"/></g>
<g class="seal-half seal-r" clip-path="url(#seal-clip-r)"><use href="#seal-art"/></g>
</svg>`
}
