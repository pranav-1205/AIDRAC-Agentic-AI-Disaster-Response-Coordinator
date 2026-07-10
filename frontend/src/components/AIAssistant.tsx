import { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, Shield, MapPin, ChevronDown, ChevronUp, Check, AlertTriangle,
  Hospital, Home, Building2, Flame, Pill,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { AIRecommendationResponse } from '../types';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './ui/LoadingSpinner';

const RISK_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  low: 'default',
  moderate: 'info',
  high: 'warning',
  critical: 'danger',
};

const RISK_LABELS: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

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

interface AIAssistantProps {
  initialQuestion?: string;
  className?: string;
}

export default function AIAssistant({ initialQuestion, className = '' }: AIAssistantProps) {
  const { position } = useGeolocation({ watch: false });
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIRecommendationResponse | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const submittedRef = useRef<string>('');

  useEffect(() => {
    if (initialQuestion && initialQuestion !== submittedRef.current) {
      setQuestion(initialQuestion);
      submittedRef.current = initialQuestion;
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (question && question === submittedRef.current && submittedRef.current && !loading && !result && !error) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

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
  const riskVariant = RISK_VARIANTS[riskKey] || 'default';

  const destType = (result?.recommendedDestination?.type ?? '').toLowerCase();
  const destIcon = DEST_ICONS[destType];
  const destLabel = DEST_LABELS[destType] || result?.recommendedDestination?.type || 'Location';

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-5 text-sm text-on-surface-variant">
        <MapPin className="h-4 w-4" />
        {position
          ? <>Current Location: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</>
          : <span className="text-on-surface-variant/60">Location unavailable</span>
        }
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about evacuations, safe routes, resource allocation..."
          disabled={loading}
          className="w-full px-5 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-base text-on-surface placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:bg-slate-800/80 disabled:opacity-50 disabled:bg-slate-900"
        />
        <Button size="lg" onClick={handleSubmit} loading={loading} disabled={!question.trim()} icon={<Send className="h-5 w-5" />}>
          Analyze
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-8">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-base text-on-surface-variant">Analyzing your situation...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-danger-500 mb-3" />
          <p className="text-base text-on-surface mb-4">{error}</p>
          <Button variant="primary" size="md" onClick={handleSubmit}>Try Again</Button>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="flex flex-col items-center py-8 text-center">
          <Bot className="h-12 w-12 text-on-surface-variant/20 mb-4" />
          <p className="text-base font-medium text-on-surface-variant">Ask anything about your safety.</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">Quick actions above to get started.</p>
        </div>
      )}

      {!loading && !error && result && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-5 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <Shield className="h-6 w-6 text-primary-400" />
            <div>
              <p className="text-sm text-on-surface-variant uppercase tracking-wider">Risk Level</p>
              <Badge variant={riskVariant} size="md" className="mt-1.5">{RISK_LABELS[riskKey] || 'Unknown'}</Badge>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-stitch-surface border border-stitch-border">
            <p className="text-base text-on-surface leading-relaxed">{result.summary}</p>
          </div>

          {result.recommendedDestination && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                {destIcon || <MapPin className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm text-primary-400 uppercase tracking-wider font-medium">{destLabel}</p>
                <p className="text-base font-semibold text-on-surface">{result.recommendedDestination.name}</p>
              </div>
            </div>
          )}

          {result.reason && (
            <div className="p-5 rounded-xl bg-stitch-surface border border-stitch-border">
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Reason</p>
              <p className="text-base text-on-surface leading-relaxed">{result.reason}</p>
            </div>
          )}

          {result.actions.length > 0 && (
            <div className="p-5 rounded-xl bg-stitch-surface border border-stitch-border">
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Recommended Actions</p>
              <ul className="space-y-3">
                {result.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-on-surface">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-success-500/20 flex items-center justify-center mt-0.5">
                      <Check className="h-4 w-4 text-success-400" />
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border border-stitch-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExplainOpen(!explainOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left text-base font-medium text-on-surface bg-stitch-surface hover:bg-stitch-surface-hover transition-colors cursor-pointer"
            >
              <span>How this recommendation was generated</span>
              {explainOpen ? <ChevronUp className="h-5 w-5 text-on-surface-variant" /> : <ChevronDown className="h-5 w-5 text-on-surface-variant" />}
            </button>
            {explainOpen && (
              <div className="px-5 py-3.5 space-y-2 text-base text-on-surface-variant border-t border-stitch-border">
                {[ 'Weather Agent', 'Alert Agent', 'Infrastructure Agent', 'Route Agent', 'Gemini Coordinator' ].map((agent) => (
                  <div key={agent} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success-500" />
                    {agent}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stitch-border">
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">Powered by</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-500" /> OpenWeather</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-500" /> IMD / NDMA CAP Alerts</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-500" /> OpenStreetMap</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-500" /> Gemini</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
