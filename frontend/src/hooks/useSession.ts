import { useSyncExternalStore } from 'react'
import { getSession, subscribe } from '../services/authService'
import type { Session } from '../services/authService'

// Returns the current demo session, or null if nobody is signed in.
// Components using this update automatically on sign in and sign out.
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession)
}