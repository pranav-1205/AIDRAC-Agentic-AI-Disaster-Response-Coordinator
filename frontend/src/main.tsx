import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

// Fast initial restore from localStorage (prevents flash)
try {
  const raw = localStorage.getItem('aidrac-settings');
  if (raw) {
    const s = JSON.parse(raw);
    if (s.theme === 'light') {
      document.documentElement.classList.add('light');
    } else if (s.theme === 'system') {
      document.documentElement.classList.add('system-theme');
    }
    if (s.accent_color && s.accent_color !== 'sapphire') {
      document.documentElement.setAttribute('data-theme', s.accent_color);
    }
    if (s.larger_text) {
      document.documentElement.classList.add('larger-text');
    }
    if (s.reduced_motion) {
      document.documentElement.classList.add('reduced-motion');
    } else if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduced-motion-system');
    }
  }
} catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
