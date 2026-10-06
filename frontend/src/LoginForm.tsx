import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage, issuesByField, login } from './api'
import type { AuthSession } from './api'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const encoder = new TextEncoder()

type FieldErrors = Record<string, string | undefined>

interface Credentials {
  email: string
  password: string
}

function validate(credentials: Credentials): FieldErrors {
  const errors: FieldErrors = {}
  const email = credentials.email.trim()

  if (email.length === 0) {
    errors.email = 'Enter the email address for your account.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  const passwordBytes = encoder.encode(credentials.password).length
  if (credentials.password.length === 0) {
    errors.password = 'Enter your password.'
  } else if (passwordBytes < 8 || passwordBytes > 72) {
    errors.password = 'Password must be between 8 and 72 characters.'
  }

  return errors
}

interface LoginFormProps {
  onAuthenticated: (session: AuthSession) => void
}

export default function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emailId = useId()
  const passwordId = useId()
  const emailErrorId = `${emailId}-error`
  const passwordErrorId = `${passwordId}-error`

  function clearFieldError(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) {
      return
    }

    setFormError(null)
    const errors = validate({ email, password })
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) {
      return
    }

    setSubmitting(true)
    try {
      onAuthenticated(await login({ email: email.trim(), password }))
    } catch (error) {
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

      <div className="auth-field">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          disabled={submitting}
          aria-invalid={fieldErrors.email !== undefined}
          aria-describedby={fieldErrors.email !== undefined ? emailErrorId : undefined}
          onChange={(event) => {
            setEmail(event.target.value)
            clearFieldError('email')
          }}
        />
        {fieldErrors.email !== undefined && (
          <p className="auth-field-error" id={emailErrorId}>
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={submitting}
          aria-invalid={fieldErrors.password !== undefined}
          aria-describedby={fieldErrors.password !== undefined ? passwordErrorId : undefined}
          onChange={(event) => {
            setPassword(event.target.value)
            clearFieldError('password')
          }}
        />
        {fieldErrors.password !== undefined && (
          <p className="auth-field-error" id={passwordErrorId}>
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}