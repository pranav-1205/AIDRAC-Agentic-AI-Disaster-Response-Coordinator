import { Link } from 'react-router-dom';
import { Shield, MapPin, Bell, Users, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmergencyButton from '../components/EmergencyButton';

const features = [
  {
    icon: MapPin,
    title: 'Real-time Mapping',
    description: 'Interactive maps showing shelters, hospitals, and disaster zones.',
  },
  {
    icon: Bell,
    title: 'Emergency Alerts',
    description: 'Instant notifications about disasters and evacuation orders.',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Coordinates relief efforts and connects survivors with resources.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-emergency-500" />
            <span className="text-2xl font-bold text-primary-900">AIDRAC</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="h-4 w-4" />
            Emergency Response System
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-primary-900 leading-tight mb-6">
            AI-Powered Disaster
            <br />
            <span className="text-emergency-500">Response Coordinator</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Helping citizens during natural disasters with safe evacuation routes, nearby shelters,
            hospitals, weather information, and emergency alerts.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <a href="tel:112" className="btn-emergency flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency: 112
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary-900 text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card text-center">
                <div className="inline-flex p-3 rounded-lg bg-primary-100 text-primary-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-primary-900 text-gray-400 py-8 text-center">
        <p>&copy; {new Date().getFullYear()} AIDRAC. All rights reserved.</p>
      </footer>

      <EmergencyButton />
    </div>
  );
}
