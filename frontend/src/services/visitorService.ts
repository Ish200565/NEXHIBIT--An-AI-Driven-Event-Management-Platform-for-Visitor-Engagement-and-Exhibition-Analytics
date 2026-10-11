import { ApiError, apiRequest } from './api'
import type { VisitorInput, VisitorRecord } from '../types/visitor'

// DEMO MODE: visitors are saved in this browser's localStorage only.
// It is not a database: it is private to this browser, not shared, not
// secure, and can be cleared at any time.
// When the backend is ready (POST /api/visitors/register), set this to
// false. The page does not need to change.
const USE_DEMO_DATA: boolean = true

const STORAGE_KEY = 'nexhibit-demo-visitors'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readStored(): VisitorRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as VisitorRecord[]) : []
  } catch {
    return []
  }
}

function writeStored(records: VisitorRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    throw new Error(
      'Your browser blocked saving demo data. Check that storage is allowed for this site and try again.',
    )
  }
}

function makeId(): string {
  const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `VIS-${code}`
}

export async function registerVisitor(
  input: VisitorInput,
): Promise<VisitorRecord> {
  if (USE_DEMO_DATA) {
    await wait(800) // small delay so the loading state can be seen

    const existing = readStored()
    const email = input.email.trim().toLowerCase()

    if (
      existing.some(
        (item) =>
          item.email.toLowerCase() === email && item.eventId === input.eventId,
      )
    ) {
      throw new ApiError(
        'This email is already registered for that event in the demo. Use a different email or choose another event.',
        409,
      )
    }

    const record: VisitorRecord = {
      id: makeId(),
      fullName: input.fullName,
      email: input.email.trim(),
      phone: input.phone,
      eventId: input.eventId,
      visitorType: input.visitorType,
      registeredAt: new Date().toISOString(),
    }

    writeStored([record, ...existing])
    return record
  }

  return apiRequest<VisitorRecord>('/visitors/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}