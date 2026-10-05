import type { AuthSession } from './api'

const storageKey = 'mini-management-system.session.v1'

function decodeTokenExpiry(token: string): number | null {
  const segments = token.split('.')
  if (segments.length !== 3) {
    return null
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload: unknown = JSON.parse(atob(padded))

    if (typeof payload !== 'object' || payload === null) {
      return null
    }

    const { exp } = payload as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function writeStoredSession(value: string | null): void {
  try {
    if (value === null) {
      sessionStorage.removeItem(storageKey)
    } else {
      sessionStorage.setItem(storageKey, value)
    }
  } catch {
    return
  }
}

export function getSessionExpiry(session: AuthSession): Date | null {
  const expiry = decodeTokenExpiry(session.token)
  return expiry === null ? null : new Date(expiry)
}

export function readStoredSession(): AuthSession | null {
  let stored: string | null
  try {
    stored = sessionStorage.getItem(storageKey)
  } catch {
    return null
  }

  if (stored === null) {
    return null
  }

  let session: AuthSession | null
  try {
    session = JSON.parse(stored) as AuthSession | null
  } catch {
    writeStoredSession(null)
    return null
  }

  if (session === null || typeof session.token !== 'string' || typeof session.user !== 'object') {
    writeStoredSession(null)
    return null
  }

  const expiry = decodeTokenExpiry(session.token)
  if (expiry !== null && expiry <= Date.now()) {
    writeStoredSession(null)
    return null
  }

  return session
}

export function storeSession(session: AuthSession): void {
  writeStoredSession(JSON.stringify(session))
}

export function clearStoredSession(): void {
  writeStoredSession(null)
}