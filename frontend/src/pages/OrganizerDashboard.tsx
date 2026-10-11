import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Info,
  LayoutGrid,
  Search,
  Users,
  X,
} from 'lucide-react'
import Button, { ButtonLink } from '../components/Button'
import { useSession } from '../hooks/useSession'
import { getEvents } from '../services/eventService'
import { getOrganizerDashboard } from '../services/organizerService'
import type { ActivityItem, ApplicationStatus, EventItem } from '../types'
import type { ApplicationRow, OrganizerDashboardData } from '../types/organizer'
import '../components/FormField.css'
import './Events.css'
import './Dashboard.css'
import './OrganizerDashboard.css'

type LoadStatus = 'loading' | 'error' | 'ready'
type StatusFilter = 'All' | ApplicationStatus

const statusFilters: StatusFilter[] = [
  'All',
  'Pending review',
  'Approved',
  'Rejected',
]

const badgeClass: Record<ApplicationStatus, string> = {
  'Pending review': 'status-pending',
  Approved: 'status-approved',
  Rejected: 'status-rejected',
}

// Chart colours
const GOLD = '#c9a96a'
const GREEN = '#7fcfa6'
const RED = '#f08a8a'
const GRID = 'rgba(184, 190, 200, 0.15)'
const TICK = { fill: '#b8bec8', fontSize: 12 }
const tooltipStyle = {
  background: '#111a2d',
  border: '1px solid rgba(201, 169, 106, 0.4)',
  borderRadius: 8,
  color: '#f4f1ea',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

function OrganizerContent() {
  const [data, setData] = useState<OrganizerDashboardData | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  // Approve / reject choices made on this page (demo only, not saved).
  const [decisions, setDecisions] = useState<Record<string, ApplicationStatus>>({})
  const [log, setLog] = useState<ActivityItem[]>([])
  const [announce, setAnnounce] = useState('')

  // Filters
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')

  useEffect(() => {
    let cancelled = false

    Promise.all([getOrganizerDashboard(), getEvents()])
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
  }, [attempt])

  // Applications with the approve/reject choices applied.
  const rows: ApplicationRow[] = useMemo(
    () =>
      (data?.applications ?? []).map((row) => ({
        ...row,
        status: decisions[row.id] ?? row.status,
      })),
    [data, decisions],
  )

  const stallRows = useMemo(() => {
    if (!data) return []
    const original = new Map(data.applications.map((row) => [row.id, row.status]))

    return events.map((event) => {
      // Each newly approved company takes one stall in this demo.
      const added = rows.filter(
        (row) =>
          row.eventId === event.id &&
          row.status === 'Approved' &&
          original.get(row.id) !== 'Approved',
      ).length
      const allocated = Math.min(
        event.stallCount,
        (data.allocatedBase[event.id] ?? 0) + added,
      )
      return { id: event.id, name: event.name, total: event.stallCount, allocated }
    })
  }, [data, events, rows])

  const eventName = (id: string) =>
    events.find((event) => event.id === id)?.name ?? 'No event chosen'

  const retry = () => {
    setLoadStatus('loading')
    setAttempt((value) => value + 1)
  }

  const decide = (row: ApplicationRow, status: ApplicationStatus) => {
    const text = `${row.companyName} was ${
      status === 'Approved' ? 'approved' : 'rejected'
    } (demo only, not saved).`
    setDecisions((previous) => ({ ...previous, [row.id]: status }))
    setLog((previous) => [
      { id: `log-${Date.now()}-${row.id}`, text, time: new Date().toISOString() },
      ...previous,
    ])
    setAnnounce(text)
  }

  const undo = (row: ApplicationRow) => {
    setDecisions((previous) => {
      const next = { ...previous }
      delete next[row.id]
      return next
    })
    setAnnounce(`The decision for ${row.companyName} was undone.`)
  }

  if (loadStatus === 'loading') {
    return (
      <div className="card state-box" role="status">
        <h2>Loading organiser dashboard…</h2>
        <p>Please wait a moment.</p>
      </div>
    )
  }

  if (loadStatus === 'error' || !data) {
    return (
      <div className="card state-box" role="alert">
        <h2>We couldn't load the dashboard</h2>
        <p>Something went wrong while fetching the data.</p>
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  // ===== Numbers for the stat cards =====
  const total = rows.length
  const approved = rows.filter((row) => row.status === 'Approved').length
  const pending = rows.filter((row) => row.status === 'Pending review').length
  const allocatedTotal = stallRows.reduce((sum, row) => sum + row.allocated, 0)
  const stallsTotal = stallRows.reduce((sum, row) => sum + row.total, 0)

  // ===== Chart data =====
  const byEvent = events.map((event) => {
    const mine = rows.filter((row) => row.eventId === event.id)
    return {
      name: event.name.split(' ')[0],
      Pending: mine.filter((row) => row.status === 'Pending review').length,
      Approved: mine.filter((row) => row.status === 'Approved').length,
      Rejected: mine.filter((row) => row.status === 'Rejected').length,
    }
  })

  const peak = data.footfall.reduce((best, point) =>
    point.visitors > best.visitors ? point : best,
  )

  // ===== Filtered table =====
  const text = query.trim().toLowerCase()
  const filtered = rows.filter(
    (row) =>
      (eventFilter === 'all' || row.eventId === eventFilter) &&
      (statusFilter === 'All' || row.status === statusFilter) &&
      (text === '' ||
        row.companyName.toLowerCase().includes(text) ||
        row.industry.toLowerCase().includes(text)),
  )
  const filtersActive =
    text !== '' || eventFilter !== 'all' || statusFilter !== 'All'

  const clearFilters = () => {
    setQuery('')
    setEventFilter('all')
    setStatusFilter('All')
  }

  const activity = [...log, ...data.activity].slice(0, 6)

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">
        {announce}
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginTop: '1.25rem' }}>
        <div className="card stat">
          <span className="icon-box" aria-hidden="true">
            <Users size={20} />
          </span>
          <div>
            <strong>{total}</strong>
            <span>Total registrations (sample)</span>
          </div>
        </div>
        <div className="card stat">
          <span className="icon-box" aria-hidden="true">
            <Building2 size={20} />
          </span>
          <div>
            <strong>{approved}</strong>
            <span>Participating companies</span>
          </div>
        </div>
        <div className="card stat">
          <span className="icon-box" aria-hidden="true">
            <ClipboardList size={20} />
          </span>
          <div>
            <strong>{pending}</strong>
            <span>Awaiting approval</span>
          </div>
        </div>
        <div className="card stat">
          <span className="icon-box" aria-hidden="true">
            <LayoutGrid size={20} />
          </span>
          <div>
            <strong>
              {allocatedTotal}/{stallsTotal}
            </strong>
            <span>Stalls allocated (sample)</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <section className="card dash-card" aria-labelledby="chart-events-title">
          <h2 id="chart-events-title">
            <CalendarDays aria-hidden="true" size={20} /> Applications by event
          </h2>
          <div
            className="chart-box"
            role="img"
            aria-label={`Stacked bar chart of applications for each of ${events.length} events, split by pending, approved and rejected. There are ${total} applications in total.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEvent} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis allowDecimals={false} tick={TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend wrapperStyle={{ color: '#b8bec8', fontSize: 12 }} />
                <Bar dataKey="Pending" stackId="a" fill={GOLD} />
                <Bar dataKey="Approved" stackId="a" fill={GREEN} />
                <Bar dataKey="Rejected" stackId="a" fill={RED} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card dash-card" aria-labelledby="chart-foot-title">
          <h2 id="chart-foot-title">
            <Users aria-hidden="true" size={20} /> Visitor footfall by hour (sample)
          </h2>
          <div
            className="chart-box"
            role="img"
            aria-label={`Area chart of sample visitors per hour. The busiest hour is ${peak.hour} with ${peak.visitors} visitors.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.footfall} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="hour" tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke={GOLD}
                  fill={GOLD}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Stalls and heatmap */}
      <div className="charts-grid">
        <section className="card dash-card" aria-labelledby="stalls-title">
          <h2 id="stalls-title">
            <LayoutGrid aria-hidden="true" size={20} /> Stall allocation overview
          </h2>
          <div className="stall-list">
            {stallRows.map((row) => (
              <div key={row.id}>
                <div className="stall-line">
                  <span>{row.name}</span>
                  <span>
                    {row.allocated} / {row.total}
                  </span>
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-label={`Stalls allocated for ${row.name}`}
                  aria-valuemin={0}
                  aria-valuemax={row.total}
                  aria-valuenow={row.allocated}
                >
                  <div style={{ width: `${(row.allocated / row.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="fine-print">
            Sample figures. In this demo, each company you approve takes one
            stall.
          </p>
        </section>

        <section className="card dash-card" aria-labelledby="heat-title">
          <h2 id="heat-title">
            <Users aria-hidden="true" size={20} /> Exhibition hall heatmap (sample)
          </h2>
          <div
            className="hm-grid"
            role="img"
            aria-label="Sample exhibition floor plan. Brighter cells are busier areas. The busiest zones are listed below the map."
          >
            {data.heat.map((level, index) => (
              <div key={index} className={`hm hm-${level}`} />
            ))}
          </div>
          <div className="hm-legend" aria-hidden="true">
            <span>Quiet</span>
            <div className="hm hm-1" />
            <div className="hm hm-2" />
            <div className="hm hm-3" />
            <div className="hm hm-4" />
            <span>Busy</span>
          </div>
          <ul className="zone-list" aria-label="Busiest zones">
            {data.topZones.map((zone) => (
              <li key={zone.name}>
                <span>{zone.name}</span>
                <span>{zone.visitors.toLocaleString('en-IN')} visitors</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Applications */}
      <section className="card dash-card dash-wide" aria-labelledby="apps-title">
        <h2 id="apps-title">
          <ClipboardList aria-hidden="true" size={20} /> Exhibitor applications
        </h2>

        <div className="org-filters">
          <div className="filter-row">
            <div className="search-field">
              <label htmlFor="app-search" className="sr-only">
                Search companies
              </label>
              <Search className="search-icon" aria-hidden="true" size={18} />
              <input
                id="app-search"
                type="search"
                placeholder="Search company or industry"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query !== '' && (
                <button
                  type="button"
                  className="search-clear"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X aria-hidden="true" size={18} />
                </button>
              )}
            </div>

            <div className="field">
              <label htmlFor="app-event">Event</label>
              <select
                id="app-event"
                className="input"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="all">All events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chips" role="group" aria-label="Filter by status">
            {statusFilters.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={statusFilter === name}
                onClick={() => setStatusFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <p className="table-count" role="status" aria-live="polite">
          Showing {filtered.length} of {rows.length} applications
          {filtersActive && (
            <>
              {' '}
              <button type="button" className="link-button" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          )}
        </p>

        {filtered.length > 0 ? (
          <div className="table-wrap" role="region" aria-label="Applications table" tabIndex={0}>
            <table className="apps-table">
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Event</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.companyName}
                      {row.isLocal && <span className="tag">Your registration</span>}
                      <span className="cell-sub">{row.industry}</span>
                    </td>
                    <td>{eventName(row.eventId)}</td>
                    <td>{formatDay(row.submittedAt)}</td>
                    <td>
                      <span className={`status-badge ${badgeClass[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      {row.status === 'Pending review' ? (
                        <div className="row-actions">
                          <Button
                            variant="primary"
                            className="btn-sm"
                            aria-label={`Approve ${row.companyName}`}
                            onClick={() => decide(row, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            className="btn-sm"
                            aria-label={`Reject ${row.companyName}`}
                            onClick={() => decide(row, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : decisions[row.id] ? (
                        <Button
                          variant="ghost"
                          className="btn-sm"
                          aria-label={`Undo the decision for ${row.companyName}`}
                          onClick={() => undo(row)}
                        >
                          Undo
                        </Button>
                      ) : (
                        <span style={{ color: 'var(--silver-dim)' }}>No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-inline">
            <strong>No applications match your filters</strong>
            <p>Try a different search or clear the filters.</p>
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="card dash-card dash-wide" aria-labelledby="org-activity-title">
        <h2 id="org-activity-title">Recent activity</h2>
        {activity.length > 0 ? (
          <ul className="activity-list">
            {activity.map((item) => (
              <li key={item.id}>
                <span>{item.text}</span>
                <time dateTime={item.time}>{formatTime(item.time)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-inline">
            <strong>No activity yet</strong>
          </div>
        )}
      </section>
    </>
  )
}

export default function OrganizerDashboard() {
  const session = useSession()
  const isOrganizer = session?.role === 'organizer'

  return (
    <div className="container">
      <header className="dash-head">
        <p className="eyebrow">Organiser dashboard</p>
        <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
          Exhibition overview
        </h1>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Demo data:</strong> companies, numbers, charts and the
            heatmap are sample values. Approve and Reject only change this
            page while it is open. Nothing is saved.
          </p>
        </div>
      </header>

      {isOrganizer ? (
        <OrganizerContent />
      ) : (
        <div className="card state-box">
          <h2>Organiser sign-in required</h2>
          <p>
            {session
              ? 'You are signed in as an exhibitor. This dashboard is for organisers, so sign in with the demo organiser account to preview it.'
              : 'Sign in with the demo organiser account to preview this dashboard.'}
          </p>
          <ButtonLink to="/login" variant="primary">
            Go to sign in
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
