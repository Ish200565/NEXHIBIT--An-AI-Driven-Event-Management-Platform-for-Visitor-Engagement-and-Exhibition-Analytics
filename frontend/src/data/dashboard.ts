import type { CompanyDashboardData } from '../types'

// SAMPLE DATA ONLY.
// This fictional company and all of its numbers exist for the frontend demo.
// Later, the dashboard service will return real API data in the same shape.

export const sampleCompanyDashboard: CompanyDashboardData = {
  isSample: true,
  profile: {
    companyName: 'Brightwave Systems (sample)',
    contactName: 'Demo Exhibitor',
    email: 'exhibitor@nexhibit.demo',
    phone: '+91 98000 00000',
    industry: 'Technology & Software',
    website: 'www.example.com',
  },
  eventId: 'nexus-tech-ai-expo',
  status: 'Approved',
  stall: {
    stallNumber: 'B-14',
    hall: 'Hall B, Technology Zone',
    areaSqm: 9,
  },
  engagement: {
    visitors: 1284,
    avgDwellMinutes: 4.6,
    leads: 87,
    peakHour: '13:00',
    hourly: [
      { hour: '09:00', visitors: 40 },
      { hour: '10:00', visitors: 96 },
      { hour: '11:00', visitors: 158 },
      { hour: '12:00', visitors: 214 },
      { hour: '13:00', visitors: 262 },
      { hour: '14:00', visitors: 188 },
      { hour: '15:00', visitors: 143 },
      { hour: '16:00', visitors: 121 },
      { hour: '17:00', visitors: 62 },
    ],
  },
  activity: [
    {
      id: 'a1',
      text: 'Stall B-14 was allocated to your company.',
      time: '2026-10-08T11:20:00',
    },
    {
      id: 'a2',
      text: 'Your application was approved by the organiser.',
      time: '2026-10-05T16:45:00',
    },
    {
      id: 'a3',
      text: 'Your application was submitted for review.',
      time: '2026-10-02T10:30:00',
    },
  ],
}
