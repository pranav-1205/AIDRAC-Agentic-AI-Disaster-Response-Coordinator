import { useState } from 'react';
import { Send, Bot, AlertTriangle, Shield, MapPin, ListChecks } from 'lucide-react';
import { aiApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { AIRecommendationResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function AIAssistant() {
  const { position } = useGeolocation({ watch: false });
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIRecommendationResponse | null>(null);

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

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary-500" />
        AI Decision Support
      </h2>

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
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${RISK_COLORS[result.riskLevel] || 'bg-gray-100 text-gray-700'}`}>
            <Shield className="h-4 w-4" />
            Risk Level: {result.riskLevel}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>

          {result.recommendedDestination && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-gray-700">
                <strong>Recommended:</strong> {result.recommendedDestination.name}
                <span className="text-gray-400 ml-1">({result.recommendedDestination.type})</span>
              </span>
            </div>
          )}

          {result.reason && (
            <p className="text-xs text-gray-500 italic">{result.reason}</p>
          )}

          {result.actions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> Recommended Actions
              </h4>
              <ol className="space-y-1">
                {result.actions.map((action, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
