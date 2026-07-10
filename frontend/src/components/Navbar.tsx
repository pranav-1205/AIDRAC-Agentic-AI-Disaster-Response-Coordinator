import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MaterialIcon from './ui/MaterialIcon';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-[60px] z-30 pointer-events-none">
      <div className="h-full flex items-center justify-between px-5 lg:px-7 pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 rounded-lg [background:var(--card-bg-hover)] hover:[background:var(--card-bg-hover)] border border-[var(--card-border)] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <MaterialIcon icon="menu" className="text-xl" />
          </button>
          <span className="text-base font-mono text-on-surface-variant tabular-nums tracking-wider">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {user?.full_name}
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold text-base shadow-glow border-2 border-[var(--card-border)] shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
