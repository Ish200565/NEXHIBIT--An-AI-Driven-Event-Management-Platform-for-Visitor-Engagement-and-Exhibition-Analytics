import { apiRequest } from './api'
import { sampleEvents } from '../data/events'
import type { EventItem } from '../types'

// DEMO MODE: while there is no backend, events come from src/data/events.ts.
// When the backend is ready (GET /api/events), set this to false.
// No page needs to change, because pages only call the functions below.
const USE_DEMO_DATA: boolean = true

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getEvents(): Promise<EventItem[]> {
  if (USE_DEMO_DATA) {
    await wait(300) // small delay so the loading state can be seen
    return sampleEvents
  }
  return apiRequest<EventItem[]>('/events')
}

export async function getEvent(id: string): Promise<EventItem | null> {
  if (USE_DEMO_DATA) {
    await wait(200)
    return sampleEvents.find((event) => event.id === id) ?? null
  }
  return apiRequest<EventItem>(`/events/${id}`)
}