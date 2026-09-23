import React, { useState } from 'react';
import { Sparkles, Search, ShieldAlert, CheckCircle2, AlertTriangle, Stethoscope, RefreshCw, Lightbulb } from 'lucide-react';

interface HomeRemedyData {
  remedyTitle: string;
  overview: string;
  practicalSteps: string[];
  whatToAvoid: string[];
  whenToSeekDoctor: string[];
  disclaimer: string;
}

interface HomeRemedyAssistantProps {
  onOpenEmergency?: () => void;
}

export const HomeRemedyAssistant: React.FC<HomeRemedyAssistantProps> = ({ onOpenEmergency }) => {
  const [query, setQuery] = useState('');
  const [remedyData, setRemedyData] = useState<HomeRemedyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const quickTopics = [
    'Sore Throat & Cough',
    'Mild Acidity & Indigestion',
    'Tension Headache',
    'Mild Nasal Congestion',
    'Sleep Restlessness'
  ];

  const handleSearch = async (searchTerm?: string) => {
    const q = searchTerm || query;
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch('/api/gemini/home-remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRemedyData(json.data);
      }
    } catch (err) {
      console.error('Home remedy error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">AI Home Remedy Assistant</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
              Low-Risk Self-Care
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ask about safe, low-risk home practices for mild discomforts with evidence-informed safety boundaries.
          </p>
        </div>
      </div>

      {/* Quick Topic Chips */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Popular Care Topics</label>
        <div className="flex flex-wrap gap-2">
          {quickTopics.map((topic, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(topic);
                handleSearch(topic);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-all cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Natural Language Query Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question (e.g., 'What can I do for a mild dry cough at home?')..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
        </button>
      </form>

      {/* Results View */}
      {loading && (
        <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Evaluating low-risk home practices & medical safety guardrails...</p>
        </div>
      )}

      {!loading && remedyData && (
        <div className="space-y-5 bg-slate-50/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Self-Care Protocol
            </span>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mt-1.5">
              {remedyData.remedyTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
              {remedyData.overview}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Practical Steps */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Safe Action Steps
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {remedyData.practicalSteps?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Avoid */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-2">
              <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> What to Avoid
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {remedyData.whatToAvoid?.map((avoid, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{avoid}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* When to Seek Doctor */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
            <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-amber-600" /> When Professional Medical Evaluation is Required
            </h5>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 dark:text-amber-300/90">
              {remedyData.whenToSeekDoctor?.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {remedyData.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
