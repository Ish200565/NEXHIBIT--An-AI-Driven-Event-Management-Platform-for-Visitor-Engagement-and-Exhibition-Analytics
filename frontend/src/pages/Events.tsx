import { useEffect, useMemo, useState } from 'react'
import { Info, Search, X } from 'lucide-react'
import Button from '../components/Button'
import EventCard from '../components/EventCard'
import { eventCategories } from '../data/events'
import { getEvents } from '../services/eventService'
import type { EventCategory, EventItem } from '../types'
import './Events.css'

type Status = 'loading' | 'error' | 'ready'
type CategoryFilter = 'All' | EventCategory

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')

  // Load the events through the service layer.
  useEffect(() => {
    let cancelled = false

    getEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return events.filter((event) => {
      const matchesCategory = category === 'All' || event.category === category
      const haystack = [
        event.name,
        event.venue,
        event.city,
        event.category,
        event.summary,
        event.description,
      ]
        .join(' ')
        .toLowerCase()
      return matchesCategory && (text === '' || haystack.includes(text))
    })
  }, [events, query, category])

  const filtersActive = query.trim() !== '' || category !== 'All'

  const clearFilters = () => {
    setQuery('')
    setCategory('All')
  }

  const retry = () => {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Events</p>
        <h1>Upcoming exhibitions</h1>
        <p>
          Search by name, city or venue, or filter by category to find an
          exhibition.
        </p>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Sample data:</strong> these events are fictional and are
            used only during frontend development.
          </p>
        </div>
      </header>

      <section aria-label="Search and filter events" className="filters">
        <div className="search-field">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <Search className="search-icon" aria-hidden="true" size={18} />
          <input
            id="event-search"
            type="search"
            placeholder="Search events, venues or cities"
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

        <div className="chips" role="group" aria-label="Filter by category">
          {(['All', ...eventCategories] as CategoryFilter[]).map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {status === 'loading' && (
        <div className="card state-box" role="status">
          <h2>Loading events…</h2>
          <p>Please wait a moment.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card state-box" role="alert">
          <h2>We couldn't load the events</h2>
          <p>Something went wrong while fetching the event list.</p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="results-bar">
            <p role="status" aria-live="polite">
              Showing {filtered.length} of {events.length} sample events
            </p>
            {filtersActive && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="events-grid">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card state-box">
              <h2>No events match your search</h2>
              <p>
                Try a different keyword or choose another category, or clear
                the filters to see every event.
              </p>
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
