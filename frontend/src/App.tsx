// INT-01 — Root component.
// Renders the login form for unauthenticated users and a dashboard stub once
// the user has successfully authenticated via the backend API.

import { useAuth } from './context/AuthContext'
import LoginForm from './components/LoginForm'
import './Login.css'

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <main className="dashboard">
      <h1>Welcome, {user?.name} 👋</h1>
      <p>You are signed in as <strong>{user?.email}</strong> ({user?.role})</p>
      <button type="button" className="btn-secondary" onClick={logout}>
        Sign out
      </button>
    </main>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <LoginForm />
}
