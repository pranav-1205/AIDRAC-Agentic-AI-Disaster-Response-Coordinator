import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Building2,
  Stethoscope,
  Bell,
  Shield,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: Map, label: 'Interactive Map' },
  { to: '/shelters', icon: Building2, label: 'Shelters' },
  { to: '/hospitals', icon: Stethoscope, label: 'Hospitals' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <NavLink to="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-emergency-400" />
          <div>
            <h1 className="text-lg font-bold">AIDRAC</h1>
            <p className="text-xs text-gray-400">Disaster Response</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Shield className="h-5 w-5" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavLink to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <Home className="h-4 w-4" />
          Home
        </NavLink>
      </div>
    </aside>
  );
}
