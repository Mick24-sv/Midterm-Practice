// INT-01 — Login flow wired to backend authentication API.
// INT-02 — Registration form wired to backend registration API.

import { useState } from 'react'
import LoginForm from './LoginForm'
import RegistrationForm from './RegistrationForm'
import { clearStoredSession, getSessionExpiry, readStoredSession, storeSession } from './session'
import type { AuthSession } from './api'
import './App.css'

type AuthView = 'login' | 'register'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())
  const [view, setView] = useState<AuthView>('login')

  function handleAuthenticated(nextSession: AuthSession) {
    storeSession(nextSession)
    setSession(nextSession)
  }

  function handleSignOut() {
    clearStoredSession()
    setSession(null)
    setView('login')
  }

  const expiry = session === null ? null : getSessionExpiry(session)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Management System</h1>
        <p>
          {session === null
            ? view === 'login'
              ? 'Sign in to reach the records workspace.'
              : 'Create an account to get started.'
            : 'You are signed in.'}
        </p>
      </header>

      {/* ── Unauthenticated ── */}
      {session === null && (
        <main className="auth-card">
          {view === 'login' ? (
            <>
              <h2>Sign in</h2>
              <p className="auth-intro">Use the email and password of a registered account.</p>
              <LoginForm onAuthenticated={handleAuthenticated} />
              <p className="auth-switch">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setView('register')}
                >
                  Create one
                </button>
              </p>
            </>
          ) : (
            <>
              <h2>Create account</h2>
              <p className="auth-intro">Fill in the details below to register.</p>
              <RegistrationForm onAuthenticated={handleAuthenticated} />
              <p className="auth-switch">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setView('login')}
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </main>
      )}

      {/* ── Authenticated ── */}
      {session !== null && (
        <main className="auth-card">
          <h2>Signed in</h2>
          <p className="auth-intro">Your Bearer token is stored for this browser tab.</p>
          <dl className="session-details">
            <div>
              <dt>Name</dt>
              <dd>{session.user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{session.user.role}</dd>
            </div>
            <div>
              <dt>Token expires</dt>
              <dd>{expiry === null ? 'unknown' : expiry.toLocaleTimeString()}</dd>
            </div>
          </dl>
          <button type="button" className="auth-submit" onClick={handleSignOut}>
            Sign out
          </button>
        </main>
      )}
    </div>
  )
}
