// INT-01 — Login flow wired to backend authentication API.
// INT-02 — Registration form wired to backend registration API.
// INT-03 — Connect "Add Record" form to Create Record API.
// INT-04 — "View Records" table reads from the Get Records API.
// INT-05 — "Edit Record" form wired to the Update Record API.

import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ViewRecordsTable, { type ViewRecord } from './pages/ViewRecordsTable'
import AddRecordForm from './AddRecordForm'
import EditRecordForm from './EditRecordForm'
import { fetchRecords, errorMessage } from './api'
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
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    const stored = readStoredSession()
    if (stored) {
      setSession(stored)
      setIsLoggedIn(true)
    }
  }, [])

  const loadRecords = useCallback(
    async (token: string, signal?: AbortSignal) => {
      setLoadingRecords(true)
      setRecordsError(null)
      try {
        const apiRecords = await fetchRecords(token, { signal })
        setRecords(apiRecords.map(toViewRecord))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setRecords([])
        setRecordsError(errorMessage(error))
      } finally {
        if (signal?.aborted !== true) {
          setLoadingRecords(false)
        }
      }
    },
    [],
  )

  // INT-04 — fetch records whenever the authenticated session changes, and
  // abort the in-flight request so a logout or token swap cannot overwrite it.
  useEffect(() => {
    if (!session) return

    const controller = new AbortController()
    void loadRecords(session.token, controller.signal)

    return () => controller.abort()
  }, [session, loadRecords])

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
    setShowAddForm(false)
    setEditingRecordId(null)
  }

  function handleRecordCreated(apiRecord: ApiRecord) {
    setRecordsError(null)
    setRecords((prev) => [toViewRecord(apiRecord), ...prev])
    setShowAddForm(false)
  }

  // Editing and adding are mutually exclusive modals on the same surface.
  function openAddForm() {
    setEditingRecordId(null)
    setShowAddForm(true)
  }

  function handleRetryRecords() {
    if (!session) return
    void loadRecords(session.token)
  }

  function handleEditRecord(record: ViewRecord) {
    // The table only knows the ViewRecord shape, so look up the full API record
    // by its stable display id rather than trusting the shape it passed back.
    const match = records.find((candidate) => candidate.id === record.id)
    if (!match) return

    setRecordsError(null)
    setShowAddForm(false)
    setEditingRecordId(match.apiRecord.id)
  }

  function handleRecordUpdated(apiRecord: ApiRecord) {
    setRecords((prev) => {
      const viewId = toViewRecord(apiRecord).id
      return prev.map((record) => (record.id === viewId ? toViewRecord(apiRecord) : record))
    })
    setEditingRecordId(null)
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
              <button type="button" className="records-btn" onClick={openAddForm}>
                <span>+ Add Record</span>
              </button>
            </div>

            {editingRecordId !== null && session && (() => {
              const editing = records.find((record) => record.apiRecord.id === editingRecordId)
              if (!editing) return null

              return (
                <div className="modal-overlay" onClick={() => setEditingRecordId(null)} role="dialog" aria-modal="true" aria-labelledby="edit-record-title">
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2 id="edit-record-title">Edit Record</h2>
                    <button className="modal-close" onClick={() => setEditingRecordId(null)} aria-label="Close">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <EditRecordForm
                      key={editing.apiRecord.id}
                      session={session}
                      record={editing.apiRecord}
                      onUpdated={handleRecordUpdated}
                    />
                  </div>
                </div>
              )
            })()}

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

            {recordsError !== null ? (
              <div className="records-error" role="alert">
                <p>{recordsError}</p>
                <button
                  type="button"
                  className="records-retry"
                  onClick={handleRetryRecords}
                  disabled={loadingRecords}
                >
                  {loadingRecords ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            ) : loadingRecords ? (
              <p className="loading-records">Loading records…</p>
            ) : (
              <ViewRecordsTable records={records} searchQuery={recordSearch} onEdit={handleEditRecord} />
            )}
          </section>
        )}
      </main>
    </>
  )
}
