// INT-01 — Login form component.
// Collects email + password, delegates to AuthContext.login(),
// and surfaces both field-level and general API errors.

import { type FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { ApiError } from '../api/auth'
import '../Login.css'

interface FieldErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
      // On success the AuthContext updates state → App renders the dashboard
    } catch (err) {
      const apiErr = (err as Error & { apiError?: ApiError }).apiError

      if (apiErr?.details && apiErr.details.length > 0) {
        // Map backend field-level validation issues to the form
        const fe: FieldErrors = {}
        for (const d of apiErr.details) {
          if (d.field === 'email') fe.email = d.message
          if (d.field === 'password') fe.password = d.message
        }
        setFieldErrors(fe)
      } else {
        setGeneralError(apiErr?.error ?? (err as Error).message ?? 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Sign in</h1>
        <p className="subtitle">Mini Management System</p>

        {generalError && (
          <div className="error-banner" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Email ── */}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="field-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* ── Password ── */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={fieldErrors.password ? 'true' : undefined}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <span id="password-error" className="field-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}

