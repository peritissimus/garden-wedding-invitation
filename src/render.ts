import { config } from './config'
import { at, couple, esc, fmtDay, fmtLongDate, fmtTime, initials, weddingStart } from './lib/format'
import { flora } from './lib/flora'

const sprig = `<svg class="sprig" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V6M12 10c-3-1-5-3-5-6 3 0 5 2 5 6Zm0 0c3-1 5-3 5-6-3 0-5 2-5 6Zm0 5c-3-1-5-3-5-6 3 0 5 2 5 6Zm0 0c3-1 5-3 5-6-3 0-5 2-5 6Z"/></svg>`
const flourish = `<svg class="flourish draw" viewBox="0 0 120 22" aria-hidden="true"><path d="M2 11h40c6 0 9-8 18-8s12 8 18 8h40"/><path d="M60 3c-4 4-4 12 0 16 4-4 4-12 0-16Z"/></svg>`

/** Wrap each character for staggered reveals; keeps the full word for screen readers. */
const chars = (s: string) =>
  `<span class="sr-only">${esc(s)}</span><span class="chars" aria-hidden="true">${[...s]
    .map((c) => `<span class="char">${c === ' ' ? '&nbsp;' : esc(c)}</span>`)
    .join('')}</span>`

export function render(root: HTMLElement) {
  const start = weddingStart()
  const day = start.toLocaleDateString('en-GB', { weekday: 'long' })
  const month = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const mapQuery = config.venue.mapQuery ?? `${config.venue.name} ${config.venue.address}`

  root.innerHTML = `
<section class="scene" id="scene" aria-label="Your invitation envelope">
  <div class="scene-pin">
    <div class="scene-bg grain"></div>
    <div class="envelope-wrap">
      <div class="envelope" id="envelope">
        <div class="env-back"></div>
        <div class="letter" id="letter">
          <div class="letter-inner">
            <span class="eyebrow">The wedding of</span>
            <span class="letter-names">${esc(couple())}</span>
            <span class="letter-rule"></span>
            <span class="eyebrow">${esc(fmtDay(config.date))}</span>
          </div>
        </div>
        <div class="pocket"></div>
        <div class="flap" id="flap"><div class="flap-face"></div><div class="flap-inside"></div></div>
        <button class="seal" id="seal" aria-label="Break the seal to open your invitation">
          <span>${esc(initials())}</span>
        </button>
      </div>
    </div>
    <div class="scene-copy" id="scene-copy">
      <p class="to">You are warmly invited</p>
      <p class="eyebrow hint"><span>Tap the seal</span><i></i><span>or scroll</span></p>
    </div>
    <div class="scroll-cue" id="scroll-cue" aria-hidden="true"><span></span></div>
  </div>
</section>

<section class="hero grain" id="hero">
  <svg class="flora flora-tl" viewBox="0 0 600 600" aria-hidden="true">${flora(7)}</svg>
  <svg class="flora flora-br" viewBox="0 0 600 600" aria-hidden="true">${flora(19)}</svg>
  <div class="hero-copy">
    <p class="eyebrow hero-fade">${esc(config.hostLine)}</p>
    <h1 class="names">
      <span class="name">${chars(config.partnerOne)}</span>
      <span class="amp hero-fade">and</span>
      <span class="name">${chars(config.partnerTwo)}</span>
    </h1>
    <p class="eyebrow hero-fade">request the pleasure of your company</p>
    <div class="date-block hero-fade">
      <span>${esc(day)}</span><span class="big">${String(start.getDate()).padStart(2, '0')}</span><span>${esc(month)}</span>
    </div>
  </div>
</section>

<section class="block letter-section" id="story">
  ${flourish}
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
    <h2 class="reveal">${esc(fmtLongDate(start))}</h2>
    <p class="reveal muted">Ceremony begins at ${fmtTime(start)}</p>
    <div class="countdown reveal" id="countdown" aria-label="Time until the wedding" aria-live="off"></div>
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
    <span class="timeline-track" aria-hidden="true"><span class="timeline-fill"></span></span>
    <ol>
    ${config.schedule
      .map(
        (s) => `<li class="t-item">
      <span class="t-dot" aria-hidden="true"></span>
      <time>${fmtTime(at(config.date, s.time))}</time>
      <div><h3>${esc(s.title)}</h3>${s.note ? `<p>${esc(s.note)}</p>` : ''}</div>
    </li>`,
      )
      .join('')}
    </ol>
  </div>
</section>

<section class="block venue-section" id="venue">
  <p class="eyebrow reveal">Where</p>
  <svg class="venue-art draw" viewBox="0 0 240 130" aria-hidden="true">
    <path d="M30 112h180"/><path d="M58 112V60h124v52"/><path d="M48 60l72-40 72 40"/>
    <path d="M104 112V80c0-9 7-16 16-16s16 7 16 16v32"/><path d="M70 74h18v22H70z"/><path d="M152 74h18v22h-18z"/>
    <path d="M120 20v-8M116 12h8"/>
    <path d="M22 112c0-20 0-34-6-44 10 6 10 24 6 44m0 0c4-18 10-30 18-34-6 10-10 22-18 34"/>
    <path d="M218 112c0-20 0-34 6-44-10 6-10 24-6 44m0 0c-4-18-10-30-18-34 6 10 10 22 18 34"/>
  </svg>
  <h2 class="reveal venue-name">${esc(config.venue.name)}</h2>
  <p class="reveal muted italic">${esc(config.venue.address)}</p>
  ${config.venue.note ? `<p class="reveal small">${esc(config.venue.note)}</p>` : ''}
  <div class="reveal actions"><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}">View on map</a></div>
</section>

<div class="divider reveal">${sprig}</div>

<section class="block attire-section" id="attire">
  <p class="eyebrow reveal">Attire</p>
  <h2 class="reveal"><em>${esc(config.dressCode.title)}</em></h2>
  <p class="reveal">${esc(config.dressCode.description)}</p>
  <div class="palette" aria-label="Suggested colours">${config.dressCode.palette
    .map((c) => `<i class="swatch" style="--c:${c}"></i>`)
    .join('')}</div>
</section>

<section class="rsvp grain" id="rsvp">
  <svg class="flora flora-rsvp" viewBox="0 0 600 600" aria-hidden="true">${flora(31)}</svg>
  <div class="inner">
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
  ${flourish}
  <p class="eyebrow">${esc(config.closing)}</p>
  <p class="footer-names">${esc(couple())}</p>
  <p class="eyebrow">${start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' · ')}</p>
  ${config.sample ? '<p class="small sample">Sample invitation — details to be personalised</p>' : ''}
</footer>`
}
