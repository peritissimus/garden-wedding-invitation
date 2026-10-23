import { config } from '../config'
import { couple, weddingStart } from './format'

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function downloadIcs() {
  const start = weddingStart()
  const end = new Date(start.getTime() + config.durationHours * 3_600_000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Garden Wedding Invitation//EN',
    'BEGIN:VEVENT',
    `UID:${config.date}-${encodeURIComponent(config.partnerOne + config.partnerTwo)}@invitation`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsEscape(`${couple()} — Wedding`)}`,
    `LOCATION:${icsEscape(`${config.venue.name}, ${config.venue.address}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'wedding.ics' })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function googleCalendarUrl() {
  const start = weddingStart()
  const end = new Date(start.getTime() + config.durationHours * 3_600_000)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${couple()} — Wedding`,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: `${config.venue.name}, ${config.venue.address}`,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}
