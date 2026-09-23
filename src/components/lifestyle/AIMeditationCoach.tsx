import React, { useState } from 'react';
import { Wind, Sparkles, Play, Clock, Heart, Volume2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AIMeditationCoachProps {
  onStartRoutine?: (routineTitle: string) => void;
}

export const AIMeditationCoach: React.FC<AIMeditationCoachProps> = ({ onStartRoutine }) => {
  const [userRequest, setUserRequest] = useState('');
  const [duration, setDuration] = useState('10');
  const [stressLevel, setStressLevel] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);

  const promptOptions = [
    "I can't relax right now.",
    "Help me wind down before sleeping.",
    "I have 5 minutes and feel stressed.",
    "Need something for neck and desk fatigue."
  ];

  const handleConsultCoach = async (promptOverride?: string) => {
    const q = promptOverride || userRequest;
    if (!q.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/gemini/meditation-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: q,
          availableDuration: parseInt(duration),
          stressLevel
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRecommendation(json.data);
      }
    } catch (err) {
      console.error('Meditation coach error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-900/10 via-white to-pink-900/10 dark:from-[#132228] dark:via-[#172520] dark:to-[#221722] rounded-3xl p-6 border border-teal-200/80 dark:border-teal-800/60 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-teal-100 dark:border-teal-900/40">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
          <Wind className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">AI Guided Meditation & Breathing Coach</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
              Real Sessions Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Describe your mood, stress, or time limit. AI will match you directly to an existing mindfulness session in Jevan Care.
          </p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Quick Requests</label>
        <div className="flex flex-wrap gap-2">
          {promptOptions.map((option, i) => (
            <button
              key={i}
              onClick={() => {
                setUserRequest(option);
                handleConsultCoach(option);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 font-medium transition-all cursor-pointer"
            >
              "{option}"
            </button>
          ))}
        </div>
      </div>

      {/* Custom Request Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Time Available</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value="5">5 Minutes (Quick Break)</option>
              <option value="10">10 Minutes (Standard)</option>
              <option value="15">15 Minutes (Deep Restorative)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Stress & Anxiety Level</label>
            <select
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value="Low">Low / Mindful Maintenance</option>
              <option value="Moderate">Moderate / Evening Fatigue</option>
              <option value="High">High / Overwhelmed & Tense</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            placeholder="Tell the coach how you feel (e.g. 'I need something soothing before sleeping')..."
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => handleConsultCoach()}
            disabled={loading || !userRequest.trim()}
            className="px-5 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Matching...' : 'Find Session'}</span>
          </button>
        </div>
      </div>

      {/* Recommendation Card */}
      {loading && (
        <div className="p-8 text-center space-y-2 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Matching your mood with existing breathwork and meditation routines...</p>
        </div>
      )}

      {!loading && recommendation && (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-teal-200 dark:border-teal-800/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                Recommended Session ({recommendation.suggestedDurationMins} Mins)
              </span>
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
                {recommendation.recommendedRoutineTitle}
              </h4>
            </div>
            {onStartRoutine && (
              <button
                onClick={() => onStartRoutine(recommendation.recommendedRoutineTitle)}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Now</span>
              </button>
            )}
          </div>

          <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-100/80 dark:border-teal-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-teal-800 dark:text-teal-300">Why this session? </span>
            {recommendation.reasoning}
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-300">
            "{recommendation.guidedIntroText}"
          </div>
        </div>
      )}

    </div>
  );
};
