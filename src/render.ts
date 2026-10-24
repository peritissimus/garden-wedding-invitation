import { config } from './config'
import { at, couple, esc, fmtDay, fmtTime, weddingStart } from './lib/format'
import { sharedDefs } from './art/defs'
import { circleMark, flourish, icon, petals, rsvpArt, swatch, venueArt, wreath } from './art/ornaments'
import { rose } from './art/rose'
import { fireflies, scene } from './art/scene'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function render(root: HTMLElement) {
  const start = weddingStart()
  const weekday = start.toLocaleDateString('en-GB', { weekday: 'long' })
  const day = start.getDate()
  const month = start.toLocaleDateString('en-GB', { month: 'long' })
  const year = start.getFullYear()
  const mapQuery = config.venue.mapQuery ?? `${config.venue.name} ${config.venue.address}`

  root.innerHTML = `${sharedDefs}
<div class="stage" id="stage" aria-hidden="true">
  ${scene()}
  <div class="petals">${petals(14, 5)}</div>
  <div class="fireflies" id="fireflies">${fireflies(44)}</div>
  <div class="shooting"><i></i><i></i></div>
</div>

<div class="intro" id="intro">
  <div class="intro-bg grain"></div>
  <div class="intro-light" id="intro-light"></div>
  <div class="rose-wrap">
    ${rose()}
    <button class="rose-hit" id="seal" aria-label="Open your invitation"></button>
  </div>
  <div class="intro-copy">
    <p class="to">You are warmly invited</p>
    <p class="eyebrow hint"><span>Tap the rose</span><i></i><span>or scroll</span></p>
  </div>
</div>

<main>
<section class="beat hero" id="hero">
  <div class="hero-copy">
    <p class="eyebrow h-in">${esc(config.hostLine)}</p>
    <h1 class="names" tabindex="-1">
      <span class="name ink">${esc(config.partnerOne)}</span>
      <span class="amp h-in">and</span>
      <span class="name ink">${esc(config.partnerTwo)}</span>
    </h1>
    <p class="eyebrow h-in h-late">request the pleasure of your company</p>
    <div class="date-block h-in h-late">
      <span>${esc(weekday)}</span><span class="big">${String(day).padStart(2, '0')}</span><span>${esc(month)} ${year}</span>
    </div>
  </div>
  <p class="scroll-cue h-in h-late"><span>Scroll to spend the day with us</span><i></i></p>
</section>

<section class="beat" id="story">
  <div class="card">
    ${wreath(esc(config.partnerOne[0] ?? ''), esc(config.partnerTwo[0] ?? ''))}
    <p class="eyebrow reveal">A little love letter</p>
    <h2 class="reveal">Our favourite day,<br><em>with our favourite people</em></h2>
    <p class="lead words">${config.message
      .split(' ')
      .map((w) => `<span class="word">${esc(w)}</span>`)
      .join(' ')}</p>
  </div>
</section>

<section class="beat" id="when">
  <div class="card">
    <p class="eyebrow reveal">Save the date</p>
    <h2 class="reveal date-title">${esc(weekday)}, <span class="circled">${day}${circleMark()}</span> ${esc(month)} ${year}</h2>
    <p class="reveal muted">Ceremony begins at ${fmtTime(start)}</p>
    <div class="countdown reveal" id="countdown" aria-label="Time until the wedding"></div>
    <div class="reveal actions">
      <button class="btn" id="ics">Add to calendar</button>
      <a class="btn ghost" id="gcal" target="_blank" rel="noopener">Google Calendar</a>
    </div>
  </div>
</section>

<section class="beat beat-short" id="schedule">
  <div class="card card-slim">
    <p class="eyebrow reveal">Order of the day</p>
    <h2 class="reveal"><em>The celebration</em></h2>
    <p class="reveal small">Keep scrolling — the day unfolds around you.</p>
  </div>
</section>

${config.schedule
  .map(
    (s) => `<section class="beat event" id="ev-${slug(s.title)}">
  <div class="card event-card">
    ${icon(s)}
    <div class="ev-text">
      <time class="reveal">${fmtTime(at(config.date, s.time))}</time>
      <h3 class="reveal">${esc(s.title)}</h3>
      ${s.note ? `<p class="reveal">${esc(s.note)}</p>` : ''}
    </div>
  </div>
</section>`,
  )
  .join('')}

<section class="beat" id="venue">
  <div class="card">
    <p class="eyebrow reveal">Where</p>
    ${venueArt()}
    <h2 class="reveal venue-name">${esc(config.venue.name)}</h2>
    <p class="reveal muted italic">${esc(config.venue.address)}</p>
    ${config.venue.note ? `<p class="reveal small">${esc(config.venue.note)}</p>` : ''}
    <div class="reveal actions"><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}">View on map</a></div>
  </div>
</section>

<section class="beat" id="attire">
  <div class="card">
    <p class="eyebrow reveal">Attire</p>
    <h2 class="reveal"><em>${esc(config.dressCode.title)}</em></h2>
    <p class="reveal">${esc(config.dressCode.description)}</p>
    <ul class="palette" aria-label="Suggested colours">${config.dressCode.palette
      .map((p, i) => `<li class="chip">${swatch(p.color, i)}<span>${esc(p.name)}</span></li>`)
      .join('')}</ul>
  </div>
</section>

<section class="beat rsvp" id="rsvp">
  <div class="card">
    ${rsvpArt()}
    <p class="eyebrow reveal">Kindly reply</p>
    <h2 class="reveal">Will you <em>join us?</em></h2>
    <p class="reveal muted italic">${
      config.rsvp.deadline ? `Kindly respond by ${esc(fmtDay(config.rsvp.deadline))}` : 'We cannot wait to celebrate with you'
    }</p>
    <div class="reveal actions"><button class="btn solid" id="rsvp-btn">RSVP</button></div>
    <p class="reveal small" id="rsvp-note">${config.rsvp.note ? esc(config.rsvp.note) : ''}</p>
  </div>
</section>

<footer class="beat footer" id="footer">
  ${flourish()}
  <p class="eyebrow reveal">${esc(config.closing)}</p>
  <p class="footer-names"><span class="ink">${esc(couple())}</span></p>
  <p class="eyebrow reveal">${start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' · ')}</p>
  ${config.sample ? '<p class="small sample">Sample invitation — details to be personalised</p>' : ''}
</footer>
</main>`
}
