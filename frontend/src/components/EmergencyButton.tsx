import { Phone } from 'lucide-react';

export default function EmergencyButton() {
  return (
    <a
      href="tel:112"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all animate-bounce"
    >
      <Phone className="h-5 w-5" />
      <span className="font-bold">Emergency: 112</span>
    </a>
  );
}
