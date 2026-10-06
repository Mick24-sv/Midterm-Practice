// INT-01 — Login flow wired to backend authentication API.
// INT-02 — Registration form wired to backend registration API.
// INT-03 — Connect "Add Record" form to Create Record API.

import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ViewRecordsTable, { type ViewRecord } from './pages/ViewRecordsTable'
import AddRecordForm from './AddRecordForm'
import { fetchRecords } from './api'
import { readStoredSession, clearStoredSession } from './session'
import type { AuthSession } from './api'
import type { ApiRecord } from './api'
import './App.css'

type Page     = 'Home' | 'Dashboard' | 'Records'
type AuthView = 'login' | 'register'

interface AppRecord extends ViewRecord {
  apiRecord: ApiRecord
}

function toViewRecord(record: ApiRecord): AppRecord {
  return {
    id: `REC-${record.id.toString().padStart(4, '0')}`,
    title: record.title,
    category: 'General',
    updated: new Date(record.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: record.status === 'active' ? 'Pending' : 'Completed',
    apiRecord: record,
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authView, setAuthView]     = useState<AuthView>('login')
  const [activePage, setActivePage] = useState<Page>('Home')
  const [recordSearch, setRecordSearch] = useState('')
  const [records, setRecords] = useState<AppRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    const stored = readStoredSession()
    if (stored) {
      setSession(stored)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadRecords()
    }
  }, [session])

  async function loadRecords() {
    if (!session) return
    setLoadingRecords(true)
    try {
      const apiRecords = await fetchRecords(session.token)
      setRecords(apiRecords.map(toViewRecord))
    } catch (error) {
      console.error('Failed to load records:', error)
    } finally {
      setLoadingRecords(false)
    }
  }

  function handleLogin() {
    const stored = readStoredSession()
    if (stored) {
      setSession(stored)
      setIsLoggedIn(true)
    }
  }

  function handleRegister() {
    const stored = readStoredSession()
    if (stored) {
      setSession(stored)
      setIsLoggedIn(true)
      setAuthView('login')
    }
  }

  function handleLogout() {
    clearStoredSession()
    setSession(null)
    setIsLoggedIn(false)
    setAuthView('login')
    setRecords([])
  }

  async function handleRecordCreated(apiRecord: ApiRecord) {
    setRecords((prev) => [toViewRecord(apiRecord), ...prev])
    setShowAddForm(false)
  }

  // ── Auth screens ───────────────────────────────────────────
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onGoToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoToRegister={() => setAuthView('register')}
      />
    )
  }

  // ── Main App Layout ────────────────────────────────────────
  return (
    <>
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />

      <main>
        {/* ── HOME TAB ────────────────────────────────────────── */}
        {activePage === 'Home' && (
          <section id="home" className="page-section">
            <div className="hero-banner">
              <h1>Mini Management System</h1>
              <p>
                A clean, responsive prototype platform designed for agile teams to manage system
                operations, view live analytics, and organize team records seamlessly across any device.
              </p>
              <div>
                <button
                  type="button"
                  className="records-btn"
                  onClick={() => setActivePage('Dashboard')}
                >
                  Go to Dashboard →
                </button>
              </div>
            </div>

            <div className="section-header">
              <h2>Key System Highlights</h2>
              <p className="section-subtitle">
                Built with responsiveness and accessibility in mind.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">📊</span>
                <h3 className="feature-card__title">Real-Time Metrics</h3>
                <p className="feature-card__desc">
                  Monitor active users, data operations, and task status cards with responsive grid layouts.
                </p>
              </div>

              <div className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">📱</span>
                <h3 className="feature-card__title">Mobile-First UI</h3>
                <p className="feature-card__desc">
                  Seamlessly adapts from small mobile screens (320px) up to ultra-wide desktop monitors.
                </p>
              </div>

              <div className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">🔒</span>
                <h3 className="feature-card__title">Secure Access</h3>
                <p className="feature-card__desc">
                  Includes full login and registration workflows with password strength validation and session controls.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── DASHBOARD TAB ───────────────────────────────────── */}
        {activePage === 'Dashboard' && <DashboardPage />}

        {/* ── RECORDS TAB ─────────────────────────────────────── */}
        {activePage === 'Records' && (
          <section id="records" className="page-section">
            <div className="section-header">
              <h1>Records Management</h1>
              <p className="section-subtitle">
                View, search, and manage system documentation and data entries.
              </p>
            </div>

            <div className="records-toolbar">
              <input
                type="search"
                className="records-search"
                placeholder="Search by ID, title, or category..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
              />
              <button type="button" className="records-btn" onClick={() => setShowAddForm(true)}>
                <span>+ Add Record</span>
              </button>
            </div>

            {showAddForm && session && (
              <div className="modal-overlay" onClick={() => setShowAddForm(false)} role="dialog" aria-modal="true" aria-labelledby="add-record-title">
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2 id="add-record-title">Add New Record</h2>
                  <button className="modal-close" onClick={() => setShowAddForm(false)} aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <AddRecordForm session={session} onCreated={handleRecordCreated} />
                </div>
              </div>
            )}

            {loadingRecords ? (
              <p className="loading-records">Loading records…</p>
            ) : (
              <ViewRecordsTable records={records} searchQuery={recordSearch} />
            )}
          </section>
        )}
      </main>
    </>
  )
}
