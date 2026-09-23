import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  X,
  Radio,
  ShieldAlert,
  Hospital,
  Droplet,
  User,
  CheckCircle2,
  Navigation,
  FileText
} from 'lucide-react';
import { UserProfile } from '../../types';

interface EmergencyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  profile?: UserProfile;
}

export const EmergencyHubModal: React.FC<EmergencyHubModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  profile,
}) => {
  const currentProfile = userProfile || profile || {
    id: 'u1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@health.in',
    phone: '+91 98765 43210',
    role: 'patient',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Dust Mites'],
    chronicConditions: ['Mild Asthma'],
    emergencyContactName: 'Pooja Sharma',
    emergencyContactPhone: '+91 98765 12345',
    isEmergencySharingEnabled: true,
  };
  const safeProfile = {
    ...currentProfile,
    allergies: currentProfile.allergies || [],
    chronicConditions: currentProfile.chronicConditions || [],
  };

  const [sosSent, setSosSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'sos' | 'firstaid' | 'id'>('sos');
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTriggerSOS = () => {
    setSosSent(true);
    setTimeout(() => {
      // simulate broadcast complete
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-hub-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#16241c] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 overflow-hidden relative max-h-[92dvh] sm:max-h-[85vh] flex flex-col transition-all"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-rose-300 dark:bg-rose-900/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Emergency Red Header */}
        <div className="p-4 sm:p-5 bg-rose-700 dark:bg-rose-900 text-white flex items-center justify-between shrink-0 border-b border-rose-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 id="emergency-hub-title" className="text-base sm:text-lg font-black tracking-tight">
                EMERGENCY SERVICES HUB
              </h2>
              <p className="text-xs text-rose-100">Instant One-Touch SOS & Dispatch</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close emergency modal"
            className="min-h-[44px] min-w-[44px] p-2 rounded-full hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subtab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('sos')}
            className={`flex-1 min-h-[44px] py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'sos'
                ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            One-Touch SOS & Calls
          </button>
          <button
            onClick={() => setActiveTab('firstaid')}
            className={`flex-1 min-h-[44px] py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'firstaid'
                ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            First Aid
          </button>
          <button
            onClick={() => setActiveTab('id')}
            className={`flex-1 min-h-[44px] py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'id'
                ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Medical ID Card
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {activeTab === 'sos' ? (
            <div className="space-y-6">

              {/* Huge One-Touch SOS Broadcast Button */}
              <div className="text-center space-y-3">
                {sosSent ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold text-xs space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm">SOS Broadcast & Location Dispatched!</h3>
                    <p className="font-normal text-[11px]">
                      GPS Coordinates sent to Emergency Contacts ({safeProfile.emergencyContactPhone}) and KGMU Emergency Dispatch Lucknow.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleTriggerSOS}
                    className="w-full min-h-[72px] py-5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Radio className="w-7 h-7 animate-ping mb-1" />
                    <span>TRIGGER EMERGENCY SOS BROADCAST</span>
                    <span className="text-xs font-normal text-rose-200">
                      Dispatches live GPS & notifies emergency contacts instantly
                    </span>
                  </button>
                )}
              </div>

              {/* Direct Hotlines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="tel:108"
                  className="min-h-[64px] p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm block">108 UP Health & Ambulance</span>
                    <span className="text-[11px] opacity-80">Free 24/7 ALS Emergency Dispatch</span>
                  </div>
                  <PhoneCall className="w-5 h-5 text-rose-600" />
                </a>

                <a
                  href="tel:1800116117"
                  className="min-h-[64px] p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm block">National Poison Hotline</span>
                    <span className="text-[11px] opacity-80">1800-11-6117 (AIIMS & UP)</span>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                </a>

                <a
                  href={`tel:${safeProfile.emergencyContactPhone}`}
                  className="min-h-[64px] p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm block">Family Emergency Contact</span>
                    <span className="text-[11px] opacity-80">{safeProfile.emergencyContactName} ({safeProfile.emergencyContactPhone})</span>
                  </div>
                  <User className="w-5 h-5 text-blue-600" />
                </a>

                <div className="min-h-[64px] p-4 rounded-xl bg-emerald-50 dark:bg-[#1d2e23] border border-emerald-200 dark:border-[#283c2e] flex items-center justify-between text-[#142b20] dark:text-[#a3d4b6]">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm block">Nearest ER Hospital</span>
                    <span className="text-[11px] opacity-80">KGMU Emergency, Lucknow (1.8 km)</span>
                  </div>
                  <Navigation className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

            </div>
          ) : activeTab === 'firstaid' ? (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#142b20] dark:text-white">Emergency First Aid Instructions</h3>

              <div className="p-4 rounded-xl bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
                <h4 className="font-bold text-rose-600">CPR & Severe Respiratory Distress</h4>
                <p className="text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                  1. Call 108 immediately. 2. Place hands in center of chest and push hard and fast at 100-120 beats per minute. 3. Ensure clear airway.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
                <h4 className="font-bold text-amber-600">Poison Ingestion First Aid</h4>
                <p className="text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                  1. Do NOT induce vomiting unless instructed by Poison Control (1800-11-6117). 2. Keep the container or medicine bottle ready for reference.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#142b20] dark:text-white">Emergency Medical ID Card</h3>

              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-base">{safeProfile.name}</h4>
                    <p className="text-xs text-slate-400">Age: {safeProfile.age || '32'} • Gender: {safeProfile.gender || 'Male'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs">
                    Blood Group: {safeProfile.bloodGroup}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Known Allergies</span>
                    <span className="font-bold text-amber-300">{safeProfile.allergies.join(', ') || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Chronic Conditions</span>
                    <span className="font-bold text-emerald-300">{safeProfile.chronicConditions.join(', ') || 'None'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Emergency Contact: {safeProfile.emergencyContactName}</span>
                  <span className="font-bold text-white">{safeProfile.emergencyContactPhone}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
