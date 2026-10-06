import { useState, useEffect } from 'react'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Records', href: '#records' },
] as const

type NavLabel = typeof NAV_LINKS[number]['label']

interface NavbarProps {
  activePage: NavLabel
  onNavigate: (page: NavLabel) => void
  onLogout: () => void
}

export default function Navbar({ activePage, onNavigate, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <div className="navbar__brand">
          <span className="navbar__logo" aria-hidden="true">⚡</span>
          <span className="navbar__title">Mini Management System</span>
        </div>

        {/* Hamburger toggle for mobile */}
        <button
          className={`navbar__hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="navbar-links"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul
          id="navbar-links"
          className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}
          role="list"
        >
          {NAV_LINKS.map(({ label }) => (
            <li key={label} className="navbar__item">
              <button
                className={`navbar__link${activePage === label ? ' navbar__link--active' : ''}`}
                aria-current={activePage === label ? 'page' : undefined}
                onClick={() => {
                  onNavigate(label)
                  setMenuOpen(false)
                }}
              >
                {label}
              </button>
            </li>
          ))}

          {/* Logout button */}
          <li className="navbar__item navbar__item--logout">
            <button
              className="navbar__logout"
              onClick={() => {
                setMenuOpen(false)
                onLogout()
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Dimmed backdrop when mobile drawer is open */}
      {menuOpen && (
        <div
          className="navbar__backdrop"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
