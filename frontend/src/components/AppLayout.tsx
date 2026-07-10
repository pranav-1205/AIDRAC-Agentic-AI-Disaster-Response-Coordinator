import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import EmergencyButton from './EmergencyButton';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[280px]">
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-5 lg:p-7 pt-[60px] w-full">
          {children}
        </main>
      </div>

      {/* Floating Emergency SOS */}
      <div className="fixed bottom-6 left-6 z-50 w-48">
        <EmergencyButton />
      </div>
    </div>
  );
}
