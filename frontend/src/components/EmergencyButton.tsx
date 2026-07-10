import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmergencyButton() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full">
      <button
        onClick={() => navigate('/map')}
        className="w-full flex items-center justify-center gap-2 bg-danger-600 text-white px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-danger-500 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
        <Phone className="h-5 w-5" />
        <span className="font-bold tracking-wide">Emergency SOS</span>
      </button>
    </div>
  );
}
