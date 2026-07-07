import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        <p className="text-lg text-gray-500 mb-6">Page not found</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
