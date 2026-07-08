import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'

// Get client ID from env or use a placeholder
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder_client_id';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
