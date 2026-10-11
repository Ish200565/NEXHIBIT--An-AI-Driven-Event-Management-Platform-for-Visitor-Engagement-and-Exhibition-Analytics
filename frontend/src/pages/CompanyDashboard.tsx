import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Info,
  LayoutGrid,
  Target,
  Timer,
  Users,
} from 'lucide-react'
import Button, { ButtonLink } from '../components/Button'
import { formatDateRange } from '../data/events'
import { useSession } from '../hooks/useSession'
import { getCompanyDashboard } from '../services/dashboardService'
import type { CompanyView } from '../services/dashboardService'
import { getEvents } from '../services/eventService'
import { getDemoRegistrations } from '../services/registrationService'
import type {
  ApplicationStatus,
  CompanyDashboardData,
  EventItem,
} from '../types'
import './Events.css'
import './Dashboard.css'

type LoadStatus = 'loading' | 'error' | 'ready'
type StepState = 'done' | 'current' | 'todo' | 'rejected'

interface Step {
  label: string
  state: StepState
}

const stepStateText: Record<StepState, string> = {
  done: 'completed',
  current: 'in progress',
  todo: 'not started',
  rejected: 'not approved',
}

const badgeClass: Record<ApplicationStatus, string> = {
  'Pending review': 'status-pending',
  Approved: 'status-approved',
  Rejected: 'status-rejected',
}

function buildSteps(status: ApplicationStatus, hasStall: boolean): Step[] {
  return [
    { label: 'Application submitted', state: 'done' },
    {
      label: 'Under organiser review',
      state: status === 'Pending review' ? 'current' : 'done',
    },
    {
      label: status === 'Rejected' ? 'Not approved' : 'Approved',
      state:
        status === 'Pending review'
          ? 'todo'
          : status === 'Rejected'
            ? 'rejected'
            : 'done',
    },
    {
      label: 'Stall allocated',
      state: hasStall ? 'done' : status === 'Approved' ? 'current' : 'todo',
    },
  ]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function stallEmptyText(status: ApplicationStatus): string {
  if (status === 'Pending review') {
    return 'Stalls are allocated after the organiser approves your application.'
  }
  if (status === 'Approved') {
    return 'Your application is approved. The organiser has not assigned a stall yet.'
  }
  return 'No stall will be allocated because the application was not approved.'
}

function CompanyDashboardContent({ view }: { view: CompanyView }) {
  const [data, setData] = useState<CompanyDashboardData | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    Promise.all([getCompanyDashboard(view), getEvents()])
      .then(([dashboard, eventList]) => {
        if (cancelled) return
        setData(dashboard)
        setEvents(eventList)
        setLoadStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [view, attempt])

  const retry = () => {
    setLoadStatus('loading')
    setAttempt((value) => value + 1)
  }

  if (loadStatus === 'loading') {
    return (
      <div className="card state-box" role="status">
        <h2>Loading your dashboard…</h2>
        <p>Please wait a moment.</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="card state-box" role="alert">
        <h2>We couldn't load the dashboard</h2>
        <p>Something went wrong while fetching your data.</p>
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card state-box">
        <h2>No registration found</h2>
        <p>
          The demo registration in this browser was cleared. Register again to
          see it here.
        </p>
        <ButtonLink to="/register" variant="primary">
          Register your company
        </ButtonLink>
      </div>
    )
  }

  const event = events.find((item) => item.id === data.eventId)
  const steps = buildSteps(data.status, data.stall !== null)
  const engagement = data.engagement
  const maxVisitors = engagement
    ? Math.max(...engagement.hourly.map((point) => point.visitors), 1)
    : 1

  return (
    <>
      <p className="dash-company">{data.profile.companyName}</p>

      <div className="dash-grid">
        {/* Company profile */}
        <section className="card dash-card" aria-labelledby="profile-title">
          <h2 id="profile-title">
            <Building2 aria-hidden="true" size={20} /> Company profile
          </h2>
          <dl className="kv">
            <dt>Company</dt>
            <dd>{data.profile.companyName}</dd>
            <dt>Contact</dt>
            <dd>{data.profile.contactName}</dd>
            <dt>Email</dt>
            <dd>{data.profile.email}</dd>
            <dt>Phone</dt>
            <dd>{data.profile.phone}</dd>
            <dt>Industry</dt>
            <dd>{data.profile.industry}</dd>
            <dt>Website</dt>
            <dd>{data.profile.website || 'Not provided'}</dd>
          </dl>
        </section>

        {/* Application status */}
        <section className="card dash-card" aria-labelledby="status-title">
          <h2 id="status-title">
            <ClipboardCheck aria-hidden="true" size={20} /> Application status
          </h2>
          <p style={{ margin: '1rem 0 0' }}>
            <span className={`status-badge ${badgeClass[data.status]}`}>
              {data.status}
            </span>
          </p>
          <ol className="timeline" aria-label="Application progress">
            {steps.map((step) => (
              <li key={step.label} className={step.state}>
                <span className="timeline-dot" aria-hidden="true">
                  {step.state === 'done' ? '✓' : ''}
                </span>
                <span>
                  {step.label}
                  <span className="sr-only"> ({stepStateText[step.state]})</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Event details */}
        <section className="card dash-card" aria-labelledby="event-title">
          <h2 id="event-title">
            <CalendarDays aria-hidden="true" size={20} /> Event details
          </h2>
          {event ? (
            <>
              <dl className="kv">
                <dt>Event</dt>
                <dd>{event.name}</dd>
                <dt>Dates</dt>
                <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
                <dt>Venue</dt>
                <dd>
                  {event.venue}, {event.city}
                </dd>
              </dl>
              <p style={{ margin: '1rem 0 0' }}>
                <Link to={`/events/${event.id}`}>View event details</Link>
              </p>
            </>
          ) : (
            <div className="empty-inline">
              <strong>No event selected</strong>
              <p>
                You did not choose an event of interest.{' '}
                <Link to="/events">Browse events</Link> to find one.
              </p>
            </div>
          )}
        </section>

        {/* Stall allocation */}
        <section className="card dash-card" aria-labelledby="stall-title">
          <h2 id="stall-title">
            <LayoutGrid aria-hidden="true" size={20} /> Stall allocation
          </h2>
          {data.stall ? (
            <>
              <p className="big-value">{data.stall.stallNumber}</p>
              <dl className="kv" style={{ marginTop: '0.5rem' }}>
                <dt>Location</dt>
                <dd>{data.stall.hall}</dd>
                <dt>Area</dt>
                <dd>{data.stall.areaSqm} m²</dd>
              </dl>
            </>
          ) : (
            <div className="empty-inline">
              <strong>No stall allocated yet</strong>
              <p>{stallEmptyText(data.status)}</p>
            </div>
          )}
        </section>
      </div>

      {/* Visitor engagement */}
      <h2 style={{ fontSize: '1.4rem', margin: '1.5rem 0 1rem' }}>
        Visitor engagement
      </h2>

      {engagement ? (
        <>
          <div className="stat-grid">
            <div className="card stat">
              <span className="icon-box" aria-hidden="true">
                <Users size={20} />
              </span>
              <div>
                <strong>{engagement.visitors.toLocaleString('en-IN')}</strong>
                <span>Stall visitors (sample)</span>
              </div>
            </div>
            <div className="card stat">
              <span className="icon-box" aria-hidden="true">
                <Timer size={20} />
              </span>
              <div>
                <strong>{engagement.avgDwellMinutes} min</strong>
                <span>Average dwell time (sample)</span>
              </div>
            </div>
            <div className="card stat">
              <span className="icon-box" aria-hidden="true">
                <Target size={20} />
              </span>
              <div>
                <strong>{engagement.leads}</strong>
                <span>Leads (sample)</span>
              </div>
            </div>
            <div className="card stat">
              <span className="icon-box" aria-hidden="true">
                <Clock size={20} />
              </span>
              <div>
                <strong>{engagement.peakHour}</strong>
                <span>Peak hour (sample)</span>
              </div>
            </div>
          </div>

          <section className="card dash-card dash-wide" aria-labelledby="chart-title">
            <h2 id="chart-title">Visitors by hour (sample data)</h2>
            <div
              className="dchart"
              role="img"
              aria-label={`Bar chart of sample visitors per hour. The busiest hour is ${engagement.peakHour}.`}
            >
              {engagement.hourly.map((point) => (
                <div key={point.hour} className="dcol">
                  <span className="dbar-value">{point.visitors}</span>
                  <div
                    className="dbar"
                    style={{ height: `${(point.visitors / maxVisitors) * 80}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="dlabels" aria-hidden="true">
              {engagement.hourly.map((point) => (
                <span key={point.hour}>{point.hour.slice(0, 2)}</span>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="card dash-wide">
          <div className="empty-inline" style={{ marginTop: 0 }}>
            <strong>No engagement data yet</strong>
            <p>
              Visitor numbers, dwell time and leads appear here once you have an
              allocated stall and the exhibition is running.
            </p>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <section className="card dash-card dash-wide" aria-labelledby="activity-title">
        <h2 id="activity-title">Recent activity</h2>
        {data.activity.length > 0 ? (
          <ul className="activity-list">
            {data.activity.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>
                <time dateTime={item.time}>{formatTime(item.time)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-inline">
            <strong>No activity yet</strong>
            <p>Updates about your application will appear here.</p>
          </div>
        )}
      </section>
    </>
  )
}

export default function CompanyDashboard() {
  const session = useSession()
  const [hasRegistration] = useState(() => getDemoRegistrations().length > 0)
  const [choice, setChoice] = useState<CompanyView | null>(null)

  const available: CompanyView[] = []
  if (session?.role === 'exhibitor') available.push('sample')
  if (hasRegistration) available.push('registered')

  const view: CompanyView | null =
    choice && available.includes(choice) ? choice : (available[0] ?? null)

  return (
    <div className="container">
      <header className="dash-head">
        <p className="eyebrow">Company dashboard</p>
        <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
          Your exhibition overview
        </h1>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Demo data:</strong> the numbers on this page are sample
            values for the frontend demo. They are not real registrations or
            visitor analytics.
          </p>
        </div>

        {available.length > 1 && (
          <div className="view-switch" role="group" aria-label="Choose what to preview">
            <span>Preview:</span>
            <button
              type="button"
              className="chip"
              aria-pressed={view === 'sample'}
              onClick={() => setChoice('sample')}
            >
              Sample approved company
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={view === 'registered'}
              onClick={() => setChoice('registered')}
            >
              My demo registration
            </button>
          </div>
        )}
      </header>

      {view ? (
        <CompanyDashboardContent key={view} view={view} />
      ) : (
        <div className="card state-box">
          <h2>No company profile yet</h2>
          <p>
            {session?.role === 'organizer'
              ? 'You are signed in as an organiser. Company dashboards belong to exhibitors, so open the organiser dashboard instead.'
              : 'Register your company, or sign in with the demo exhibitor account to preview a sample dashboard.'}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            {session?.role === 'organizer' ? (
              <ButtonLink to="/organizer" variant="primary">
                Open organiser dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/register" variant="primary">
                  Register your company
                </ButtonLink>
                {!session && (
                  <ButtonLink to="/login" variant="secondary">
                    Sign In
                  </ButtonLink>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
