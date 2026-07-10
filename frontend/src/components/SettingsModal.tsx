import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import MaterialIcon from './ui/MaterialIcon';
import Button from './ui/Button';
import type { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENTS = [
  { id: 'sapphire', label: 'Sapphire', primary: '#2563eb' },
  { id: 'amber', label: 'Amber', primary: '#d97706' },
  { id: 'emerald', label: 'Emerald', primary: '#059669' },
];

const MAP_TYPES = [
  { id: 'standard', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
];

const SEVERITY_LEVELS = [
  { id: 'info', label: 'Info' },
  { id: 'advisory', label: 'Advisory' },
  { id: 'warning', label: 'Warning' },
  { id: 'critical', label: 'Critical' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { logout, user } = useAuth();
  const { settings, updateSettings } = useSettings();

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-[var(--sidebar-bg)] backdrop-blur-2xl border-l border-[var(--sidebar-border)] shadow-modal z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--sidebar-border)] shrink-0">
          <div className="flex items-center gap-3">
            <MaterialIcon icon="settings" className="text-2xl text-primary-400" />
            <h2 className="text-xl font-bold font-display text-on-surface">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[var(--card-bg)] hover:[background:var(--card-bg-hover)] border border-[var(--card-border)] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <MaterialIcon icon="close" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Appearance */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="palette" className="text-lg" />
              Appearance
            </h3>

            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] mb-3">
              <p className="text-sm font-medium text-on-surface mb-3">Theme</p>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ theme: mode })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                      settings.theme === mode
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-[var(--section-border)] bg-[var(--section-bg)] text-on-surface-variant hover:[background:var(--card-bg-hover)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)]">
              <p className="text-sm font-medium text-on-surface mb-3">Accent Color</p>
              <div className="flex gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updateSettings({ accent_color: a.id })}
                    className={`flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all cursor-pointer ${
                      settings.accent_color === a.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-[var(--section-border)] bg-[var(--section-bg)] hover:[background:var(--card-bg-hover)]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-outline"
                      style={{ backgroundColor: a.primary }}
                    />
                    <span className={`text-xs font-medium ${settings.accent_color === a.id ? 'text-primary-400' : 'text-on-surface-variant'}`}>
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="notifications" className="text-lg" />
              Notifications
            </h3>
            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] space-y-4">
              {[
                { key: 'notifications_enabled' as const, label: 'Enable notifications', desc: 'Master toggle for all alerts' },
                { key: 'email_notifications' as const, label: 'Email notifications', desc: 'Receive alerts via email' },
                { key: 'push_notifications' as const, label: 'Push notifications', desc: 'Receive alerts on this device' },
                { key: 'sound_alerts' as const, label: 'Sound alerts', desc: 'Play sound for critical alerts' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{label}</p>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ [key]: !settings[key] })}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${settings[key] ? 'bg-primary-500/30' : 'bg-outline'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${settings[key] ? 'left-7' : 'left-0.5'}`}
                    >
                      <MaterialIcon icon={settings[key] ? 'notifications_active' : 'notifications_off'} className="text-xs text-slate-700" />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency Settings */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="warning" className="text-lg" />
              Emergency Settings
            </h3>
            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] space-y-4">
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Default Emergency Radius</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={settings.emergency_radius}
                    onChange={(e) => updateSettings({ emergency_radius: Number(e.target.value) })}
                    className="flex-1 accent-primary-500"
                  />
                  <span className="text-sm font-mono text-on-surface w-16 text-right">{settings.emergency_radius} km</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Minimum Alert Severity</p>
                <div className="flex gap-2">
                  {SEVERITY_LEVELS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateSettings({ min_alert_severity: s.id })}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                        settings.min_alert_severity === s.id
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-[var(--section-border)] bg-[var(--section-bg)] text-on-surface-variant hover:[background:var(--card-bg-hover)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Map Settings */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="map" className="text-lg" />
              Map Settings
            </h3>
            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] space-y-4">
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Default Map Type</p>
                <div className="flex gap-2">
                  {MAP_TYPES.map((mt) => (
                    <button
                      key={mt.id}
                      onClick={() => updateSettings({ default_map_type: mt.id })}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                        settings.default_map_type === mt.id
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-[var(--section-border)] bg-[var(--section-bg)] text-on-surface-variant hover:[background:var(--card-bg-hover)]'
                      }`}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Auto locate on startup</p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">Center map on your location</p>
                </div>
                <button
                  onClick={() => updateSettings({ auto_locate: !settings.auto_locate })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${settings.auto_locate ? 'bg-primary-500/30' : 'bg-outline'}`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${settings.auto_locate ? 'left-7' : 'left-0.5'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Show Government Alerts</p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">Display CAP alerts on map</p>
                </div>
                <button
                  onClick={() => updateSettings({ show_gov_alerts: !settings.show_gov_alerts })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${settings.show_gov_alerts ? 'bg-primary-500/30' : 'bg-outline'}`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${settings.show_gov_alerts ? 'left-7' : 'left-0.5'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Show User Disasters</p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">Display reported disasters on map</p>
                </div>
                <button
                  onClick={() => updateSettings({ show_user_disasters: !settings.show_user_disasters })}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${settings.show_user_disasters ? 'bg-primary-500/30' : 'bg-outline'}`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${settings.show_user_disasters ? 'left-7' : 'left-0.5'}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="accessibility" className="text-lg" />
              Accessibility
            </h3>
            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] space-y-4">
              {[
                { key: 'larger_text' as const, label: 'Larger text', desc: 'Increase font size throughout' },
                { key: 'reduced_motion' as const, label: 'Reduced motion', desc: 'Minimize animations and transitions' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{label}</p>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ [key]: !settings[key] })}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${settings[key] ? 'bg-primary-500/30' : 'bg-outline'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${settings[key] ? 'left-7' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon icon="info" className="text-lg" />
              About
            </h3>
            <div className="p-4 rounded-xl bg-[var(--section-bg)] border border-[var(--section-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Application</span>
                <span className="text-sm font-medium text-on-surface">AIDRAC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Version</span>
                <span className="text-sm font-medium text-on-surface">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">User</span>
                <span className="text-sm font-medium text-on-surface">{user?.full_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Role</span>
                <span className="text-sm font-medium text-on-surface capitalize">{user?.role || '—'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--sidebar-border)] shrink-0">
          <Button
            variant="danger"
            className="w-full"
            onClick={handleLogout}
            icon={<MaterialIcon icon="logout" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
