// INT-01 — Login flow wired to backend authentication API.
// INT-02 — Registration form wired to backend registration API.

import { useState } from 'react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ViewRecordsTable, { type ViewRecord } from './pages/ViewRecordsTable'
import AddRecordForm from './components/AddRecordForm'
import './App.css'

type Page     = 'Home' | 'Dashboard' | 'Records'
type AuthView = 'login' | 'register'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authView, setAuthView]     = useState<AuthView>('login')
  const [activePage, setActivePage] = useState<Page>('Home')
  const [recordSearch, setRecordSearch] = useState('')
  const [showAddForm, setShowAddForm]   = useState(false)

  // ── Sample Records Data ────────────────────────────────────
  const sampleRecords: ViewRecord[] = [
    { id: 'REC-1001', title: 'Q3 Financial Audit', category: 'Finance', updated: '2 hours ago', status: 'Completed' },
    { id: 'REC-1002', title: 'Employee Onboarding Docs', category: 'HR', updated: 'Yesterday', status: 'Completed' },
    { id: 'REC-1003', title: 'Server Migration Plan', category: 'IT', updated: '3 days ago', status: 'Pending' },
    { id: 'REC-1004', title: 'Vendor Contract Review', category: 'Legal', updated: 'Last week', status: 'Completed' },
  ]

  const [records, setRecords] = useState<ViewRecord[]>(sampleRecords)

  // ── Auth screens ───────────────────────────────────────────
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={() => setAuthView('login')}
          onGoToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <LoginPage
        onLogin={() => setIsLoggedIn(true)}
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
        onLogout={() => {
          setIsLoggedIn(false)
          setAuthView('login')
        }}
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
        {activePage === 'Dashboard' && (
          <DashboardPage
            onCreateRecord={() => {
              setActivePage('Records')
              setShowAddForm(true)
            }}
          />
        )}

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
              <button
                type="button"
                className="records-btn"
                onClick={() => setShowAddForm((prev) => !prev)}
                aria-expanded={showAddForm}
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Record'}</span>
              </button>
            </div>

            {showAddForm && (
              <AddRecordForm
                onCreated={(newRecord) => {
                  const newViewRecord: ViewRecord = {
                    id: `REC-${newRecord.id}`,
                    title: newRecord.title,
                    category: 'General',
                    updated: 'Just now',
                    status: newRecord.status === 'active' ? 'Completed' : 'Pending',
                  }
                  setRecords((prev) => [newViewRecord, ...prev])
                  setShowAddForm(false)
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <ViewRecordsTable records={records} searchQuery={recordSearch} />
          </section>
        )}
      </main>
    </>
  )
}
