import { apiRequest } from './api'
import { sampleOrganizerDashboard } from '../data/organizerDashboard'
import { getDemoRegistrations } from './registrationService'
import type { ActivityItem } from '../types'
import type {
  ApplicationRow,
  OrganizerDashboardData,
} from '../types/organizer'

// DEMO MODE: while there is no backend, data comes from
// src/data/organizerDashboard.ts plus any companies registered in this
// browser. When the backend is ready (GET /api/dashboard/organizer),
// set this to false. The page does not need to change.
const USE_DEMO_DATA: boolean = true

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getOrganizerDashboard(): Promise<OrganizerDashboardData> {
  if (USE_DEMO_DATA) {
    await wait(300) // small delay so the loading state can be seen

    const registrations = getDemoRegistrations()

    const local: ApplicationRow[] = registrations.map((record) => ({
      id: record.id,
      companyName: record.companyName,
      industry: record.industry,
      eventId: record.eventId,
      submittedAt: record.submittedAt,
      status: 'Pending review',
      isLocal: true,
    }))

    const localActivity: ActivityItem[] = registrations.map((record) => ({
      id: `reg-${record.id}`,
      text: `${record.companyName} registered in this demo and is waiting for review.`,
      time: record.submittedAt,
    }))

    return {
      ...sampleOrganizerDashboard,
      applications: [...local, ...sampleOrganizerDashboard.applications],
      activity: [...localActivity, ...sampleOrganizerDashboard.activity],
    }
  }

  return apiRequest<OrganizerDashboardData>('/dashboard/organizer')
}