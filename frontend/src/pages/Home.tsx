import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutGrid,
  QrCode,
  Timer,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ButtonLink } from '../components/Button'
import EventCard from '../components/EventCard'
import { sampleEvents } from '../data/events'
import './Home.css'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
}

const features: Feature[] = [
  {
    icon: CalendarDays,
    title: 'Event management',
    text: 'Organisers create events, set dates and venues, and keep every detail in one place.',
  },
  {
    icon: Building2,
    title: 'Company registration',
    text: 'Participating companies register once and tell organisers which events they are interested in.',
  },
  {
    icon: ClipboardCheck,
    title: 'Exhibitor applications',
    text: 'Applications move through a clear review and approval process that both sides can follow.',
  },
  {
    icon: LayoutGrid,
    title: 'Stall information',
    text: 'See which stalls are allocated, pending or still available for each exhibition.',
  },
  {
    icon: Users,
    title: 'Visitor engagement',
    text: 'Understand how visitors move through the exhibition and which stalls attract attention.',
  },
  {
    icon: Activity,
    title: 'Exhibition analytics',
    text: 'Dashboards summarise footfall, dwell time and leads so organisers and exhibitors can act on them.',
  },
]

interface Step {
  title: string
  text: string
}

const steps: Step[] = [
  {
    title: 'Organiser creates the event',
    text: 'Dates, venue, categories and the stall layout are set up for the exhibition.',
  },
  {
    title: 'Companies register and apply',
    text: 'Companies create a profile and apply for a stall. Organisers review each application.',
  },
  {
    title: 'Visitors register and check in',
    text: 'Visitors register online and receive a QR code that is scanned at the entrance.',
  },
  {
    title: 'Everyone reviews the analytics',
    text: 'Organisers see footfall and heatmaps, and exhibitors see engagement and leads.',
  },
]

// Heat levels (0 = quiet, 4 = busiest) for the illustrative floor plan.
const heatCells: number[] = [
  1, 2, 0, 3, 4, 2, 1,
  0, 1, 3, 4, 4, 2, 0,
  2, 3, 4, 3, 1, 0, 1,
  1, 0, 2, 2, 3, 2, 1,
]

// Illustrative hourly footfall, shown only as a decorative chart.
const hourly = [
  { hour: '9', value: 18 },
  { hour: '10', value: 32 },
  { hour: '11', value: 55 },
  { hour: '12', value: 80 },
  { hour: '13', value: 95 },
  { hour: '14', value: 70 },
  { hour: '15', value: 60 },
  { hour: '16', value: 78 },
  { hour: '17', value: 52 },
  { hour: '18', value: 30 },
]

export default function Home() {
  const reduceMotion = useReducedMotion()
  const showcase = sampleEvents.slice(0, 3)

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow">Final-year Computer Engineering project</p>
            <h1 id="hero-title">
              An <span>AI-driven</span> Event Management Platform for Visitor
              Engagement and Exhibition Analytics
            </h1>
            <p className="hero-lead">
              NEXHIBIT helps organisers and participating companies manage
              events, registrations, stalls and visitor engagement, and turn
              exhibition activity into clear insight.
            </p>

            <div className="hero-actions">
              <ButtonLink to="/events" variant="primary">
                Explore Events <ArrowRight aria-hidden="true" size={18} />
              </ButtonLink>
                
                 <ButtonLink to="/register" variant="secondary">
                Register Your Company
              </ButtonLink>
              <ButtonLink to="/visitor-register" variant="secondary">
                Visitor Registration
              </ButtonLink>
              <ButtonLink to="/login" variant="ghost">
                Sign In
              </ButtonLink>
            </div>

            <p className="hero-note">
              This is a frontend demo. All events and figures are sample data.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="card plan-card">
              <div className="plan-title">
                <strong>Exhibition hall heatmap</strong>
                <span>Illustration</span>
              </div>
              <div
                className="plan-grid"
                role="img"
                aria-label="Illustrative exhibition floor plan where brighter stalls represent busier areas"
              >
                {heatCells.map((level, index) => (
                  <div key={index} className={`heat heat-${level}`} />
                ))}
              </div>
              <div className="plan-legend" aria-hidden="true">
                <span>Quiet</span>
                <div className="heat heat-1" />
                <div className="heat heat-2" />
                <div className="heat heat-3" />
                <div className="heat heat-4" />
                <span>Busy</span>
              </div>
              <p className="plan-caption">
                Illustrative layout only. It is not real visitor data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="section section-alt" aria-labelledby="about-title">
        <div className="container about-grid">
          <div>
            <p className="eyebrow">About NEXHIBIT</p>
            <h2 id="about-title">One platform for the whole exhibition</h2>
            <p>
              Running an exhibition usually means spreadsheets, emails and
              guesswork. NEXHIBIT brings organisers, exhibitors and visitor
              insight together so everyone works from the same picture.
            </p>
            <p>
              The platform is being built as a final-year project. This
              frontend runs on sample data, and a backend will be connected
              later.
            </p>
          </div>

          <ul className="about-points">
            <li>
              <span className="icon-box" aria-hidden="true">
                <Building2 size={22} />
              </span>
              <div>
                <strong>For organisers</strong>
                <span>Manage events, approve applications and see exhibition-wide analytics.</span>
              </div>
            </li>
            <li>
              <span className="icon-box" aria-hidden="true">
                <LayoutGrid size={22} />
              </span>
              <div>
                <strong>For exhibitors</strong>
                <span>Track application status, stall allocation and visitor engagement at your stall.</span>
              </div>
            </li>
            <li>
              <span className="icon-box" aria-hidden="true">
                <Users size={22} />
              </span>
              <div>
                <strong>For visitors</strong>
                <span>Register in advance and enter with a QR code for a smoother arrival.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Key features</p>
            <h2 id="features-title">Everything an exhibition needs</h2>
            <p>From the first registration to the final analytics report.</p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card">
                <span className="icon-box" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Event showcase ===== */}
      <section className="section section-alt" aria-labelledby="showcase-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Event showcase</p>
            <h2 id="showcase-title">Sample upcoming exhibitions</h2>
            <p>
              These events are fictional examples that show how listings will
              look.
            </p>
          </div>

          <div className="event-grid">
            {showcase.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="showcase-footer">
            <ButtonLink to="/events" variant="secondary">
              View all events <ArrowRight aria-hidden="true" size={18} />
            </ButtonLink>
            <p>Sample data for the frontend demo. Not real events.</p>
          </div>
        </div>
      </section>

      {/* ===== Visitor engagement & analytics ===== */}
      <section className="section" aria-labelledby="analytics-title">
        <div className="container analytics-grid">
          <div>
            <p className="eyebrow">Visitor engagement and analytics</p>
            <h2 id="analytics-title">Turn footfall into insight</h2>
            <p>
              NEXHIBIT is designed to show organisers and exhibitors how
              visitors actually experience an exhibition, using data collected
              at check-in and around the halls.
            </p>

            <ul className="metric-list">
              <li>
                <span className="icon-box" aria-hidden="true">
                  <Users size={22} />
                </span>
                <div>
                  <strong>Footfall</strong>
                  <span>How many visitors arrive, and when the halls are busiest.</span>
                </div>
              </li>
              <li>
                <span className="icon-box" aria-hidden="true">
                  <Timer size={22} />
                </span>
                <div>
                  <strong>Dwell time per stall</strong>
                  <span>Which stalls hold attention and which are passed by.</span>
                </div>
              </li>
              <li>
                <span className="icon-box" aria-hidden="true">
                  <QrCode size={22} />
                </span>
                <div>
                  <strong>Leads and engagement</strong>
                  <span>Exhibitors see interest at their own stall and follow up.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="plan-title">
              <strong>Hourly footfall</strong>
              <span>Illustration</span>
            </div>
            <div
              className="bars"
              role="img"
              aria-label="Illustrative bar chart of visitors per hour, peaking around one in the afternoon"
            >
              {hourly.map((item) => (
                <div
                  key={item.hour}
                  className="bar"
                  style={{ height: `${item.value}%` }}
                />
              ))}
            </div>
            <div className="bar-labels" aria-hidden="true">
              {hourly.map((item) => (
                <span key={item.hour}>{item.hour}</span>
              ))}
            </div>
            <p className="plan-caption">
              Illustrative chart with made-up numbers. Real charts arrive in
              the dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="section section-alt" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title">From registration to results</h2>
          </div>

          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="card">
                <span className="step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Closing call to action ===== */}
      <section className="section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-band">
            <Bell
              aria-hidden="true"
              size={28}
              style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}
            />
            <h2 id="cta-title">Ready to explore NEXHIBIT?</h2>
            <p>
              Browse the sample events, try the company registration form, or
              open a demo dashboard.
            </p>
            <div className="hero-actions">
              <ButtonLink to="/events" variant="primary">
                Explore Events
              </ButtonLink>
              <ButtonLink to="/register" variant="secondary">
                Register Your Company
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
