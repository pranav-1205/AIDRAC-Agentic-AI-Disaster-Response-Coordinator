import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MaterialIcon from './ui/MaterialIcon';
import SettingsModal from './SettingsModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const links = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/map', icon: 'map', label: 'Interactive Map' },
  { to: '/shelters', icon: 'emergency_home', label: 'Shelters' },
  { to: '/hospitals', icon: 'local_hospital', label: 'Hospitals' },
  { to: '/alerts', icon: 'notifications_active', label: 'Alerts' },
];

const secondaryLinks = [
  { to: '#settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`w-[280px] h-screen [background:var(--sidebar-bg)] backdrop-blur-2xl border-r [border-color:var(--sidebar-border)] flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b [border-color:var(--sidebar-border)]">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <MaterialIcon icon="shield" className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-on-surface tracking-wide">AIDRAC</h1>
            <p className="text-sm text-on-surface-variant font-mono tracking-widest uppercase">Response Node</p>
          </div>
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto py-8 flex flex-col gap-10">
        <nav className="px-3 space-y-1.5">
          <div className="px-4 mb-3 text-sm font-mono text-on-surface-variant/60 uppercase tracking-widest">Main Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:[background:var(--sidebar-hover-bg)] hover:text-on-surface transition-all duration-200 group ${isActive ? 'bg-primary-500/10 text-primary-400 font-medium border border-primary-500/20' : 'border border-transparent'}`
              }
            >
              {({ isActive }) => (
                <>
                  <MaterialIcon icon={link.icon} className={`text-2xl ${isActive ? 'text-primary-400' : 'group-hover:text-on-surface'}`} />
                  <span className="text-base">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:[background:var(--sidebar-hover-bg)] hover:text-on-surface transition-all duration-200 group ${isActive ? 'bg-primary-500/10 text-primary-400 font-medium border border-primary-500/20' : 'border border-transparent'}`
              }
            >
              {({ isActive }) => (
                <>
                  <MaterialIcon icon="admin_panel_settings" className={`text-2xl ${isActive ? 'text-primary-400' : 'group-hover:text-on-surface'}`} />
                  <span className="text-base">Admin Panel</span>
                </>
              )}
            </NavLink>
          )}
        </nav>

        <nav className="px-3 space-y-1.5">
          <div className="px-4 mb-3 text-sm font-mono text-on-surface-variant/60 uppercase tracking-widest">System</div>
          {secondaryLinks.map((link) =>
            link.to === '#settings' ? (
              <button
                key={link.to}
                onClick={() => { setSettingsOpen(true); onClose(); }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:[background:var(--sidebar-hover-bg)] hover:text-on-surface transition-all duration-200 group border border-transparent w-full text-left cursor-pointer"
              >
                <MaterialIcon icon={link.icon} className="text-2xl group-hover:text-on-surface" />
                <span className="text-base">{link.label}</span>
              </button>
            ) : (
              <div
                key={link.to}
                className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant/60 hover:[background:var(--sidebar-hover-bg)] hover:text-on-surface/50 transition-all duration-200 group cursor-not-allowed"
                title="Coming Soon"
              >
                <MaterialIcon icon={link.icon} className="text-2xl" />
                <span className="text-base">{link.label}</span>
              </div>
            )
          )}
        </nav>
      </div>

    </aside>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
