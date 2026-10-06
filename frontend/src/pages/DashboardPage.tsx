import React from 'react'
import './DashboardPage.css'

// ── Types ──────────────────────────────────────────────────
interface StatCard {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

interface ActivityRow {
  id: number
  action: string
  user: string
  date: string
  status: 'Completed' | 'Pending' | 'Failed'
}

// ── Static placeholder data ────────────────────────────────
const STAT_CARDS: StatCard[] = [
  {
    label: 'Total Users',
    value: '1,284',
    change: '+12% this month',
    trend: 'up',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Total Records',
    value: '5,740',
    change: '+8% this month',
    trend: 'up',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: 'Pending Tasks',
    value: '37',
    change: '-5% this month',
    trend: 'down',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'System Status',
    value: 'Online',
    change: '99.9% uptime',
    trend: 'neutral',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

const ACTIVITY_ROWS: ActivityRow[] = [
  { id: 1, action: 'User registered',       user: 'Maria Santos',   date: 'Oct 6, 2026',  status: 'Completed' },
  { id: 2, action: 'Record updated',        user: 'Jose Reyes',     date: 'Oct 6, 2026',  status: 'Completed' },
  { id: 3, action: 'Report generated',      user: 'Ana Lim',        date: 'Oct 5, 2026',  status: 'Pending'   },
  { id: 4, action: 'Password reset request',user: 'Carlos Bautista',date: 'Oct 5, 2026', status: 'Completed' },
  { id: 5, action: 'Record deleted',        user: 'Admin',          date: 'Oct 4, 2026',  status: 'Failed'    },
]

// ── Sub-components ─────────────────────────────────────────
function TrendIcon({ trend }: { trend: StatCard['trend'] }) {
  if (trend === 'up') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
  if (trend === 'down') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
  return null
}

function StatusBadge({ status }: { status: ActivityRow['status'] }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {status}
    </span>
  )
}

const formattedToday = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

interface DashboardPageProps {
  onCreateRecord?: () => void
}

// ── Main component ─────────────────────────────────────────
export default function DashboardPage({ onCreateRecord }: DashboardPageProps = {}) {
  return (
    <div className="dashboard">

      {/* Page header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <p className="dashboard__date">
          {formattedToday}
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <section aria-label="Summary statistics">
        <div className="stat-grid">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="stat-card">
              <div className="stat-card__top">
                <span className="stat-card__label">{card.label}</span>
                <span className="stat-card__icon">{card.icon}</span>
              </div>
              <p className="stat-card__value">{card.value}</p>
              <p className={`stat-card__change stat-card__change--${card.trend}`}>
                <TrendIcon trend={card.trend} />
                {card.change}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom row: activity + quick actions ────────────── */}
      <div className="dashboard__bottom">

        {/* Recent activity table */}
        <section className="activity-card" aria-label="Recent activity">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <button type="button" className="card-action-btn">View all</button>
          </div>
          <div className="table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td className="activity-table__id">{row.id}</td>
                    <td>{row.action}</td>
                    <td>{row.user}</td>
                    <td className="activity-table__date">{row.date}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions panel */}
        <section className="quick-actions-card" aria-label="Quick actions">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <ul className="quick-actions-list">
            {[
              {
                label: 'Add New User',
                icon: '👤',
                onClick: undefined,
              },
              {
                label: 'Create Record',
                icon: '📄',
                onClick: onCreateRecord,
              },
              {
                label: 'Generate Report',
                icon: '📊',
                onClick: undefined,
              },
              {
                label: 'System Settings',
                icon: '⚙️',
                onClick: undefined,
              },
            ].map(({ label, icon, onClick }) => (
              <li key={label}>
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={onClick}
                >
                  <span className="quick-action-btn__icon" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                  <svg className="quick-action-btn__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  )
}
