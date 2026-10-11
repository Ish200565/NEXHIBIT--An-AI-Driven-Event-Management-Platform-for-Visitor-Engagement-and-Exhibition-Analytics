import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand" aria-label="NEXHIBIT home">
              <span className="brand-mark" aria-hidden="true">
                N
              </span>
              <span className="brand-name">NEXHIBIT</span>
            </Link>
            <p style={{ marginTop: '1rem', maxWidth: '36ch' }}>
              An AI-driven Event Management Platform for Visitor Engagement and
              Exhibition Analytics.
            </p>
          </div>

          <nav aria-label="Explore">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/register">Register Your Company</Link></li>
              <li><Link to="/visitor-register">Visitor Registration</Link></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </nav>

          <nav aria-label="Dashboards">
            <h3>Dashboards</h3>
            <ul className="footer-links">
              <li><Link to="/dashboard">Company Dashboard</Link></li>
              <li><Link to="/organizer">Organiser Dashboard</Link></li>
            </ul>
          </nav>
        </div>

        <div className="footer-note">
          <p>
            Demo notice: all events, registrations and analytics shown are
            sample data for a final-year project. They are not real.
          </p>
          <p>© {year} NEXHIBIT. Final-year Computer Engineering project.</p>
        </div>
      </div>
    </footer>
  )
}