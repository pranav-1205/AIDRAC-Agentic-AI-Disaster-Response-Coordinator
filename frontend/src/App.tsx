import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import Shelters from './pages/Shelters';
import Hospitals from './pages/Hospitals';
import AlertsPage from './pages/AlertsPage';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function ProtectedLayout({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedLayout>
            <MapPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shelters"
        element={
          <ProtectedLayout>
            <Shelters />
          </ProtectedLayout>
        }
      />
      <Route
        path="/hospitals"
        element={
          <ProtectedLayout>
            <Hospitals />
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedLayout>
            <AlertsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedLayout requireAdmin>
            <Admin />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
