import './styles/main.css'
import { config } from './config'
import { render } from './render'
import { setupAnimations } from './animations'
import { couple, weddingStart } from './lib/format'
import { downloadIcs, googleCalendarUrl } from './lib/calendar'

const app = document.getElementById('app')!
render(app)
document.title = `${couple()} — Wedding invitation`

// Countdown
const countdown = document.getElementById('countdown')!
function tick() {
  const mins = Math.floor(Math.max(0, weddingStart().getTime() - Date.now()) / 60000)
  const parts: [number, string][] = [
    [Math.floor(mins / 1440), 'days'],
    [Math.floor(mins / 60) % 24, 'hours'],
    [mins % 60, 'minutes'],
  ]
  if (!countdown.children.length) {
    countdown.innerHTML = parts.map(([, l]) => `<div><strong></strong><small>${l}</small></div>`).join('')
  }
  parts.forEach(([n], i) => (countdown.children[i].querySelector('strong')!.textContent = String(n).padStart(2, '0')))
}
tick()
setInterval(tick, 30_000)

// Calendar
document.getElementById('ics')!.addEventListener('click', downloadIcs)
;(document.getElementById('gcal') as HTMLAnchorElement).href = googleCalendarUrl()

// RSVP
document.getElementById('rsvp-btn')!.addEventListener('click', () => {
  if (!config.rsvp.email) {
    document.getElementById('rsvp-note')!.textContent = 'RSVP details are coming soon.'
    return
  }
  const subject = encodeURIComponent(`RSVP — ${couple()}`)
  const body = encodeURIComponent(
    `Dear ${couple()},\n\nName(s):\nAttending: Yes / No\nDietary requirements:\n\nWith love,\n`,
  )
  location.href = `mailto:${config.rsvp.email}?subject=${subject}&body=${body}`
})

setupAnimations()
