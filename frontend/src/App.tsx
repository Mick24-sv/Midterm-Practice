import { useState } from 'react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

type Page     = 'Home' | 'Dashboard' | 'Records'
type AuthView = 'login' | 'register'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authView, setAuthView]     = useState<AuthView>('login')
  const [activePage, setActivePage] = useState<Page>('Home')

  // ── Auth screens ───────────────────────────────────────────
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={() => setAuthView('login')}   // redirect to login after success
          onGoToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <LoginPage
        onLogin={() => setIsLoggedIn(true)}
        onGoToRegister={() => setAuthView('register')}
      />
    )
  }

  // ── Main app ───────────────────────────────────────────────
  return (
    <>
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={() => {
          setIsLoggedIn(false)
          setAuthView('login')
        }}
      />

      <main>
        {activePage === 'Home' && (
          <section id="home" className="page-section">
            <h1>Home</h1>
            <p>Welcome to the Mini Management System. Use the navigation bar above to get started.</p>
          </section>
        )}

        {activePage === 'Dashboard' && <DashboardPage />}

        {activePage === 'Records' && (
          <section id="records" className="page-section">
            <h1>Records</h1>
            <p>Your records and data will appear here.</p>
          </section>
        )}
      </main>
    </>
  )
}

export default App
