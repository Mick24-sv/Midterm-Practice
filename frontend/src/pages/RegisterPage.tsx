import { useState, type FormEvent } from 'react'
import { register } from '../api'
import { storeSession } from '../session'
import './RegisterPage.css'

// Password strength helper
function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { level: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Weak', 'Fair', 'Strong']
  return { level: score as 0 | 1 | 2 | 3, label: labels[score - 1] ?? 'Weak' }
}

// Eye icons
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

interface RegisterPageProps {
  onRegister: (session: { user: { name: string } }) => void
  onGoToLogin: () => void
}

export default function RegisterPage({ onRegister, onGoToLogin }: RegisterPageProps) {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [loading, setLoading]           = useState(false)

  const strength = getPasswordStrength(password)

  function validate(): string {
    if (!fullName.trim())       return 'Full name is required.'
    if (!email.trim())          return 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.'
    if (!username.trim())       return 'Username is required.'
    if (username.length < 3)    return 'Username must be at least 3 characters.'
    if (!password)              return 'Password is required.'
    if (password.length < 8)    return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const session = await register({ name: fullName, email, password })
      storeSession(session)
      setSuccess(true)
      setTimeout(() => onRegister({ user: { name: session.user.name } }), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
      setLoading(false)
    }
  }

  return (
    <div className="register-wrapper">
      <div className="register-card">

        {/* Header */}
        <div className="register-card__header">
          <span className="register-card__logo" aria-hidden="true">⚡</span>
          <h1 className="register-card__title">Create an Account</h1>
          <p className="register-card__subtitle">Mini Management System</p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="register-card__success" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Account created! Redirecting to login…
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="register-card__error" role="alert">
            <AlertIcon />
            {error}
          </div>
        )}

        {/* Form */}
        <form className="register-form" onSubmit={handleSubmit} noValidate>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="reg-fullname" className="form-label">Full Name</label>
            <input
              id="reg-fullname"
              type="text"
              className="form-input"
              placeholder="e.g. Juan Dela Cruz"
              value={fullName}
              autoComplete="name"
              autoFocus
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="reg-username" className="form-label">Username</label>
            <input
              id="reg-username"
              type="text"
              className="form-input"
              placeholder="Choose a username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="form-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input form-input--padded-right"
                placeholder="At least 8 characters"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="form-input__toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div className="strength-meter" aria-label={`Password strength: ${strength.label}`}>
                <div className="strength-meter__bars">
                  <span className={`strength-bar${strength.level >= 1 ? ` strength-bar--${strength.level}` : ''}`} />
                  <span className={`strength-bar${strength.level >= 2 ? ` strength-bar--${strength.level}` : ''}`} />
                  <span className={`strength-bar${strength.level >= 3 ? ` strength-bar--${strength.level}` : ''}`} />
                </div>
                <span className={`strength-label strength-label--${strength.level}`}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <div className="form-input-wrapper">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`form-input form-input--padded-right${
                  confirmPassword && confirmPassword !== password ? ' form-input--error' : ''
                }${
                  confirmPassword && confirmPassword === password ? ' form-input--ok' : ''
                }`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="form-input__toggle"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="register-btn" disabled={loading || success}>
            {loading && <span className="register-btn__spinner" aria-hidden="true" />}
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        {/* Switch to login */}
        <p className="register-card__switch">
          Already have an account?{' '}
          <button type="button" className="register-card__link" onClick={onGoToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
