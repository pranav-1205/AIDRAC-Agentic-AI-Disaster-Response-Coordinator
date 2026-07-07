import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Shield className="h-7 w-7 text-emergency-500" />
        <span className="text-xl font-bold text-primary-900">AIDRAC</span>
      </Link>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
            Admin
          </span>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user?.full_name}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-emergency-500 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
