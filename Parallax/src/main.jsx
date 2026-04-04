import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

function isLocalhost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

async function cleanupLocalServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((reg) => reg.unregister()))
  } catch {
    // Best-effort cleanup only.
  }

  if (!('caches' in window)) return

  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  } catch {
    // Best-effort cleanup only.
  }
}

async function registerPwaForProductionHosts() {
  if (isLocalhost()) return
  try {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({ immediate: true })
  } catch {
    // Non-fatal: app should continue even if PWA registration fails.
  }
}

async function bootstrap() {
  if (isLocalhost()) {
    await cleanupLocalServiceWorker()
  } else {
    await registerPwaForProductionHosts()
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void bootstrap()
