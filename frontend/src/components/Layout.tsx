import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

const titles: Record<string, string> = {
  '/': 'Home',
  '/events': 'Events',
  '/register': 'Register your company',
  '/visitor-register': 'Visitor registration',
  '/login': 'Sign in',
  '/dashboard': 'Company dashboard',
  '/organizer': 'Organiser dashboard',
}

// Wraps every page with the navbar and footer.
export default function Layout() {
  const { pathname } = useLocation()

  const pageTitle = pathname.startsWith('/events/')
    ? 'Event details'
    : (titles[pathname] ?? 'Page not found')

  // Scroll to the top and set the browser-tab title on every page change.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = pathname === '/' ? 'NEXHIBIT' : `${pageTitle} | NEXHIBIT`
  }, [pathname, pageTitle])

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="sr-only" role="status" aria-live="polite">
        {pageTitle}
      </div>
      <Navbar />
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}