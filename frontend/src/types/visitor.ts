export interface VisitorInput {
  fullName: string
  email: string
  phone: string
  eventId: string
  visitorType: string
}

// Nothing sensitive is stored. There is no password for visitors.
export interface VisitorRecord {
  id: string // the Registration ID, also the content of the QR code
  fullName: string
  email: string
  phone: string
  eventId: string
  visitorType: string
  registeredAt: string // ISO date-time
}