import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* INT-01 — AuthProvider makes login state available to the whole tree */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
