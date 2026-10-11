// Shared TypeScript types for NEXHIBIT.

export interface NavItem {
  label: string
  to: string
}

export type EventCategory =
  | 'Technology'
  | 'Manufacturing'
  | 'Healthcare'
  | 'Education'
  | 'Sustainability'
  | 'Design'

// SAMPLE DATA: events in this project are fictional demo content.
export interface EventItem {
  id: string
  name: string
  category: EventCategory
  startDate: string // format: YYYY-MM-DD
  endDate: string // format: YYYY-MM-DD
  venue: string
  city: string
  summary: string
  description: string
  expectedVisitors: number
  stallCount: number
  highlights: string[]
}

// What the registration form sends to the service.
// The password is only used to check the form (and, in the future, to be sent
// to the real backend over HTTPS). The demo service never stores it.
export interface RegistrationInput {
  companyName: string
  contactName: string
  email: string
  phone: string
  industry: string
  website: string
  eventId: string // empty string = no specific event
  password: string
}

// What is kept after a registration. It deliberately has no password field.
export interface RegistrationRecord {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  industry: string
  website: string
  eventId: string
  submittedAt: string // ISO date-time
  status: 'Pending review'
}

// ===== Dashboard types =====

export type ApplicationStatus = 'Pending review' | 'Approved' | 'Rejected'

export interface CompanyProfile {
  companyName: string
  contactName: string
  email: string
  phone: string
  industry: string
  website: string
}

export interface StallAllocation {
  stallNumber: string
  hall: string
  areaSqm: number
}

export interface HourlyVisitors {
  hour: string // for example "10:00"
  visitors: number
}

export interface EngagementMetrics {
  visitors: number
  avgDwellMinutes: number
  leads: number
  peakHour: string
  hourly: HourlyVisitors[]
}

export interface ActivityItem {
  id: string
  text: string
  time: string // ISO date-time
}

export interface CompanyDashboardData {
  isSample: boolean
  profile: CompanyProfile
  eventId: string // empty string = no event chosen
  status: ApplicationStatus
  stall: StallAllocation | null
  engagement: EngagementMetrics | null
  activity: ActivityItem[]
}