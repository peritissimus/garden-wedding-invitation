import { config } from './config'
import { at, couple, esc, fmtDay, fmtTime, initials, weddingStart } from './lib/format'
import { sharedDefs } from './art/defs'
import { flora } from './art/flora'
import { seal } from './art/seal'
import { circleMark, flourish, icon, petals, rsvpArt, sprig, swatch, venueArt, wreath } from './art/ornaments'

export function render(root: HTMLElement) {
  const start = weddingStart()
  const weekday = start.toLocaleDateString('en-GB', { weekday: 'long' })
  const day = start.getDate()
  const month = start.toLocaleDateString('en-GB', { month: 'long' })
  const year = start.getFullYear()
  const mapQuery = config.venue.mapQuery ?? `${config.venue.name} ${config.venue.address}`

  root.innerHTML = `${sharedDefs}
<div class="intro" id="intro">
  <div class="intro-bg grain"></div>
  <div class="petals" aria-hidden="true">${petals(8, 3)}</div>
  <div class="envelope-wrap">
    <div class="envelope">
      <div class="env-back env-part"></div>
      <div class="letter">
        <div class="letter-inner">
          ${sprig('letter-sprig')}
          <span class="eyebrow">The wedding of</span>
          <span class="letter-names">${esc(couple())}</span>
          <span class="letter-rule"></span>
          <span class="eyebrow">${esc(fmtDay(config.date))}</span>
        </div>
      </div>
      <div class="pocket env-part"></div>
      <div class="flap env-part"><div class="flap-face"></div><div class="flap-inside"></div></div>
      <button class="seal" id="seal" aria-label="Break the seal to open your invitation">${seal(esc(initials()))}</button>
    </div>
  </div>
  <div class="intro-copy">
    <p class="to">You are warmly invited</p>
    <p class="eyebrow hint"><span>Tap the seal</span><i></i><span>or scroll</span></p>
  </div>
</div>

<main>
<section class="hero grain" id="hero">
  <svg class="flora flora-tl" viewBox="0 0 600 600" aria-hidden="true">${flora(7)}</svg>
  <svg class="flora flora-br" viewBox="0 0 600 600" aria-hidden="true">${flora(19)}</svg>
  <div class="petals" aria-hidden="true">${petals(12, 5)}</div>
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
  <div class="scroll-hint h-in h-late" aria-hidden="true"><span></span></div>
</section>

<section class="block story" id="story">
  ${wreath(esc(config.partnerOne[0] ?? ''), esc(config.partnerTwo[0] ?? ''))}
  <p class="eyebrow reveal">A little love letter</p>
  <h2 class="reveal">Our favourite day,<br><em>with our favourite people</em></h2>
  <p class="lead words">${config.message
    .split(' ')
    .map((w) => `<span class="word">${esc(w)}</span>`)
    .join(' ')}</p>
</section>

<section class="when grain" id="when">
  <div class="inner">
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

<section class="block timeline-section" id="schedule">
  <p class="eyebrow reveal">Order of the day</p>
  <h2 class="reveal"><em>The celebration</em></h2>
  <div class="timeline">
    <svg class="vine" aria-hidden="true"></svg>
    <ol>
      ${config.schedule
        .map(
          (s) => `<li class="t-item">
        <span class="t-dot" aria-hidden="true"></span>
        ${icon(s)}
        <time class="t-reveal">${fmtTime(at(config.date, s.time))}</time>
        <div class="t-body t-reveal"><h3>${esc(s.title)}</h3>${s.note ? `<p>${esc(s.note)}</p>` : ''}</div>
      </li>`,
        )
        .join('')}
    </ol>
  </div>
</section>

<section class="block venue-section" id="venue">
  <p class="eyebrow reveal">Where</p>
  ${venueArt()}
  <h2 class="reveal venue-name">${esc(config.venue.name)}</h2>
  <p class="reveal muted italic">${esc(config.venue.address)}</p>
  ${config.venue.note ? `<p class="reveal small">${esc(config.venue.note)}</p>` : ''}
  <div class="reveal actions"><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}">View on map</a></div>
</section>

<div class="divider">${flourish()}</div>

<section class="block attire-section" id="attire">
  <p class="eyebrow reveal">Attire</p>
  <h2 class="reveal"><em>${esc(config.dressCode.title)}</em></h2>
  <p class="reveal">${esc(config.dressCode.description)}</p>
  <ul class="palette" aria-label="Suggested colours">${config.dressCode.palette
    .map((p, i) => `<li class="chip">${swatch(p.color, i)}<span>${esc(p.name)}</span></li>`)
    .join('')}</ul>
</section>

<section class="rsvp grain" id="rsvp">
  <svg class="flora flora-rsvp" viewBox="0 0 600 600" aria-hidden="true">${flora(31)}</svg>
  <div class="inner">
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

<footer class="footer">
  ${flourish()}
  <p class="eyebrow reveal">${esc(config.closing)}</p>
  <p class="footer-names"><span class="ink">${esc(couple())}</span></p>
  <p class="eyebrow reveal">${start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' · ')}</p>
  ${config.sample ? '<p class="small sample">Sample invitation — details to be personalised</p>' : ''}
</footer>
</main>`
}
