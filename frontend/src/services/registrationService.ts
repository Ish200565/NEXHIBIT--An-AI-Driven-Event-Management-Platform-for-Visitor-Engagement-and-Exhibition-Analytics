import { ApiError, apiRequest } from './api'
import type { RegistrationInput, RegistrationRecord } from '../types'

// DEMO MODE
// While there is no backend, registrations are saved in this browser's
// localStorage. localStorage is NOT a database: it is private to this browser,
// it is not shared with anyone, it is not secure, and it can be cleared at any
// time. It exists only so the demo can show a registration after submitting.
//
// The password is NEVER saved. In the real system it will be sent to the
// backend over HTTPS and the backend will store only a secure hash of it.
//
// When the backend is ready (POST /api/registrations), set this to false.
// The Register page does not need to change.
const USE_DEMO_DATA: boolean = true

const STORAGE_KEY = 'nexhibit-demo-registrations'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readStored(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RegistrationRecord[]) : []
  } catch {
    return []
  }
}

function writeStored(records: RegistrationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    throw new Error(
      'Your browser blocked saving demo data. Check that storage is allowed for this site and try again.',
    )
  }
}

function makeId(): string {
  return `NX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function registerCompany(
  input: RegistrationInput,
): Promise<RegistrationRecord> {
  if (USE_DEMO_DATA) {
    await wait(900) // small delay so the loading state can be seen

    const existing = readStored()
    const email = input.email.trim().toLowerCase()

    if (existing.some((item) => item.email.toLowerCase() === email)) {
      throw new ApiError(
        'This email address is already registered in the demo. Use a different email, or clear the demo data.',
        409,
      )
    }

    // Build the record field by field so the password can never slip in.
    const record: RegistrationRecord = {
      id: makeId(),
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email.trim(),
      phone: input.phone,
      industry: input.industry,
      website: input.website,
      eventId: input.eventId,
      submittedAt: new Date().toISOString(),
      status: 'Pending review',
    }

    writeStored([record, ...existing])
    return record
  }

  return apiRequest<RegistrationRecord>('/registrations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// Demo-only helpers. The company dashboard (Batch 7) uses these.
export function getDemoRegistrations(): RegistrationRecord[] {
  return readStored()
}

export function clearDemoRegistrations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
