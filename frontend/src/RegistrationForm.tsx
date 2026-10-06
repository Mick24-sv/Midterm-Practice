// INT-02 — Registration form component.
// Collects name, email, password, and password confirmation,
// runs client-side validation, then calls POST /api/auth/register via api.ts.
// On success it calls onAuthenticated so App can store the session.

import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage, issuesByField, register } from './api'
import type { AuthSession } from './api'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const encoder = new TextEncoder()

type FieldErrors = Record<string, string | undefined>

interface RegistrationFields {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

function validate(fields: RegistrationFields): FieldErrors {
  const errors: FieldErrors = {}

  // Name
  const name = fields.name.trim()
  if (name.length === 0) {
    errors.name = 'Enter your full name.'
  } else if (name.length > 100) {
    errors.name = 'Name must be 100 characters or fewer.'
  }

  // Username
  const username = fields.username.trim()
  if (username.length === 0) {
    errors.username = 'Choose a username.'
  } else if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    errors.username = 'Username must be 3-32 characters using letters, numbers, dots, underscores, or dashes.'
  }

  // Email
  const email = fields.email.trim()
  if (email.length === 0) {
    errors.email = 'Enter an email address.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  // Password — backend accepts 8–72 UTF-8 bytes
  const passwordBytes = encoder.encode(fields.password).length
  if (fields.password.length === 0) {
    errors.password = 'Enter a password.'
  } else if (passwordBytes < 8 || passwordBytes > 72) {
    errors.password = 'Password must be between 8 and 72 characters.'
  }

  // Confirm password
  if (fields.confirmPassword.length === 0) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

interface RegistrationFormProps {
  onAuthenticated: (session: AuthSession) => void
}

export default function RegistrationForm({ onAuthenticated }: RegistrationFormProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Stable, accessible IDs
  const nameId = useId()
  const usernameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()

  function clearFieldError(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)

    const errors = validate({ name, username, email, password, confirmPassword })
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setSubmitting(true)
    try {
      onAuthenticated(
        await register({ name: name.trim(), username: username.trim(), email: email.trim(), password }),
      )
    } catch (error) {
      // Map backend field-level issues (e.g. duplicate email) to the form
      setFieldErrors(issuesByField(error))
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {formError !== null && (
        <p className="auth-alert" role="alert">
          {formError}
        </p>
      )}

      {/* ── Name ── */}
      <div className="auth-field">
        <label htmlFor={nameId}>Full name</label>
        <input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          autoFocus
          value={name}
          disabled={submitting}
          aria-invalid={fieldErrors.name !== undefined}
          aria-describedby={fieldErrors.name !== undefined ? `${nameId}-error` : undefined}
          onChange={(event) => {
            setName(event.target.value)
            clearFieldError('name')
          }}
        />
        {fieldErrors.name !== undefined && (
          <p className="auth-field-error" id={`${nameId}-error`}>
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* ── Username ── */}
      <div className="auth-field">
        <label htmlFor={usernameId}>Username</label>
        <input
          id={usernameId}
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          disabled={submitting}
          aria-invalid={fieldErrors.username !== undefined}
          aria-describedby={fieldErrors.username !== undefined ? `${usernameId}-error` : undefined}
          onChange={(event) => {
            setUsername(event.target.value)
            clearFieldError('username')
          }}
        />
        {fieldErrors.username !== undefined && (
          <p className="auth-field-error" id={`${usernameId}-error`}>
            {fieldErrors.username}
          </p>
        )}
      </div>

      {/* ── Email ── */}
      <div className="auth-field">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          aria-invalid={fieldErrors.email !== undefined}
          aria-describedby={fieldErrors.email !== undefined ? `${emailId}-error` : undefined}
          onChange={(event) => {
            setEmail(event.target.value)
            clearFieldError('email')
          }}
        />
        {fieldErrors.email !== undefined && (
          <p className="auth-field-error" id={`${emailId}-error`}>
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* ── Password ── */}
      <div className="auth-field">
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          disabled={submitting}
          aria-invalid={fieldErrors.password !== undefined}
          aria-describedby={fieldErrors.password !== undefined ? `${passwordId}-error` : undefined}
          onChange={(event) => {
            setPassword(event.target.value)
            clearFieldError('password')
          }}
        />
        {fieldErrors.password !== undefined && (
          <p className="auth-field-error" id={`${passwordId}-error`}>
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* ── Confirm password ── */}
      <div className="auth-field">
        <label htmlFor={confirmPasswordId}>Confirm password</label>
        <input
          id={confirmPasswordId}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={submitting}
          aria-invalid={fieldErrors.confirmPassword !== undefined}
          aria-describedby={
            fieldErrors.confirmPassword !== undefined
              ? `${confirmPasswordId}-error`
              : undefined
          }
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            clearFieldError('confirmPassword')
          }}
        />
        {fieldErrors.confirmPassword !== undefined && (
          <p className="auth-field-error" id={`${confirmPasswordId}-error`}>
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}

