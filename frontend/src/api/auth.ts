// INT-01 — API service layer for authentication endpoints.
// All requests go through Vite's dev proxy (/api → http://localhost:3000).

const BASE = '/api/auth'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
  tokenType: string
  expiresIn: number
}

export interface ApiError {
  error: string
  code?: string
  details?: { field: string; message: string }[]
}

/** POST /api/auth/login */
export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    // Attach the parsed API error so callers can surface field-level messages
    const err = new Error((data as ApiError).error ?? 'Login failed')
    ;(err as Error & { apiError: ApiError }).apiError = data as ApiError
    throw err
  }

  return data as AuthResponse
}

/** POST /api/auth/register */
export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    const err = new Error((data as ApiError).error ?? 'Registration failed')
    ;(err as Error & { apiError: ApiError }).apiError = data as ApiError
    throw err
  }

  return data as AuthResponse
}

