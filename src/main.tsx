import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { AppProvider } from './hooks/useApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider must wrap AppProvider — AppProvider reads auth state */}
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
