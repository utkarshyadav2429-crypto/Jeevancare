import React from 'react';
import { Award, Clock, Sparkles, CheckCircle2, ArrowRight, RotateCcw, Heart } from 'lucide-react';
import { YogaPoseDefinition } from '../utils/YogaPostureEngine';

export interface YogaSessionSummaryData {
  pose: YogaPoseDefinition;
  durationSeconds: number;
  overallScore: number;
  goodPosturePercentage: number;
  strongestArea: string;
  focusArea: string;
  feedbackHighlights: string[];
}

interface YogaSessionSummaryProps {
  summary: YogaSessionSummaryData;
  onPracticeAgain: () => void;
  onClose: () => void;
}

export const YogaSessionSummary: React.FC<YogaSessionSummaryProps> = ({
  summary,
  onPracticeAgain,
  onClose,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 90) return { label: 'Excellent Alignment', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-700/60' };
    if (score >= 75) return { label: 'Good Posture Control', color: 'text-teal-400', bg: 'bg-teal-950/60 border-teal-700/60' };
    if (score >= 60) return { label: 'Almost There', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-700/60' };
    return { label: 'Steady Practice', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };
  };

  const scoreBadge = getScoreInterpretation(summary.overallScore);

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-300 my-auto">
      {/* Header */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Session Complete 🧘
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {summary.pose.name} • <span className="font-serif italic text-emerald-400">{summary.pose.sanskritName}</span>
        </p>
      </div>

      {/* Main Score & Duration Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/70 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overall Posture</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {summary.overallScore}%
          </div>
          <span className={`inline-block mt-1.5 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBadge.bg} ${scoreBadge.color}`}>
            {scoreBadge.label}
          </span>
        </div>

        <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/70 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Duration</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {formatTime(summary.durationSeconds)}
          </div>
          <span className="inline-block mt-1.5 text-[10px] sm:text-xs text-slate-400">
            {summary.goodPosturePercentage}% in good alignment
          </span>
        </div>
      </div>

      {/* Highlights & Insights */}
      <div className="bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-700/60 space-y-3 mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Your Highlights
        </h4>
        
        <div className="flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-white">Strongest Area: </span>
            <span className="text-slate-300">{summary.strongestArea}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs sm:text-sm">
          <ArrowRight className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-white">Focus Next Time: </span>
            <span className="text-slate-300">{summary.focusArea}</span>
          </div>
        </div>

        {summary.feedbackHighlights.length > 0 && (
          <div className="pt-2 border-t border-slate-700/50 flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
            <Heart className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1">{summary.feedbackHighlights[0]}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onPracticeAgain}
          aria-label="Practice this pose again"
          className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Again</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to yoga and wellness routines"
          className="flex-1 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
        >
          <span>Back to Routines</span>
        </button>
      </div>
    </div>
  );
};
