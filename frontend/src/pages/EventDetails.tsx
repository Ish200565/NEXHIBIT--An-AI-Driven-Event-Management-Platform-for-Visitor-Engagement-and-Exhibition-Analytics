import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  Info,
  LayoutGrid,
  Leaf,
  MapPin,
  Palette,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ButtonLink } from '../components/Button'
import { formatDateRange } from '../data/events'
import { getEvent } from '../services/eventService'
import type { EventCategory, EventItem } from '../types'
import '../components/EventCard.css'
import './Events.css'
import './EventDetails.css'

const categoryIcons: Record<EventCategory, LucideIcon> = {
  Technology: Cpu,
  Manufacturing: Factory,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Sustainability: Leaf,
  Design: Palette,
}

type Status = 'loading' | 'error' | 'notfound' | 'ready'

function EventDetailsContent({ id }: { id: string }) {
  const [event, setEvent] = useState<EventItem | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false

    getEvent(id)
      .then((data) => {
        if (cancelled) return
        if (data) {
          setEvent(data)
          setStatus('ready')
        } else {
          setStatus('notfound')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const backLink = (
    <Link to="/events" className="back-link">
      <ArrowLeft aria-hidden="true" size={18} /> Back to all events
    </Link>
  )

  if (status === 'loading') {
    return (
      <div className="container detail-page">
        {backLink}
        <div className="card state-box" role="status">
          <h2>Loading event…</h2>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container detail-page">
        {backLink}
        <div className="card state-box" role="alert">
          <h2>We couldn't load this event</h2>
          <p>Something went wrong. Please go back and try again.</p>
        </div>
      </div>
    )
  }

  if (status === 'notfound' || !event) {
    return (
      <div className="container detail-page">
        {backLink}
        <div className="card state-box">
          <h1 style={{ fontSize: '1.8rem' }}>Event not found</h1>
          <p>
            We couldn't find an event with that address. It may have been
            removed, or the link may be wrong.
          </p>
          <ButtonLink to="/events" variant="secondary">
            Browse all events
          </ButtonLink>
        </div>
      </div>
    )
  }

  const Icon = categoryIcons[event.category]

  return (
    <div className="container detail-page">
      {backLink}

      <header className="detail-hero">
        <div
          className={`event-visual cat-${event.category.toLowerCase()}`}
          aria-hidden="true"
        >
          <Icon size={48} strokeWidth={1.4} />
        </div>
        <div>
          <p className="event-category">{event.category}</p>
          <h1>{event.name}</h1>
          <p style={{ margin: 0 }}>
            {event.venue}, {event.city}
          </p>
        </div>
      </header>

      <div className="notice" style={{ marginBottom: '1.5rem' }}>
        <Info aria-hidden="true" size={18} />
        <p>
          <strong>Sample event:</strong> this exhibition is fictional and
          exists only for the frontend demo.
        </p>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card" aria-labelledby="facts-title">
            <h2 id="facts-title" style={{ fontSize: '1.4rem' }}>
              Event at a glance
            </h2>
            <div className="fact-grid">
              <div className="fact">
                <span className="icon-box" aria-hidden="true">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <span>Dates</span>
                  <strong>{formatDateRange(event.startDate, event.endDate)}</strong>
                </div>
              </div>
              <div className="fact">
                <span className="icon-box" aria-hidden="true">
                  <MapPin size={20} />
                </span>
                <div>
                  <span>Venue</span>
                  <strong>
                    {event.venue}, {event.city}
                  </strong>
                </div>
              </div>
              <div className="fact">
                <span className="icon-box" aria-hidden="true">
                  <Users size={20} />
                </span>
                <div>
                  <span>Expected visitors (sample)</span>
                  <strong>{event.expectedVisitors.toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div className="fact">
                <span className="icon-box" aria-hidden="true">
                  <LayoutGrid size={20} />
                </span>
                <div>
                  <span>Stalls (sample)</span>
                  <strong>{event.stallCount}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="about-event-title">
            <h2 id="about-event-title" style={{ fontSize: '1.4rem' }}>
              About this event
            </h2>
            <p style={{ marginBottom: 0 }}>{event.description}</p>
          </section>

          <section className="card" aria-labelledby="highlights-title">
            <h2 id="highlights-title" style={{ fontSize: '1.4rem' }}>
              Highlights
            </h2>
            <ul className="highlight-list">
              {event.highlights.map((item) => (
                <li key={item}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="card side-card" aria-labelledby="participate-title">
          <h2 id="participate-title" style={{ fontSize: '1.4rem' }}>
            Want to exhibit?
          </h2>
          <p>
            Register your company and tell the organisers you are interested in
            this event.
          </p>
          <ButtonLink to={`/register?event=${event.id}`} variant="primary">
            Register Your Company
          </ButtonLink>
          <ButtonLink to="/login" variant="ghost">
            Sign In
          </ButtonLink>
        </aside>
      </div>
    </div>
  )
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()

  // key={id} restarts the component's state whenever the event changes.
  return <EventDetailsContent key={id} id={id ?? ''} />
}
