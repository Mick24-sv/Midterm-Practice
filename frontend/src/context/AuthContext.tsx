// INT-01 — React context that stores auth state (user + JWT token)
// and exposes login / logout helpers used by the login form and the rest of the app.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { loginRequest, type AuthUser } from '../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  /** Returns true on success; throws on failure so the form can show the error. */
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'mms_token'
const USER_KEY = 'mms_user'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Rehydrate from localStorage so the user stays logged in across refreshes
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const userJson = localStorage.getItem(USER_KEY)
      if (token && userJson) {
        return { token, user: JSON.parse(userJson) as AuthUser }
      }
    } catch {
      // Corrupt storage — start fresh
    }
    return { token: null, user: null }
  })

  // Clear storage whenever the token disappears
  useEffect(() => {
    if (state.token && state.user) {
      localStorage.setItem(TOKEN_KEY, state.token)
      localStorage.setItem(USER_KEY, JSON.stringify(state.user))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }, [state])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password) // throws on API error
    setState({ token: data.token, user: data.user })
  }, [])

  const logout = useCallback(() => {
    setState({ token: null, user: null })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, isAuthenticated: state.token !== null }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

