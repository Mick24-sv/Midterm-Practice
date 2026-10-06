import { useState } from 'react'
import Navbar from './components/Navbar'
import './App.css'

type Page = 'Home' | 'Dashboard' | 'Records'

function App() {
  const [activePage, setActivePage] = useState<Page>('Home')

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      <main>
        {activePage === 'Home' && (
          <section id="home" className="page-section">
            <h1>Home</h1>
            <p>Welcome to the Mini Management System. Use the navigation bar above to get started.</p>
          </section>
        )}

        {activePage === 'Dashboard' && (
          <section id="dashboard" className="page-section">
            <h2>Dashboard</h2>
            <p>Your dashboard overview will appear here.</p>
          </section>
        )}

        {activePage === 'Records' && (
          <section id="records" className="page-section">
            <h2>Records</h2>
            <p>Your records and data will appear here.</p>
          </section>
        )}
      </main>
    </>
  )
}

export default App
