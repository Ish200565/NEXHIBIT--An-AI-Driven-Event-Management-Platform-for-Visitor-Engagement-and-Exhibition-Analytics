import type { EventCategory, EventItem } from '../types'

// SAMPLE DATA ONLY.
// These events, venues and figures are fictional and exist for the frontend
// demo. Later, getEvents() in the service layer will return real API data.

export const eventCategories: EventCategory[] = [
  'Technology',
  'Manufacturing',
  'Healthcare',
  'Education',
  'Sustainability',
  'Design',
]

export const sampleEvents: EventItem[] = [
  {
    id: 'nexus-tech-ai-expo',
    name: 'Nexus Tech & AI Expo',
    category: 'Technology',
    startDate: '2027-02-12',
    endDate: '2027-02-14',
    venue: 'Meridian Convention Centre',
    city: 'Mumbai',
    summary:
      'Software, cloud and applied AI companies meet start-ups and students.',
    description:
      'A three-day showcase of software, cloud, robotics and applied AI. Exhibitors present live demos, while visitors explore halls themed around data, automation and smart infrastructure.',
    expectedVisitors: 6500,
    stallCount: 120,
    highlights: ['Live product demos', 'Start-up pavilion', 'Student project zone'],
  },
  {
    id: 'industria-manufacturing-summit',
    name: 'Industria Manufacturing Summit',
    category: 'Manufacturing',
    startDate: '2027-03-05',
    endDate: '2027-03-07',
    venue: 'Western Industrial Expo Grounds',
    city: 'Pune',
    summary:
      'Machinery, automation and supply-chain suppliers under one roof.',
    description:
      'Factory automation, machine tools and logistics providers display their latest equipment. Buyers can meet suppliers, compare solutions and book follow-up meetings.',
    expectedVisitors: 8200,
    stallCount: 160,
    highlights: ['Machinery demonstration floor', 'Buyer-supplier meetings', 'Automation showcase'],
  },
  {
    id: 'medix-healthcare-fair',
    name: 'MediX Healthcare Innovation Fair',
    category: 'Healthcare',
    startDate: '2027-03-19',
    endDate: '2027-03-21',
    venue: 'Lakeside Exhibition Hall',
    city: 'Ahmedabad',
    summary:
      'Medical devices, diagnostics and digital health solutions.',
    description:
      'Hospitals, device makers and digital health teams come together to present diagnostics, telemedicine and wellness technology to clinicians and administrators.',
    expectedVisitors: 4800,
    stallCount: 90,
    highlights: ['Diagnostics showcase', 'Digital health lab', 'Clinician networking hour'],
  },
  {
    id: 'edutech-campus-showcase',
    name: 'EduTech Campus Showcase',
    category: 'Education',
    startDate: '2027-04-09',
    endDate: '2027-04-10',
    venue: 'Pinnacle University Arena',
    city: 'Bengaluru',
    summary:
      'Learning platforms, labs and institutions for students and educators.',
    description:
      'Universities and learning-technology companies present courses, tools and campus innovations. Students can explore programmes and meet recruiters.',
    expectedVisitors: 3900,
    stallCount: 70,
    highlights: ['Course and programme fair', 'Recruiter lounge', 'Student demo stage'],
  },
  {
    id: 'greenfuture-sustainability-expo',
    name: 'GreenFuture Sustainability Expo',
    category: 'Sustainability',
    startDate: '2027-05-14',
    endDate: '2027-05-16',
    venue: 'Harbour Front Expo Centre',
    city: 'Chennai',
    summary:
      'Clean energy, recycling and sustainable materials for a greener industry.',
    description:
      'Renewable energy providers, recycling innovators and sustainable material suppliers show practical solutions for businesses and communities.',
    expectedVisitors: 5200,
    stallCount: 100,
    highlights: ['Clean energy pavilion', 'Circular economy talks', 'Sustainable materials gallery'],
  },
  {
    id: 'design-interiors-week',
    name: 'Design & Interiors Week',
    category: 'Design',
    startDate: '2027-06-11',
    endDate: '2027-06-13',
    venue: 'Orchid Hall, Grand Pavilion',
    city: 'Delhi',
    summary:
      'Architecture, furniture and interior design studios and suppliers.',
    description:
      'Designers, architects and material suppliers present collections and concepts, with walk-through installations that show how spaces come together.',
    expectedVisitors: 4300,
    stallCount: 85,
    highlights: ['Walk-through installations', 'Materials library', 'Designer talks'],
  },
]

export function getEventById(id: string): EventItem | undefined {
  return sampleEvents.find((event) => event.id === id)
}

// Turns two ISO dates into text such as "12–14 Feb 2027".
export function formatDateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  const month = (d: Date) => d.toLocaleString('en-GB', { month: 'short' })
  const year = e.getFullYear()

  if (start === end) {
    return `${s.getDate()} ${month(s)} ${year}`
  }
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${month(e)} ${year}`
  }
  return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${year}`
}
