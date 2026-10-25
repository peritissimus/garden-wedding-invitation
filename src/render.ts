import { config } from './config'
import { couple, dateRange, dayOf, days, esc, eventStart, fmtDay, fmtTime, fmtWeekday, mainEvent, monthOf, weekdayOf, whatWhen, yearOf, mapLink, venueOf } from './lib/format'
import { sharedDefs } from './art/defs'
import { circleMark, flourish, icon, petals, rsvpArt, venueArt, wreath } from './art/ornaments'
import { rose } from './art/rose'
import { birds, butterflies, fireflies } from './art/scene'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function render(root: HTMLElement) {
  const main = mainEvent()
  const start = eventStart(main)
  const all = days()
  const many = all.length > 1
  const [first, last] = [all[0], all[all.length - 1]]
  // a celebration over several days in one month reads "November | 23 & 24 | 2026"
  const oneMonth = many && monthOf(first) === monthOf(last) && yearOf(first) === yearOf(last)
  const join = all.length === 2 ? ' & ' : ' – '
  const dateBlock = oneMonth
    ? [monthOf(last), all.map(dayOf).join(join), String(yearOf(last))]
    : [weekdayOf(main.date), String(dayOf(main.date)).padStart(2, '0'), `${monthOf(main.date)} ${yearOf(main.date)}`]
  // "Save the date" circles the main day
  const circled = (d: string) => `<span class="circled">${dayOf(d)}${circleMark()}</span>`
  const dateTitle = oneMonth
    ? `${all.map((d) => (d === main.date ? circled(d) : dayOf(d))).join(join)} ${esc(monthOf(last))} ${yearOf(last)}`
    : `${esc(weekdayOf(main.date))}, ${circled(main.date)} ${esc(monthOf(main.date))} ${yearOf(main.date)}`
  const mapQuery = config.venue.mapQuery ?? [config.venue.name, config.venue.address].filter(Boolean).join(' ')
  // each depth of the garden in daylight, sunset and moonlight (painted by stage.ts)
  const looks = '<div class="slot look day"></div><div class="slot look warm"></div><div class="slot look moon"></div>'
  const lighting = '<div class="light-layer"><div class="slot glow"></div><div class="slot glow fairy f0"></div><div class="slot glow fairy f1"></div></div>'

  root.innerHTML = `${sharedDefs}
<div class="stage" id="stage" aria-hidden="true">
  <canvas class="sky" width="1" height="64"></canvas>
  <div class="stars"><div class="slot st-0"></div><div class="slot st-1 twinkle"></div><div class="slot st-2 twinkle"></div></div>
  <div class="sun"><div class="slot day"></div><div class="slot golden"></div><div class="slot sunset"></div></div>
  <div class="moon"><div class="slot"></div></div>
  <div class="clouds"><div class="cloud-band"><div class="slot day"></div><div class="slot golden"></div><div class="slot sunset"></div><div class="slot dusk"></div><div class="slot night"></div></div></div>
  <div class="birds">${birds()}</div>
  <div class="px" data-depth="6"><div class="cam cam-back">${looks}${lighting}</div></div>
  <div class="px" data-depth="14"><div class="cam cam-front">${looks}<div class="butterflies">${butterflies()}</div></div></div>
  <div class="px decor-mandap" data-depth="14"><div class="cam cam-mandap">${looks}${lighting}</div></div>
  <div class="px" data-depth="14"><div class="cam cam-set"><div class="slot set bazaar"></div><div class="slot set palace"></div></div></div>
  <div class="px" data-depth="30"><div class="cam cam-fg">${looks}</div></div>
  <div class="rays"><div class="slot"></div></div>
  <div class="bokeh"><div class="slot"></div></div>
  <div class="petals-day"><div class="petals">${petals(14, 5)}</div></div>
  <div class="fireflies" id="fireflies">${fireflies(44)}</div>
  <div class="shooting"><i></i><i></i></div>
  <canvas class="vignette"></canvas>
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
    <span class="intro-rule" aria-hidden="true"></span>
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
    <p class="eyebrow h-in h-late">invite you to celebrate their wedding</p>
    <div class="date-block h-in h-late">
      <span>${esc(dateBlock[0])}</span><span class="big">${esc(dateBlock[1])}</span><span>${esc(dateBlock[2])}</span>
    </div>
    <div class="scroll-cue h-in h-late" aria-hidden="true"><i></i></div>
  </div>
</section>

<section class="beat" id="story">
  <div class="card">
    ${wreath(esc(config.partnerOne[0] ?? ''), esc(config.partnerTwo[0] ?? ''))}
    <p class="eyebrow reveal">A little love letter</p>
    <h2 class="reveal">Our favourite day${many ? 's' : ''},<br><em>with our favourite people</em></h2>
    <p class="lead reveal">${esc(config.message)}</p>
  </div>
</section>

<section class="beat" id="when">
  <div class="card">
    <p class="eyebrow reveal">Save the date</p>
    <h2 class="reveal date-title">${dateTitle}</h2>
    <p class="reveal muted">${many ? esc(whatWhen()) : `${esc(main.title)} begins at ${fmtTime(start)}`}</p>
    <div class="countdown reveal" id="countdown" aria-label="Time until the wedding"></div>
    <div class="reveal actions">
      <button class="btn" id="ics">Add to calendar</button>
      <a class="btn ghost" id="gcal" target="_blank" rel="noopener">Google Calendar</a>
    </div>
  </div>
</section>

${config.schedule
  .map(
    (s) => `<section class="beat event" id="ev-${slug(s.title)}" data-date="${s.date}" data-time="${s.time}" data-scene="${s.scene ?? 'garden'}">
  <div class="card event-card">
    ${icon(s)}
    <div class="ev-text">
      ${many ? `<p class="ev-day reveal">${esc(fmtWeekday(s.date))}</p>` : ''}
      <time class="reveal">${fmtTime(eventStart(s))}</time>
      <h3 class="reveal">${esc(s.title)}</h3>
      ${(() => {
        const v = venueOf(s)
        return v
          ? `<p class="ev-venue reveal"><a href="${mapLink(v.mapQuery)}" target="_blank" rel="noopener"><svg viewBox="0 0 16 20" aria-hidden="true"><path d="M8 19s6-6.2 6-11A6 6 0 0 0 2 8c0 4.8 6 11 6 11Z"/><circle cx="8" cy="8" r="2.2"/></svg><span>${esc(v.name)}, ${esc(v.area)}</span></a></p>`
          : ''
      })()}
      ${s.note ? `<p class="reveal">${esc(s.note)}</p>` : ''}
      ${
        s.attire
          ? `<p class="ev-attire reveal"><span class="ev-attire-k">Attire</span><span class="ev-attire-v">${esc(s.attire.label)}</span><span class="ev-dots" aria-hidden="true">${s.attire.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span></p>`
          : ''
      }
    </div>
  </div>
</section>`,
  )
  .join('')}

<section class="beat" id="venue">
  <div class="card">
    <p class="eyebrow reveal">The setting</p>
    ${venueArt()}
    ${
      config.venues.length
        ? config.venues
            .map((v) => {
              const held = config.schedule.filter((s) => s.venue === v.name).map((s) => s.title)
              return `<div class="venue-item">
      <p class="eyebrow reveal">${esc(held.join(' & '))}</p>
      <h2 class="reveal venue-name">${esc(v.name)}</h2>
      <p class="reveal muted italic">${esc(v.area)}</p>
      <div class="reveal actions"><a class="btn" target="_blank" rel="noopener" href="${mapLink(v.mapQuery)}">View on map</a></div>
    </div>`
            })
            .join('')
        : `<h2 class="reveal venue-name">${esc(config.venue.name)}</h2>
    ${config.venue.address ? `<p class="reveal muted italic">${esc(config.venue.address)}</p>` : ''}
    <div class="reveal actions"><a class="btn" target="_blank" rel="noopener" href="${mapLink(mapQuery)}">View on map</a></div>`
    }
  </div>
</section>

<section class="beat rsvp" id="rsvp">
  <div class="card">
    ${rsvpArt()}
    ${
      config.rsvp.email
        ? `<p class="eyebrow reveal">Kindly reply</p>
    <h2 class="reveal">Will you <em>join us?</em></h2>
    <p class="reveal muted italic">${config.rsvp.deadline ? `Kindly respond by ${esc(fmtDay(config.rsvp.deadline))}` : 'We can’t wait to celebrate with you!'}</p>
    <div class="reveal actions"><button class="btn solid" id="rsvp-btn">RSVP</button></div>
    ${config.rsvp.note ? `<p class="reveal small">${esc(config.rsvp.note)}</p>` : ''}`
        : `<p class="eyebrow reveal">See you there</p>
    <h2 class="reveal">We can’t wait <em>to celebrate with you!</em></h2>`
    }
  </div>
</section>

<footer class="beat footer" id="footer">
  ${flourish()}
  <p class="eyebrow reveal">${esc(config.closing)}</p>
  <p class="footer-names"><span class="ink">${esc(couple())}</span></p>
  <p class="eyebrow reveal">${esc(dateRange())}</p>
  ${config.sample ? '<p class="small sample">Sample invitation — details to be personalised</p>' : ''}
</footer>
</main>`
}
