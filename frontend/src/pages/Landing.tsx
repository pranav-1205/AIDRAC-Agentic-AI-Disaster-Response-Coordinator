import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmergencyButton from '../components/EmergencyButton';
import MaterialIcon from '../components/ui/MaterialIcon';

const features = [
  {
    icon: 'map',
    title: 'Real-time Mapping',
    description: 'Interactive maps showing shelters, hospitals, and disaster zones.',
    colSpan: 'md:col-span-2',
    color: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
  },
  {
    icon: 'crisis_alert',
    title: 'Emergency Alerts',
    description: 'Instant notifications about disasters and evacuation orders.',
    colSpan: 'md:col-span-1',
    color: 'text-danger-400 bg-danger-500/10 border-danger-500/20',
  },
  {
    icon: 'support_agent',
    title: 'AI Decision Support',
    description: 'Smart recommendations for safe routes and immediate actions based on telemetry.',
    colSpan: 'md:col-span-1',
    color: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
  },
  {
    icon: 'emergency_home',
    title: 'Resource Allocation',
    description: 'Coordinates relief efforts and connects survivors with resources.',
    colSpan: 'md:col-span-2',
    color: 'text-success-400 bg-success-500/10 border-success-500/20',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/20 blur-[100px] rounded-full pointer-events-none" />

      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <MaterialIcon icon="shield" className="text-white text-2xl" />
            </div>
            <div>
              <span className="text-xl font-bold text-white font-display tracking-wide">AIDRAC</span>
              <p className="text-sm text-slate-400 font-mono tracking-widest uppercase">Response Node</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="md">Launch Console</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors text-sm font-mono uppercase tracking-wider">
                  Access
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md">Initialize</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="px-6 py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-success-500/10 border border-success-500/30 text-success-400 px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase mb-8 shadow-glow">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              System Status: Operational
            </div>
            
            <h1 className="text-[4rem] sm:text-[5rem] font-bold font-display text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-tight mb-6 tracking-tight">
              Disaster Response
              <br />
              <span className="bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500 text-transparent">Coordination Matrix</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto px-4 font-mono tracking-tight">
              Real-time telemetry, AI-driven evacuation protocols, and critical infrastructure mapping for disaster survival.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" icon={<MaterialIcon icon="arrow_forward" />}>
                    Enter Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button variant="primary" size="lg" icon={<MaterialIcon icon="rocket_launch" />}>
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 border-t border-slate-800 py-24 relative z-10">
          <div className="px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-display text-white tracking-tight">Core Capabilities</h2>
              <p className="text-slate-400 mt-2 font-mono text-sm uppercase tracking-widest">System Modules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} variant="glass" padding="lg" className={`text-left group relative overflow-hidden ${feature.colSpan}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`inline-flex p-3 rounded-xl border mb-6 self-start ${feature.color}`}>
                      <MaterialIcon icon={feature.icon} className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-white mb-3">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mt-auto">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 py-8 text-center text-xs font-mono uppercase tracking-widest relative z-10">
        <p>&copy; {new Date().getFullYear()} AIDRAC. All rights reserved.</p>
      </footer>
    </div>
  );
}
