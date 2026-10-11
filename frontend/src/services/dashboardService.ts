import { apiRequest } from './api'
import { sampleCompanyDashboard } from '../data/dashboard'
import { getDemoRegistrations } from './registrationService'
import type { CompanyDashboardData } from '../types'

// DEMO MODE: while there is no backend, dashboard data comes from
// src/data/dashboard.ts (sample company) or from this browser's demo
// registration. When the backend is ready, set this to false.
// The dashboard page does not need to change.
const USE_DEMO_DATA: boolean = true

export type CompanyView = 'sample' | 'registered'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getCompanyDashboard(
  view: CompanyView,
): Promise<CompanyDashboardData | null> {
  if (USE_DEMO_DATA) {
    await wait(300) // small delay so the loading state can be seen

    if (view === 'sample') return sampleCompanyDashboard

    const record = getDemoRegistrations()[0]
    if (!record) return null

    return {
      isSample: false,
      profile: {
        companyName: record.companyName,
        contactName: record.contactName,
        email: record.email,
        phone: record.phone,
        industry: record.industry,
        website: record.website,
      },
      eventId: record.eventId,
      status: 'Pending review',
      stall: null,
      engagement: null,
      activity: [
        {
          id: 'r1',
          text: 'Your registration was submitted. It is waiting for organiser review.',
          time: record.submittedAt,
        },
      ],
    }
  }

  return apiRequest<CompanyDashboardData>('/dashboard/company')
}