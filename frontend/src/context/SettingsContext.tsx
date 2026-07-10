import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { settingsApi } from '../services/api';
import type { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  id: 0,
  user_id: 0,
  theme: 'dark',
  accent_color: 'sapphire',
  notifications_enabled: true,
  email_notifications: true,
  push_notifications: true,
  sound_alerts: true,
  emergency_radius: 25,
  min_alert_severity: 'info',
  default_map_type: 'standard',
  auto_locate: true,
  show_gov_alerts: true,
  show_user_disasters: true,
  larger_text: false,
  reduced_motion: false,
};

function loadLocal(): UserSettings {
  try {
    const raw = localStorage.getItem('aidrac-settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveLocal(s: UserSettings) {
  localStorage.setItem('aidrac-settings', JSON.stringify(s));
}

function applyTheme(theme: string) {
  document.documentElement.classList.remove('light', 'system-theme');
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else if (theme === 'system') {
    document.documentElement.classList.add('system-theme');
  }
  localStorage.setItem('aidrac-theme', theme);
}

function applyAccent(accent: string) {
  if (accent === 'sapphire') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', accent);
  }
  localStorage.setItem('aidrac-accent', accent);
}

function applyLargerText(enabled: boolean) {
  document.documentElement.classList.toggle('larger-text', enabled);
}

function applyReducedMotion(enabled: boolean) {
  document.documentElement.classList.remove('reduced-motion', 'reduced-motion-system');
  if (enabled) {
    document.documentElement.classList.add('reduced-motion');
  } else if (localStorage.getItem('aidrac-prefers-reduced-motion') !== 'true') {
    document.documentElement.classList.add('reduced-motion-system');
  }
}

function applyAll(s: UserSettings) {
  applyTheme(s.theme);
  applyAccent(s.accent_color);
  applyLargerText(s.larger_text);
  applyReducedMotion(s.reduced_motion);
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(loadLocal);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);
  const initialRef = useRef(false);

  // Apply on first render (catch any change between localStorage and render)
  useEffect(() => {
    if (!initialRef.current) {
      initialRef.current = true;
      applyAll(settings);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch from backend when user logs in
  useEffect(() => {
    if (!user) return;
    if (loaded.current) return;
    setLoading(true);
    settingsApi.get()
      .then((res) => {
        const s = res.data;
        setSettings(s);
        applyAll(s);
        saveLocal(s);
        loaded.current = true;
      })
      .catch(() => {
        // fall back to local
      })
      .finally(() => setLoading(false));
  }, [user]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    applyAll(next);
    saveLocal(next);
    try {
      const res = await settingsApi.update(patch);
      const server = res.data;
      setSettings(server);
      applyAll(server);
      saveLocal(server);
    } catch {
      // revert is complex; keep optimistic update
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
