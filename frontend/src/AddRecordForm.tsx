import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { createRecord, errorMessage, issuesByField } from './api'
import type { AuthSession, Record } from './api'

type FieldErrors = Record<string, string | undefined>

interface FormValues {
  title: string
  description: string
  status: 'active' | 'archived'
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}
  const title = values.title.trim()

  if (title.length === 0) {
    errors.title = 'Enter a title.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }

  if (values.description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer.'
  }

  return errors
}

interface AddRecordFormProps {
  session: AuthSession
  onCreated: (record: Record) => void
}

export default function AddRecordForm({ session, onCreated }: AddRecordFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const titleId = useId()
  const descriptionId = useId()
  const statusId = useId()
  const titleErrorId = `${titleId}-error`
  const descriptionErrorId = `${descriptionId}-error`

  function clearFieldError(field: string) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)
    const errors = validate({ title, description, status })
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setSubmitting(true)
    try {
      const record = await createRecord(session.token, {
        title: title.trim(),
        description,
        status,
      })
      onCreated(record)
      setTitle('')
      setDescription('')
      setStatus('active')
      setFieldErrors({})
    } catch (error) {
      setFieldErrors(issuesByField(error))
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="add-record-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {formError !== null && (
        <p className="auth-alert" role="alert">
          {formError}
        </p>
      )}

      <div className="auth-field">
        <label htmlFor={titleId}>
          Title <span className="add-record-required" aria-hidden="true">*</span>
        </label>
        <input
          id={titleId}
          name="title"
          type="text"
          autoFocus
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
          <p className="auth-field-error" id={titleErrorId}>
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
          value={description}
          disabled={submitting}
          aria-invalid={fieldErrors.description !== undefined}
          aria-describedby={fieldErrors.description !== undefined ? descriptionErrorId : undefined}
          onChange={(event) => {
            setDescription(event.target.value)
            clearFieldError('description')
          }}
        />
        {fieldErrors.description !== undefined && (
          <p className="auth-field-error" id={descriptionErrorId}>
            {fieldErrors.description}
          </p>
        )}
        <p className="add-record-char-count" aria-live="polite">
          {description.length} / 5000
        </p>
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

      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add record'}
      </button>
    </form>
  )
}
