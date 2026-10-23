/**
 * All invitation content lives here. Edit this file, then redeploy.
 * Times are local to the venue.
 */
export interface ScheduleItem {
  time: string // 24h "HH:MM"
  title: string
  note?: string
}

export interface WeddingConfig {
  partnerOne: string
  partnerTwo: string
  date: string // "YYYY-MM-DD"
  ceremonyTime: string // "HH:MM"
  durationHours: number
  hostLine: string
  message: string
  venue: { name: string; address: string; mapQuery?: string; note?: string }
  schedule: ScheduleItem[]
  dressCode: { title: string; description: string; palette: string[] }
  rsvp: { email: string; deadline?: string; note?: string }
  closing: string
  /** Shows a small "sample" note in the footer until real details are in. */
  sample: boolean
}

export const config: WeddingConfig = {
  partnerOne: 'Amelia',
  partnerTwo: 'Oliver',
  date: '2027-06-19',
  ceremonyTime: '16:00',
  durationHours: 7,
  hostLine: 'Together with their families',
  message:
    'Together with our families, we would love for you to join us for a day of love, laughter, and the beginning of our forever.',
  venue: {
    name: 'The Rosewood Gardens',
    address: 'Your venue address goes here',
    note: 'Ceremony on the lawn, reception in the glasshouse.',
  },
  schedule: [
    { time: '16:00', title: 'Ceremony', note: 'On the garden lawn' },
    { time: '17:00', title: 'Cocktails', note: 'Drinks & canapés by the roses' },
    { time: '19:00', title: 'Dinner', note: 'In the glasshouse' },
    { time: '21:00', title: 'Dancing', note: 'Until the stars come out' },
  ],
  dressCode: {
    title: 'Garden formal',
    description: 'Soft, romantic colours welcome. Comfortable shoes for the lawn.',
    palette: ['#e8cfc4', '#c9cfb7', '#ece3d2', '#b9c4cf', '#d9c2a0'],
  },
  rsvp: {
    email: '',
    deadline: '2027-05-01',
    note: 'Please let us know of any dietary requirements.',
  },
  closing: 'With love',
  sample: true,
}
