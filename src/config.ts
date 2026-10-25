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
  /** Where it is: the name of one of `venues`. */
  venue?: string
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
  /** The venues the celebrations are held at; each event names its own. */
  venues: { name: string; area: string; mapQuery: string }[]
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
  hostLine: 'With full hearts',
  message: 'Two days of love, laughter and a little shaadi magic. It would mean the world to celebrate with you.',
  venue: {
    name: 'Agra',
    address: 'India',
    mapQuery: 'Agra, India',
  },
  venues: [
    { name: 'SNJ Gold Convention Center', area: 'Agra', mapQuery: 'SNJ Gold Convention Center Agra' },
    { name: 'Taj Khema', area: 'Agra', mapQuery: 'Taj Khema Agra' },
  ],
  schedule: [
    { title: 'Haldi', venue: 'SNJ Gold Convention Center', date: '2026-11-23', time: '10:30', durationHours: 3, note: 'A morning of colour, sunshine and new beginnings.', attire: { label: 'Bright, colourful ethnics', colors: ['#f6c22e', '#f08a24', '#e8508a', '#3f9a62'] } },
    { title: 'Sangeet', venue: 'SNJ Gold Convention Center', date: '2026-11-23', time: '19:00', durationHours: 4, note: 'An evening of music, dancing and a little Bollywood magic.', attire: { label: 'Festive glamour', colors: ['#d4a537', '#b8296e', '#2f3f9e', '#c9ced6'] } },
    { title: 'Wedding', venue: 'Taj Khema', date: '2026-11-24', time: '12:00', durationHours: 4, note: 'The beginning of our forever, with you by our side.', attire: { label: 'Pretty pastels', colors: ['#f2c9d1', '#cbe6d6', '#dccff0', '#c9dcef', '#f7d5c0'] } },
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
