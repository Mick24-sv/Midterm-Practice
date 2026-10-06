import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { createRecord, errorMessage, issuesByField } from '../api'
import type { ApiRecord, AuthSession } from '../api'
import { readStoredSession } from '../session'
import './AddRecordForm.css'

export type FieldErrors = Record<string, string | undefined>

export interface AddRecordFormValues {
  title: string
  description: string
  status: 'active' | 'archived'
}

function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if ((code >= 0 && code <= 31) || code === 127) {
      return true
    }
  }
  return false
}

function validateRecordValues(values: AddRecordFormValues): FieldErrors {
  const errors: FieldErrors = {}
  const title = values.title.trim()

  if (title.length === 0) {
    errors.title = 'Enter a title.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  } else if (hasControlCharacters(title)) {
    errors.title = 'Title must contain no control characters.'
  }

  if (values.description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer.'
  }

  if (values.status !== 'active' && values.status !== 'archived') {
    errors.status = 'Status must be either active or archived.'
  }

  return errors
}

export interface AddRecordFormProps {
  /** Optional auth session. If omitted, falls back to stored session or local demo mode. */
  session?: AuthSession | null
  /** Callback fired after successfully creating a new record. */
  onCreated?: (record: ApiRecord) => void
  /** Optional callback to close or dismiss the form. */
  onCancel?: () => void
  /** Optional extra CSS classes for the card wrapper. */
  className?: string
}

export default function AddRecordForm({
  session,
  onCreated,
  onCancel,
  className,
}: AddRecordFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const headerId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const statusId = useId()
  const titleErrorId = `${titleId}-error`
  const descriptionErrorId = `${descriptionId}-error`

  function clearFieldError(field: keyof AddRecordFormValues) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    if (formError) setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)
    setSuccessMessage(null)

    const errors = validateRecordValues({ title, description, status })
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setSubmitting(true)
    try {
      const activeToken = session?.token ?? readStoredSession()?.token
      let record: ApiRecord

      if (activeToken) {
        record = await createRecord(activeToken, {
          title: title.trim(),
          description: description.trim(),
          status,
        })
      } else {
        // Fallback prototype record if running without a live backend session
        record = {
          id: Math.floor(1000 + Math.random() * 9000),
          title: title.trim(),
          description: description.trim(),
          status,
          owner_id: session?.user?.id ?? 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      setSuccessMessage('Record created successfully!')
      setTitle('')
      setDescription('')
      setStatus('active')
      setFieldErrors({})

      onCreated?.(record)
    } catch (error) {
      setFieldErrors(issuesByField(error))
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`add-record-card ${className ?? ''}`.trim()} aria-labelledby={headerId}>
      <div className="add-record-header">
        <div>
          <h2 id={headerId} className="add-record-title">Add New Record</h2>
          <p className="add-record-subtitle">Create and catalog a new entry in the records database.</p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="add-record-close-btn"
            onClick={onCancel}
            aria-label="Close add record form"
          >
            ✕
          </button>
        )}
      </div>

      {formError !== null && (
        <div className="auth-alert add-record-alert--error" role="alert">
          {formError}
        </div>
      )}

      {successMessage !== null && (
        <div className="add-record-alert--success" role="status">
          <span aria-hidden="true">✓</span> {successMessage}
        </div>
      )}

      <form className="add-record-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <div className="auth-field">
          <label htmlFor={titleId}>
            Title <span className="add-record-required" aria-hidden="true">*</span>
          </label>
          <input
            id={titleId}
            name="title"
            type="text"
            autoFocus
            placeholder="e.g. Q3 Financial Audit"
            value={title}
            disabled={submitting}
            aria-invalid={fieldErrors.title !== undefined}
            aria-describedby={fieldErrors.title !== undefined ? titleErrorId : undefined}
            onChange={(event) => {
              setTitle(event.target.value)
              clearFieldError('title')
            }}
          />
          {fieldErrors.title !== undefined && (
            <p className="auth-field-error" id={titleErrorId} role="alert">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor={descriptionId}>Description</label>
          <textarea
            id={descriptionId}
            name="description"
            rows={4}
            placeholder="Enter record details or operational notes..."
            value={description}
            disabled={submitting}
            aria-invalid={fieldErrors.description !== undefined}
            aria-describedby={fieldErrors.description !== undefined ? descriptionErrorId : undefined}
            onChange={(event) => {
              setDescription(event.target.value)
              clearFieldError('description')
            }}
          />
          <div className="add-record-field-footer">
            {fieldErrors.description !== undefined ? (
              <p className="auth-field-error" id={descriptionErrorId} role="alert">
                {fieldErrors.description}
              </p>
            ) : (
              <span />
            )}
            <p className="add-record-char-count" aria-live="polite">
              {description.length} / 5000
            </p>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor={statusId}>Status</label>
          <select
            id={statusId}
            name="status"
            value={status}
            disabled={submitting}
            onChange={(event) => setStatus(event.target.value as 'active' | 'archived')}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="add-record-actions">
          <button type="submit" className="records-btn add-record-submit-btn" disabled={submitting}>
            {submitting ? 'Adding record...' : 'Add Record'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="add-record-cancel-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
