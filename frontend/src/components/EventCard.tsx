import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  Leaf,
  MapPin,
  Palette,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { EventCategory, EventItem } from '../types'
import { formatDateRange } from '../data/events'
import './EventCard.css'

const categoryIcons: Record<EventCategory, LucideIcon> = {
  Technology: Cpu,
  Manufacturing: Factory,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Sustainability: Leaf,
  Design: Palette,
}

interface EventCardProps {
  event: EventItem
}

export default function EventCard({ event }: EventCardProps) {
  const Icon = categoryIcons[event.category]

  return (
    <article className="card event-card">
      <div
        className={`event-visual cat-${event.category.toLowerCase()}`}
        aria-hidden="true"
      >
        <Icon size={44} strokeWidth={1.4} />
        <span className="badge">Sample event</span>
      </div>

      <div className="event-body">
        <p className="event-category">{event.category}</p>
        <h3>{event.name}</h3>

        <ul className="event-meta">
          <li>
            <CalendarDays aria-hidden="true" size={16} />
            {formatDateRange(event.startDate, event.endDate)}
          </li>
          <li>
            <MapPin aria-hidden="true" size={16} />
            {event.venue}, {event.city}
          </li>
        </ul>

        <p>{event.summary}</p>

        <Link
          to={`/events/${event.id}`}
          className="event-link"
          aria-label={`View details for ${event.name}`}
        >
          View details <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  )
}
