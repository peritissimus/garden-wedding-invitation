import { config, type ScheduleItem } from '../config'

/**
 * Every time on the invitation is venue time. Events are real instants (with
 * the venue's UTC offset), so the countdown and calendar entries are right for
 * guests anywhere, and dates and times are always shown as they are at the venue.
 */
export const at = (date: string, time: string) => new Date(`${date}T${time}:00${config.utcOffset}`)
export const eventStart = (s: ScheduleItem) => at(s.date, s.time)
export const eventEnd = (s: ScheduleItem) => new Date(eventStart(s).getTime() + s.durationHours * 3_600_000)
export const mainEvent = () => config.schedule[config.mainEvent] ?? config.schedule[config.schedule.length - 1]
export const weddingStart = () => eventStart(mainEvent())

const local = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString('en-GB', { ...o, timeZone: config.timeZone })
const noon = (iso: string) => at(iso, '12:00')

export const fmtTime = (d: Date) => local(d, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase()
export const fmtDay = (iso: string) => local(noon(iso), { day: 'numeric', month: 'long', year: 'numeric' })
export const fmtWeekday = (iso: string) => local(noon(iso), { weekday: 'long', day: 'numeric', month: 'long' })
export const weekdayOf = (iso: string) => local(noon(iso), { weekday: 'long' })
export const monthOf = (iso: string) => local(noon(iso), { month: 'long' })
export const dayOf = (iso: string) => Number(iso.slice(8, 10))
export const yearOf = (iso: string) => Number(iso.slice(0, 4))

/** The days of the celebrations, in order ("YYYY-MM-DD"). */
export const days = () => [...new Set(config.schedule.map((s) => s.date))].sort()

/** "19 June 2027", "23 & 24 November 2026" or "19 – 21 November 2027". */
export function dateRange() {
  const ds = days()
  const [a, b] = [ds[0], ds[ds.length - 1]]
  if (a === b) return fmtDay(a)
  const join = ds.length === 2 ? ' & ' : ' – '
  if (yearOf(a) !== yearOf(b)) return `${fmtDay(a)}${join}${fmtDay(b)}`
  if (monthOf(a) !== monthOf(b)) return `${dayOf(a)} ${monthOf(a)}${join}${dayOf(b)} ${monthOf(b)} ${yearOf(b)}`
  return `${dayOf(a)}${join}${dayOf(b)} ${monthOf(b)} ${yearOf(b)}`
}

/** "Haldi & Sangeet on Monday · Wedding on Tuesday" */
export const whatWhen = () =>
  days()
    .map((d) => `${config.schedule.filter((s) => s.date === d).map((s) => s.title).join(' & ')} on ${weekdayOf(d)}`)
    .join(' · ')

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const initials = () => `${config.partnerOne[0] ?? ''}${config.partnerTwo[0] ?? ''}`
export const couple = () => `${config.partnerOne} & ${config.partnerTwo}`
