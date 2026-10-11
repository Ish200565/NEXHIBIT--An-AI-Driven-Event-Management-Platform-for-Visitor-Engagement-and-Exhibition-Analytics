import { apiRequest, ApiError } from './api'

export type Role = 'exhibitor' | 'organizer'

// Only non-sensitive details are kept. There is never a password in here.
export interface Session {
  email: string
  name: string
  role: Role
  isDemo: boolean
}

// DEMO MODE
// While there is no backend, only the fictional accounts below can sign in.
// The demo password is published on the Login page on purpose: it protects
// nothing. Never type a real password into this demo.
//
// The session is kept in sessionStorage (cleared when the tab is closed).
// This is NOT real security: anyone can edit browser storage.
//
// When the backend is ready (POST /api/auth/login), set this to false.
// The Login page does not need to change.
// Note for later: the real backend will return a token (JWT). Where to keep
// it (an httpOnly cookie is the safest choice) is a decision to make with
// whoever builds the backend.
const USE_DEMO_DATA: boolean = true

const SESSION_KEY = 'nexhibit-demo-session'

export const DEMO_PASSWORD = 'Demo@1234'

export interface DemoAccount {
  email: string
  name: string
  role: Role
  description: string
}

export const demoAccounts: DemoAccount[] = [
  {
    email: 'exhibitor@nexhibit.demo',
    name: 'Demo Exhibitor',
    role: 'exhibitor',
    description:
      'A sample participating company. Opens the company dashboard.',
  },
  {
    email: 'organizer@nexhibit.demo',
    name: 'Demo Organiser',
    role: 'organizer',
    description: 'A sample exhibition organiser. Opens the organiser dashboard.',
  },
]

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session> | null
    if (
      parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.name === 'string' &&
      (parsed.role === 'exhibitor' || parsed.role === 'organizer')
    ) {
      return {
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        isDemo: parsed.isDemo === true,
      }
    }
    return null
  } catch {
    return null
  }
}

// A tiny store so every component sees the same session.
let current: Session | null = readSession()
const listeners = new Set<() => void>()

function setSession(session: Session | null): void {
  current = session
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // Storage blocked: the session still works until the page is refreshed.
  }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession(): Session | null {
  return current
}

export function logout(): void {
  setSession(null)
}

export async function login(
  email: string,
  password: string,
): Promise<Session> {
  if (USE_DEMO_DATA) {
    await wait(700) // small delay so the loading state can be seen

    const account = demoAccounts.find(
      (item) => item.email === email.trim().toLowerCase(),
    )

    if (!account || password !== DEMO_PASSWORD) {
      throw new ApiError(
        'That email and password do not match a demo account. Use one of the demo accounts shown on this page.',
        401,
      )
    }

    const session: Session = {
      email: account.email,
      name: account.name,
      role: account.role,
      isDemo: true,
    }
    setSession(session)
    return session
  }

  const session = await apiRequest<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setSession(session)
  return session
}