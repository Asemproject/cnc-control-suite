import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Register service worker for offline support
registerSW({ immediate: true })

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  if (match) return match[1]
  return 'demo-project'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkProvider
      projectId={getProjectId()}
      publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY}
    >
      <BlinkAuthProvider>
        <Toaster position="top-right" theme="dark" richColors />
        <App />
      </BlinkAuthProvider>
    </BlinkProvider>
  </React.StrictMode>,
)