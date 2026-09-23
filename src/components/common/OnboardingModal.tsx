import React, { useState } from 'react';
import {
  Sparkles,
  Pill,
  Activity,
  FolderLock,
  Bot,
  CheckCircle2,
  X,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Heart,
  Camera,
  MapPin,
  Lock,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { profile, updateProfileState } = useAuth();
  const [step, setStep] = useState(0);

  // User onboarding preferences state
  const [selectedFocus, setSelectedFocus] = useState<string>('medication');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(profile?.bloodGroup || 'O+');
  const [hasAllergies, setHasAllergies] = useState<boolean>(false);
  const [allergyInput, setAllergyInput] = useState<string>('');

  if (!isOpen) return null;

  const healthGoals = [
    {
      id: 'medication',
      title: 'Smart Medication Schedule',
      subtitle: 'Prescription OCR, dose reminders & interaction alerts',
      icon: Pill,
      targetTab: 'medicine',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      id: 'records',
      title: 'Encrypted Health Vault',
      subtitle: 'AES-256 digital storage for lab reports & ABHA ID',
      icon: FolderLock,
      targetTab: 'vault',
      color: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    },
    {
      id: 'vitals',
      title: 'Chronic Care & Vitals',
      subtitle: 'BP, Glucose, Heart rate trends & AI progress insights',
      icon: Activity,
      targetTab: 'progress',
      color: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    },
    {
      id: 'ai_wellness',
      title: 'AI Health Coach & Yoga',
      subtitle: 'Voice clinical queries, real-time posture AI & diet guidance',
      icon: Bot,
      targetTab: 'assistant',
      color: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
    }
  ];

  const handleCompleteSetup = () => {
    // Save onboarding preferences
    const updatedAllergies = hasAllergies && allergyInput.trim()
      ? [allergyInput.trim()]
      : (profile?.allergies || []);

    updateProfileState({
      bloodGroup: selectedBloodGroup,
      allergies: updatedAllergies,
    });

    const targetGoal = healthGoals.find(g => g.id === selectedFocus);
    if (targetGoal) {
      onNavigateTab(targetGoal.targetTab);
    } else {
      onNavigateTab('dashboard');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#fcfaf6] dark:bg-[#15231b] w-full max-w-lg rounded-3xl shadow-2xl border border-[#e6dfd3] dark:border-[#233529] overflow-hidden relative flex flex-col">
        
        {/* Top Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-[#1b3b2b] via-[#244836] to-[#122319] text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15">
              Personalized Setup • Step {step + 1} of 3
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3">
            <h2 className="text-xl font-bold font-serif-editorial text-white tracking-tight">
              {step === 0 && 'What is your primary health goal?'}
              {step === 1 && 'Quick Baseline Health Profile'}
              {step === 2 && 'Privacy, Permissions & Cloud Security'}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              {step === 0 && 'Select your focus area so Jevan Care can personalize your daily dashboard.'}
              {step === 1 && 'Optional emergency basics to keep your digital health card up to date.'}
              {step === 2 && 'Zero unsolicited tracking. Permissions are only requested when you use a feature.'}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4 text-xs text-[#1b3b2b] dark:text-[#f2f0e8]">
          
          {/* STEP 0: Focus Area */}
          {step === 0 && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#827b6c]">
                Select Your Focus:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {healthGoals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedFocus === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedFocus(goal.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#1b3b2b] dark:border-emerald-400 bg-white dark:bg-[#1a2d23] shadow-md ring-2 ring-[#1b3b2b]/15'
                          : 'border-[#e6dfd3] dark:border-[#233529] bg-white/70 dark:bg-[#15231b] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${goal.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1b3b2b] dark:text-emerald-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#1b3b2b] dark:text-white">{goal.title}</h4>
                        <p className="text-[11px] text-[#827b6c] dark:text-slate-400 mt-0.5 leading-snug">{goal.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Quick Baseline Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#827b6c] mb-2">
                  Blood Group:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBloodGroup(bg)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedBloodGroup === bg
                          ? 'bg-[#1b3b2b] text-white border-[#1b3b2b] shadow-xs'
                          : 'bg-white dark:bg-[#1a2d23] border-[#e6dfd3] dark:border-[#233529] text-[#5c5647] hover:bg-[#f6f2e9]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1b3b2b] dark:text-white">
                  <input
                    type="checkbox"
                    checked={hasAllergies}
                    onChange={(e) => setHasAllergies(e.target.checked)}
                    className="rounded border-[#e6dfd3] text-[#1b3b2b] focus:ring-[#1b3b2b]"
                  />
                  <span>I have known drug or food allergies</span>
                </label>

                {hasAllergies && (
                  <div className="pl-6 animate-in fade-in">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="e.g. Penicillin, Sulfa, Peanuts"
                      className="w-full p-2.5 bg-white dark:bg-[#1a2d23] border border-[#e6dfd3] dark:border-[#233529] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1b3b2b]"
                    />
                    <p className="text-[10px] text-[#827b6c] mt-1">
                      Our medicine scanner will automatically cross-check prescription salts against your allergies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Privacy & On-Demand Permissions */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2d23] border border-[#e6dfd3] dark:border-[#233529] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1b3b2b] dark:text-white">AES-256 Cloud Vault Encryption</h4>
                  <p className="text-[11px] text-[#827b6c] dark:text-slate-400 mt-0.5 leading-snug">
                    Your medical prescriptions and lab reports are encrypted. Only you hold access permissions.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2d23] border border-[#e6dfd3] dark:border-[#233529] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1b3b2b] dark:text-white">Camera on Demand Only</h4>
                  <p className="text-[11px] text-[#827b6c] dark:text-slate-400 mt-0.5 leading-snug">
                    Used strictly when you scan a handwritten prescription or start real-time AI yoga posture tracking.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2d23] border border-[#e6dfd3] dark:border-[#233529] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1b3b2b] dark:text-white">Nearby Hospital Coordinates</h4>
                  <p className="text-[11px] text-[#827b6c] dark:text-slate-400 mt-0.5 leading-snug">
                    Google Maps Places GPS is only checked when locating nearby 24/7 pharmacies or blood banks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#1b3b2b] dark:bg-emerald-400' : 'w-2 bg-[#e6dfd3] dark:bg-[#233529]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#f6f2e9] dark:bg-[#121e17] border-t border-[#e6dfd3] dark:border-[#233529] flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 text-xs font-bold text-[#5c5647] hover:text-[#1b3b2b] dark:text-slate-400 dark:hover:text-white"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-[#827b6c] hover:text-[#1b3b2b] dark:text-slate-400"
            >
              Skip Setup
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#244836] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleCompleteSetup}
                className="px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#244836] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Launch My Dashboard</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

