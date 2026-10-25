/**
 * All invitation content lives here. Edit this file, then redeploy.
 * Dates and times are as they are at the venue (see `timeZone`).
 */
export type IconName = 'rings' | 'glasses' | 'dinner' | 'music' | 'sprig' | 'haldi'

export interface ScheduleItem {
  title: string
  date: string // "YYYY-MM-DD"
  time: string // 24h "HH:MM"
  /** How long it runs, for calendar entries. */
  durationHours: number
  note?: string
  /** Optional; otherwise picked from the title (wedding → rings, sangeet → music…). */
  icon?: IconName
  /** What to wear, shown on the event's card: a short dress code and a few colours to suggest it. */
  attire?: { label: string; colors: string[] }
}

export interface WeddingConfig {
  partnerOne: string
  partnerTwo: string
  /** The venue's time zone and its UTC offset: countdowns and calendar entries are right wherever guests are. */
  timeZone: string
  utcOffset: string
  hostLine: string
  message: string
  venue: { name: string; address?: string; mapQuery?: string; note?: string }
  schedule: ScheduleItem[]
  /** Index into `schedule` of the main event: the countdown and "Save the date" point to it. */
  mainEvent: number
  dressCode: { title: string; description: string; palette: { name: string; color: string }[] }
  /** Leave `email` empty to leave the RSVP button out. */
  rsvp: { email: string; deadline?: string; note?: string }
  closing: string
  /** Shows a small "sample" note in the footer until real details are in. */
  sample: boolean
}

export const config: WeddingConfig = {
  partnerOne: 'Arutna',
  partnerTwo: 'Kushal',
  timeZone: 'Asia/Kolkata',
  utcOffset: '+05:30',
  hostLine: 'And it’s finally happening!',
  message: 'The countdown to two days of love, laughter, dancing and all things shaadi begins!',
  venue: {
    name: 'Agra',
    address: 'India',
    mapQuery: 'Agra, India',
  },
  schedule: [
    { title: 'Haldi', date: '2026-11-23', time: '10:30', durationHours: 3, note: 'Come in your brightest, most colourful ethnics!', attire: { label: 'Bright, colourful ethnics', colors: ['#f6c22e', '#f08a24', '#e8508a', '#3f9a62'] } },
    { title: 'Sangeet', date: '2026-11-23', time: '19:00', durationHours: 4, note: 'Bring your Bollywood energy, killer moves and most extraaaa outfits!', attire: { label: 'Glam & extraaaa', colors: ['#d4a537', '#b8296e', '#2f3f9e', '#c9ced6'] } },
    { title: 'Wedding', date: '2026-11-24', time: '12:00', durationHours: 4, note: 'Pretty pastels and your best ethnic fits!', attire: { label: 'Pretty pastels', colors: ['#f2c9d1', '#cbe6d6', '#dccff0', '#c9dcef', '#f7d5c0'] } },
  ],
  mainEvent: 2,
  dressCode: {
    title: 'Your best ethnic fits',
    description:
      'Your brightest, most colourful ethnics for the Haldi, your most extraaaa outfits for the Sangeet, and pretty pastels for the Wedding — like these:',
    palette: [
      { name: 'Blush', color: '#f2c9d1' },
      { name: 'Mint', color: '#cbe6d6' },
      { name: 'Lilac', color: '#dccff0' },
      { name: 'Powder blue', color: '#c9dcef' },
      { name: 'Peach', color: '#f7d5c0' },
    ],
  },
  rsvp: {
    email: '',
  },
  closing: 'With love',
  sample: false,
}
