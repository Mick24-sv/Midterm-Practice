export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  tokenType: string
  expiresIn: number
}

export interface FieldIssue {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly issues: FieldIssue[]

  constructor(message: string, status: number, code: string, issues: FieldIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.issues = issues
  }
}

export function issuesByField(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {}
  }

  return error.issues.reduce<Record<string, string>>((issues, issue) => {
    issues[issue.field] = issue.message
    return issues
  }, {})
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

function toFieldIssues(value: unknown): FieldIssue[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (entry): entry is FieldIssue =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as FieldIssue).field === 'string' &&
      typeof (entry as FieldIssue).message === 'string',
  )
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as AuthUser
  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string'
  )
}

function toAuthSession(value: unknown): AuthSession {
  if (typeof value !== 'object' || value === null) {
    throw new ApiError('The API returned an unexpected response.', 0, 'invalid_response')
  }

  const session = value as AuthSession
  if (typeof session.token !== 'string' || !isAuthUser(session.user)) {
    throw new ApiError('The API returned an unexpected response.', 0, 'invalid_response')
  }

  return {
    user: session.user,
    token: session.token,
    tokenType: typeof session.tokenType === 'string' ? session.tokenType : 'Bearer',
    expiresIn: typeof session.expiresIn === 'number' ? session.expiresIn : 0,
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return new ApiError(
      `The API responded with ${response.status}.`,
      response.status,
      'invalid_response',
    )
  }

  if (typeof payload !== 'object' || payload === null) {
    return new ApiError(
      `The API responded with ${response.status}.`,
      response.status,
      'invalid_response',
    )
  }

  const { error, code, details } = payload as {
    error?: unknown
    code?: unknown
    details?: unknown
  }

  return new ApiError(
    typeof error === 'string' ? error : `The API responded with ${response.status}.`,
    response.status,
    typeof code === 'string' ? code : 'unknown_error',
    toFieldIssues(details),
  )
}

export interface ApiRecord {
  id: number
  title: string
  description: string
  status: 'active' | 'archived'
  owner_id: number
  created_at: string
  updated_at: string
}

export async function fetchRecords(
  token: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiRecord[]> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/records`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      'Could not reach the records API. Check that the backend is running.',
      0,
      'network_error',
    )
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  const payload = await response.json() as { records: ApiRecord[] }
  return payload.records
}

export async function createRecord(
  token: string,
  data: { title: string; description: string; status: 'active' | 'archived' },
): Promise<ApiRecord> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/records`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  } catch {
    throw new ApiError(
      'Could not reach the records API. Check that the backend is running.',
      0,
      'network_error',
    )
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  const payload = await response.json() as { record: ApiRecord }
  return payload.record
}

// INT-02 — Registration API call
export async function register(credentials: {
  name: string
  email: string
  password: string
}): Promise<AuthSession> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
  } catch {
    throw new ApiError(
      'Could not reach the registration API. Check that the backend is running.',
      0,
      'network_error',
    )
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  try {
    return toAuthSession(await response.json())
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('The API returned an unreadable response.', 0, 'invalid_response')
  }
}

export async function login(credentials: {
  email: string
  password: string
}): Promise<AuthSession> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
  } catch {
    throw new ApiError(
      'Could not reach the authentication API. Check that the backend is running.',
      0,
      'network_error',
    )
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  try {
    return toAuthSession(await response.json())
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('The API returned an unreadable response.', 0, 'invalid_response')
  }
}