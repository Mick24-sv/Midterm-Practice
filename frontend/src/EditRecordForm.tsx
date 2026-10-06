import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { updateRecord, errorMessage, issuesByField } from './api'
import type { ApiRecord, AuthSession, RecordUpdate } from './api'

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

interface EditRecordFormProps {
  session: AuthSession
  // Field state is seeded from this record once on mount, so the caller must
  // remount the form (via `key`) when switching to a different record.
  record: ApiRecord
  onUpdated: (record: ApiRecord) => void
}

export default function EditRecordForm({ session, record, onUpdated }: EditRecordFormProps) {
  const [title, setTitle] = useState(record.title)
  const [description, setDescription] = useState(record.description)
  const [status, setStatus] = useState<'active' | 'archived'>(record.status)
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

    // PATCH is partial, so only send the fields that actually changed. This
    // keeps updated_at from moving when the user re-saves an unchanged record.
    const data: RecordUpdate = {}
    if (title.trim() !== record.title) data.title = title.trim()
    if (description !== record.description) data.description = description
    if (status !== record.status) data.status = status

    if (Object.keys(data).length === 0) {
      setFormError('Nothing to update — change a field before saving.')
      return
    }

    setSubmitting(true)
    try {
      const updated = await updateRecord(session.token, record.id, data)
      onUpdated(updated)
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
        {submitting ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
