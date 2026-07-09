import { useState } from 'react';
import {
  Send, Bot, Shield, MapPin, ChevronDown, ChevronUp, Check, AlertTriangle, Loader2,
  Hospital, Home, Building2, Flame, Pill,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { AIRecommendationResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low:       { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Low' },
  moderate:  { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Moderate' },
  high:      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'High' },
  critical:  { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Critical' },
};
const UNKNOWN_RISK = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Unknown' };

const DEST_ICONS: Record<string, React.ReactNode> = {
  hospital:        <Hospital className="h-6 w-6" />,
  shelter:         <Home className="h-6 w-6" />,
  school:          <Building2 className="h-6 w-6" />,
  community_centre: <Building2 className="h-6 w-6" />,
  police:          <Shield className="h-6 w-6" />,
  firestation:     <Flame className="h-6 w-6" />,
  fire_station:    <Flame className="h-6 w-6" />,
  pharmacy:        <Pill className="h-6 w-6" />,
};

const DEST_LABELS: Record<string, string> = {
  hospital:         'Hospital',
  shelter:          'Shelter',
  school:           'School',
  community_centre: 'Community Centre',
  police:           'Police Station',
  firestation:      'Fire Station',
  fire_station:     'Fire Station',
  pharmacy:         'Pharmacy',
};

const EXAMPLE_QUESTIONS = [
  'Is it safe to stay here?',
  'Should I evacuate?',
  'Where is the nearest safe place?',
  'What should I do if flooding starts?',
  'Is it safe to travel?',
];

export default function AIAssistant() {
  const { position } = useGeolocation({ watch: false });
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIRecommendationResponse | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: { question: string; lat?: number; lng?: number } = { question: q };
      if (position) {
        body.lat = position.lat;
        body.lng = position.lng;
      }
      const resp = await aiApi.recommend(body);
      setResult(resp.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const riskKey = (result?.riskLevel ?? '').toLowerCase();
  const riskStyle = RISK_STYLES[riskKey] || UNKNOWN_RISK;

  const destType = (result?.recommendedDestination?.type ?? '').toLowerCase();
  const destIcon = DEST_ICONS[destType];
  const destLabel = DEST_LABELS[destType] || result?.recommendedDestination?.type || 'Location';

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary-500" />
        AI Decision Support
      </h2>

      <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
        <MapPin className="h-3.5 w-3.5" />
        {position
          ? <>Current Location: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</>
          : <span className="text-gray-400">Location unavailable</span>
        }
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about evacuations, safe routes, resource allocation..."
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !question.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Analyze
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-8">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-sm text-gray-500">Analyzing your situation...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={handleSubmit} className="btn-primary cursor-pointer">Try Again</button>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="flex flex-col items-center py-8 text-center">
          <Bot className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">Ask anything about your safety.</p>
          <div className="space-y-1.5">
            {EXAMPLE_QUESTIONS.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuestion(ex); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && result && (
        <div className="space-y-5">

          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${riskStyle.bg} ${riskStyle.border}`}>
            <Shield className={`h-6 w-6 ${riskStyle.text}`} />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Level</p>
              <p className={`text-lg font-bold ${riskStyle.text}`}>{riskStyle.label}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          {result.recommendedDestination && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                {destIcon || <MapPin className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase tracking-wider font-medium">{destLabel}</p>
                <p className="text-sm font-semibold text-gray-900">{result.recommendedDestination.name}</p>
              </div>
            </div>
          )}

          {result.reason && (
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reason</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.reason}</p>
            </div>
          )}

          {result.actions.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recommended Actions</p>
              <ul className="space-y-2">
                {result.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExplainOpen(!explainOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span>How this recommendation was generated</span>
              {explainOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {explainOpen && (
              <div className="px-4 py-3 space-y-2 text-sm text-gray-600">
                {[ 'Weather Agent', 'Alert Agent', 'Infrastructure Agent', 'Route Agent', 'Gemini Coordinator' ].map((agent) => (
                  <div key={agent} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    {agent}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Powered by</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400" /> OpenWeather</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400" /> IMD / NDMA CAP Alerts</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400" /> OpenStreetMap</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400" /> Gemini</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
