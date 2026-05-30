import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import './styles/index.css'
import App from './App.jsx'
import { AuthProvider as TailorAuthProvider } from './modules/tailor/context/AuthContext'
import { NotificationProvider as TailorNotificationProvider } from './modules/tailor/context/NotificationContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TailorAuthProvider>
      <TailorNotificationProvider>
        <App />
      </TailorNotificationProvider>
    </TailorAuthProvider>
  </StrictMode>,
)
