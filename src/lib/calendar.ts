import { config, type ScheduleItem } from '../config'
import { couple, eventEnd, eventStart, mainEvent, venueOf } from './format'

/** UTC timestamps (…Z), so each calendar shows the event at the right moment wherever the guest is. */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
/** iCalendar lines are folded so none runs past 75 bytes. */
const fold = (line: string) => (line.match(/.{1,60}/gu) ?? ['']).join('\r\n ')
/** Each celebration's own venue, or the city when it has none. */
const where = (s?: ScheduleItem) => {
  const v = s && venueOf(s)
  return v ? `${v.name}, ${v.area}` : [config.venue.name, config.venue.address].filter(Boolean).join(', ')
}
const title = (s: ScheduleItem) => `${s.title} — ${couple()}`

/** One .ics file with every celebration in it. */
export function downloadIcs() {
  const now = stamp(new Date())
  const events = config.schedule.flatMap((s, i) => [
    'BEGIN:VEVENT',
    `UID:${s.date}-${i}-${encodeURIComponent(config.partnerOne + config.partnerTwo)}@invitation`,
    `DTSTAMP:${now}`,
    `DTSTART:${stamp(eventStart(s))}`,
    `DTEND:${stamp(eventEnd(s))}`,
    `SUMMARY:${icsEscape(title(s))}`,
    `LOCATION:${icsEscape(where(s))}`,
    ...(s.note ? [`DESCRIPTION:${icsEscape(s.note)}`] : []),
    'END:VEVENT',
  ])
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Garden Wedding Invitation//EN', ...events, 'END:VCALENDAR']
    .map(fold)
    .join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'wedding.ics' })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function googleCalendarUrl() {
  const s = mainEvent()
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(s),
    dates: `${stamp(eventStart(s))}/${stamp(eventEnd(s))}`,
    location: where(s),
    details: s.note ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p}`
}
