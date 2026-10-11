import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, QrCode, UserRound, X } from 'lucide-react'
import Button, { ButtonLink } from './Button'
import { useSession } from '../hooks/useSession'
import { logout } from '../services/authService'
import type { NavItem } from '../types'
import './Navbar.css'

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Company', to: '/dashboard' },
  { label: 'Organiser', to: '/organizer' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const session = useSession()
  const closeMenu = () => setOpen(false)

  const handleSignOut = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  const dashboardPath =
    session?.role === 'organizer' ? '/organizer' : '/dashboard'

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
          aria-label="NEXHIBIT home"
        >
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-name">NEXHIBIT</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X aria-hidden="true" size={22} />
          ) : (
            <Menu aria-hidden="true" size={22} />
          )}
        </button>

        <nav
          id="primary-navigation"
          className={`nav-menu${open ? ' open' : ''}`}
          aria-label="Primary"
        >
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <ButtonLink
              to="/visitor-register"
              variant="primary"
              onClick={closeMenu}
            >
              <QrCode aria-hidden="true" size={18} /> Visitor Registration
            </ButtonLink>

            {session ? (
              <>
                <span className="nav-user">
                  <UserRound aria-hidden="true" size={18} />
                  {session.name}
                  {session.isDemo && <span className="nav-tag">Demo</span>}
                </span>
                <ButtonLink
                  to={dashboardPath}
                  variant="secondary"
                  onClick={closeMenu}
                >
                  My dashboard
                </ButtonLink>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <ButtonLink
                  to="/register"
                  variant="secondary"
                  onClick={closeMenu}
                >
                  Register Company
                </ButtonLink>
                <ButtonLink to="/login" variant="ghost" onClick={closeMenu}>
                  Sign In
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}