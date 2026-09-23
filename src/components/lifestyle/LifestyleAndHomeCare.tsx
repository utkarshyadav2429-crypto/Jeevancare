import React, { useState, useEffect } from 'react';
import {
  Heart,
  Wind,
  Smile,
  Moon,
  Footprints,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Droplet
} from 'lucide-react';
import { HomeCareGuide } from '../../types';
import { initialHomeCareGuides } from '../../data/initialData';
import { WellnessRoutines } from './WellnessRoutines';
import { HomeRemedyAssistant } from './HomeRemedyAssistant';
import { AIMeditationCoach } from './AIMeditationCoach';

interface LifestyleAndHomeCareProps {
  homeCareGuides?: HomeCareGuide[];
  setActiveTab: (tab: string) => void;
  onOpenEmergency: () => void;
}

export const LifestyleAndHomeCare: React.FC<LifestyleAndHomeCareProps> = ({
  homeCareGuides = initialHomeCareGuides,
  setActiveTab,
  onOpenEmergency,
}) => {
  const [subTab, setSubTab] = useState<'wellness' | 'homecare' | 'mental' | 'chronic'>('wellness');
  const [selectedGuide, setSelectedGuide] = useState<HomeCareGuide>(homeCareGuides[0]);

  // Breathing Exercise State
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Journaling state
  const [journalEntry, setJournalEntry] = useState('');
  const [savedEntries, setSavedEntries] = useState<string[]>([
    'Practiced 10 mins diaphragmatic breathing today. Felt calm and respiratory tightness lessened.'
  ]);

  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else {
              setBreathPhase('Inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalEntry.trim()) return;
    setSavedEntries((prev) => [journalEntry, ...prev]);
    setJournalEntry('');
  };

  return (
    <div className="space-y-6">

      {/* Header & Subtab Switcher */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lifestyle Improvement & Home Care Guides</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evidence-informed self-care advice, guided diaphragmatic breathing, mental wellness, and chronic habit management.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setSubTab('wellness')}
            className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === 'wellness'
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Wellness & Yoga Routines
          </button>
          <button
            onClick={() => setSubTab('homecare')}
            className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === 'homecare'
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Home Care Guides
          </button>
          <button
            onClick={() => setSubTab('mental')}
            className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === 'mental'
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mental Health & Breathing
          </button>
          <button
            onClick={() => setSubTab('chronic')}
            className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === 'chronic'
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Chronic Care Habits
          </button>
        </div>
      </div>

      {subTab === 'wellness' ? (
        <div className="space-y-6">
          <AIMeditationCoach />
          <WellnessRoutines />
        </div>
      ) : subTab === 'homecare' ? (
        /* Home Care Guides Subtab */
        <div className="space-y-6">
          <HomeRemedyAssistant onOpenEmergency={onOpenEmergency} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Guide Selector List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Common Mild Ailments</h3>
            <div className="space-y-2">
              {homeCareGuides.map((guide) => {
                const isSelected = selectedGuide.id === guide.id;
                return (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-300 dark:border-pink-700 shadow-xs font-bold text-pink-900 dark:text-pink-200'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{guide.condition}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Guide View (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
              
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                  {selectedGuide.category}
                </span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-2">
                  {selectedGuide.condition}
                </h3>
              </div>

              {/* Home Care Options */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Safe Home Care Options
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {selectedGuide.homeCareOptions.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>

              {/* When to Consult Doctor */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> When to Consult a Qualified Doctor
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-700 dark:text-amber-300/90">
                  {selectedGuide.whenToConsultDoctor.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>

              {/* Emergency Warning Signs */}
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Red Flag Emergency Warning Signs
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs">
                  {selectedGuide.emergencyWarningSigns.map((em, i) => (
                    <li key={i}>{em}</li>
                  ))}
                </ul>
                <button
                  onClick={onOpenEmergency}
                  className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Open Emergency SOS
                </button>
              </div>

            </div>
          </div>

        </div>
        </div>
      ) : subTab === 'mental' ? (
        /* Mental Health & Breathing Subtab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Interactive Guided Breathing Circle ⭐ */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col items-center justify-between min-h-[380px]">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                4-7-8 Relaxation Loop
              </span>
              <h3 className="text-lg font-bold">Diaphragmatic Breathing Circle</h3>
            </div>

            {/* Pulsing Circle */}
            <div className="relative my-8 flex items-center justify-center">
              <div
                className={`w-44 h-44 rounded-full border-4 border-teal-400/40 flex items-center justify-center transition-all duration-1000 ${
                  isBreathingActive && breathPhase === 'Inhale'
                    ? 'scale-125 bg-teal-500/20 shadow-2xl shadow-teal-500/50'
                    : isBreathingActive && breathPhase === 'Hold'
                    ? 'scale-125 bg-amber-500/20 shadow-2xl shadow-amber-500/50'
                    : 'scale-100 bg-indigo-500/10'
                }`}
              >
                <div className="text-center">
                  <span className="text-xl font-extrabold block text-teal-300">{breathPhase}</span>
                  <span className="text-3xl font-black font-mono mt-1 block">{breathSeconds}s</span>
                </div>
              </div>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
            >
              {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isBreathingActive ? 'Pause Exercise' : 'Start Breathing Exercise'}</span>
            </button>
          </div>

          {/* Journaling & Reflection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-pink-500" />
              Daily Reflection & Stress Log
            </h3>

            <form onSubmit={handleSaveJournal} className="space-y-3 text-xs">
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How are you feeling today? Record any stress, relaxation milestones, or sleep quality notes..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save Reflection
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Past Reflections:</span>
              {savedEntries.map((e, idx) => (
                <p key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 italic">
                  "{e}"
                </p>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Chronic Care Habits Subtab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-600 font-bold">
              <Footprints className="w-5 h-5" /> Diabetes & Blood Sugar
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>30-minute daily brisk walk after meals.</li>
              <li>Include fiber-rich greens, cut refined carbs.</li>
              <li>Hydrate with 3L water daily.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <Activity className="w-5 h-5" /> Blood Pressure & Heart
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>DASH diet low-sodium food choices.</li>
              <li>Limit caffeinated & processed items.</li>
              <li>Monitor resting BP twice weekly.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-pink-600 font-bold">
              <Moon className="w-5 h-5" /> Sleep Hygiene & Stress
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>No screens 45 mins before bedtime.</li>
              <li>Maintain consistent sleep-wake schedule.</li>
              <li>Warm evening herbal chamomile tea.</li>
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};
