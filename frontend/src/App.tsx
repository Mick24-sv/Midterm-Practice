import { useState } from 'react'
import LoginForm from './LoginForm'
import { clearStoredSession, getSessionExpiry, readStoredSession, storeSession } from './session'
import type { AuthSession } from './api'
import './App.css'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  function handleAuthenticated(nextSession: AuthSession) {
    storeSession(nextSession)
    setSession(nextSession)
  }

  function handleSignOut() {
    clearStoredSession()
    setSession(null)
  }

  const expiry = session === null ? null : getSessionExpiry(session)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Management System</h1>
        <p>Sign in to reach the records workspace.</p>
      </header>

      {session === null ? (
        <main className="auth-card">
          <h2>Sign in</h2>
          <p className="auth-intro">Use the email and password of a registered account.</p>
          <LoginForm onAuthenticated={handleAuthenticated} />
        </main>
      ) : (
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
