import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stitch-surface flex items-center justify-center p-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-on-surface-variant/30 mb-2 font-display">404</h1>
        <p className="text-lg text-on-surface-variant mb-6">Page not found</p>
        <Link to="/">
          <Button variant="primary" icon={<Home className="h-4 w-4" />}>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
