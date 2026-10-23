import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider'

// Global graceful uncaught error listeners with console logging
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Occassia Global Error]', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Occassia Unhandled Promise Rejection]', {
      reason: event.reason,
      promise: event.promise,
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><App /></ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
  } else {
    // In development, unregister any service workers and clear caches so Vite HMR is never corrupted
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) caches.delete(name);
      });
    }
  }
}
