import { useState } from 'react'
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
}

export default function Navbar({ activePage, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
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
      </ul>
    </nav>
  )
}
