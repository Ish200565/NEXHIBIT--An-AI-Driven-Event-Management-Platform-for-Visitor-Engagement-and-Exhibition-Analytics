import type { ActivityItem, ApplicationStatus, HourlyVisitors } from './index'

export interface ApplicationRow {
  id: string
  companyName: string
  industry: string
  eventId: string // empty string = no event chosen
  submittedAt: string // ISO date-time
  status: ApplicationStatus
  isLocal: boolean // true = registered in this browser during the demo
}

export interface TopZone {
  name: string
  visitors: number
}

export interface OrganizerDashboardData {
  isSample: boolean
  applications: ApplicationRow[]
  allocatedBase: Record<string, number> // stalls already allocated, per event id
  footfall: HourlyVisitors[]
  heat: number[] // 28 values (7 columns x 4 rows), 0 = quiet, 4 = busiest
  topZones: TopZone[]
  activity: ActivityItem[]
}