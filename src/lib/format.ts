import { config } from '../config'

export const at = (date: string, time: string) => new Date(`${date}T${time}:00`)
export const weddingStart = () => at(config.date, config.ceremonyTime)

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase()

export const fmtLongDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const initials = () => `${config.partnerOne[0] ?? ''}${config.partnerTwo[0] ?? ''}`
export const couple = () => `${config.partnerOne} & ${config.partnerTwo}`
