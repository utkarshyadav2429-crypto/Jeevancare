import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Car,
  FileText,
  Clock,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Receipt,
  Star,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  UserProfile,
  MedBuddyBooking,
  UserRole
} from '../../types';
import { MedBuddyBookingWizard } from './MedBuddyBookingWizard';
import { MedBuddyLiveTrackingView } from './MedBuddyLiveTrackingView';
import { MedBuddyCompanionPortal } from './MedBuddyCompanionPortal';
import { MedBuddyAdminOperations } from './MedBuddyAdminOperations';
import { medbuddyService } from '../../services/medbuddyService';

interface MedBuddyLandingViewProps {
  userProfile: UserProfile;
  activeRole?: UserRole;
  onOpenEmergency: () => void;
}

export const MedBuddyLandingView: React.FC<MedBuddyLandingViewProps> = ({
  userProfile,
  activeRole = 'patient',
  onOpenEmergency,
}) => {
  const [viewMode, setViewMode] = useState<'patient' | 'companion' | 'admin'>(() => {
    if (activeRole === 'medbuddy') return 'companion';
    if (activeRole === 'admin') return 'admin';
    return 'patient';
  });

  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<MedBuddyBooking | null>(null);
  const [userBookings, setUserBookings] = useState<MedBuddyBooking[]>([]);

  // Load user bookings
  const loadUserBookings = async () => {
    const bookings = await medbuddyService.getUserBookings(userProfile.id || 'u_patient_default');
    setUserBookings(bookings);

    // If there is an active (in-progress) booking, auto-select it for tracking if none selected
    const active = bookings.find((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
    if (active && !activeTrackingBooking) {
      setActiveTrackingBooking(active);
    }
  };

  useEffect(() => {
    loadUserBookings();
  }, [userProfile.id]);

  // Handler when booking is created from wizard
  const handleBookingConfirmed = (booking: MedBuddyBooking) => {
    setIsBookingOpen(false);
    setActiveTrackingBooking(booking);
    loadUserBookings();
  };

  // Handler when tracking updates
  const handleBookingUpdated = (booking: MedBuddyBooking) => {
    setActiveTrackingBooking(booking);
    loadUserBookings();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* MODE SELECTOR BAR (Patient / Companion / Admin) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14231b] p-3 rounded-2xl border border-[#e6dfd3] dark:border-[#24382c] shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <HeartHandshake className="w-4 h-4" />
          </span>
          <span className="font-bold text-xs sm:text-sm text-[#142b20] dark:text-white">
            MedBuddy Healthcare Companion Portal
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#fcfaf6] dark:bg-[#1a2d22] p-1 rounded-xl border border-[#e6dfd3] dark:border-[#283d30]">
          <button
            onClick={() => setViewMode('patient')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'patient'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Patient View
          </button>
          <button
            onClick={() => setViewMode('companion')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'companion'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Companion Mode
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Admin Operations
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: COMPANION MODE
          ========================================================================= */}
      {viewMode === 'companion' && (
        <MedBuddyCompanionPortal />
      )}

      {/* =========================================================================
          VIEW MODE 2: ADMIN OPERATIONS
          ========================================================================= */}
      {viewMode === 'admin' && (
        <MedBuddyAdminOperations />
      )}

      {/* =========================================================================
          VIEW MODE 3: PATIENT VIEW
          ========================================================================= */}
      {viewMode === 'patient' && (
        <>
          {/* Active Live Tracking Modal / View */}
          {activeTrackingBooking && !['COMPLETED', 'CANCELLED'].includes(activeTrackingBooking.status) ? (
            <MedBuddyLiveTrackingView
              booking={activeTrackingBooking}
              onBookingUpdated={handleBookingUpdated}
              onClose={() => setActiveTrackingBooking(null)}
              onOpenEmergency={onOpenEmergency}
            />
          ) : isBookingOpen ? (
            /* Multi-step Booking Wizard */
            <MedBuddyBookingWizard
              userProfile={userProfile}
              onBookingConfirmed={handleBookingConfirmed}
              onCancel={() => setIsBookingOpen(false)}
              onOpenEmergency={onOpenEmergency}
            />
          ) : (
            /* Main Patient Landing & Info Hub */
            <div className="space-y-6">
              
              {/* HERO BANNER */}
              <section className="bg-gradient-to-br from-[#1b3b2b] via-[#153123] to-[#0f241a] text-white rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden transition-all border border-[#2b503b]">
                <div className="absolute -right-12 -top-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider border border-emerald-400/30">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      Human Healthcare Companion
                    </span>
                    <span className="text-xs text-emerald-200/80">Non-Clinical Support</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-serif-editorial font-bold tracking-tight text-white leading-tight">
                    Never navigate the hospital alone.
                  </h1>

                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Trained, background-verified MedBuddies pick you up from home, manage OPD tokens & registration, stand by you during consultations, and escort you safely back to your doorstep.
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="min-h-[44px] px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-[#0f241a] font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Book a MedBuddy</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onOpenEmergency}
                      className="min-h-[44px] px-5 py-3 bg-white/10 hover:bg-white/20 text-emerald-200 font-bold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                      <span>Medical Emergency / SOS</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 5-STEP JOURNEY EXPLAINER */}
              <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#142b20] dark:text-white">
                    How MedBuddy Works
                  </h2>
                  <p className="text-xs text-[#5c5647] dark:text-[#b4aca0]">
                    End-to-end compassionate assistance from your front door to the hospital chamber and back.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { step: '01', title: 'Home Pickup', desc: 'Companion arrives at your doorstep; you verify their identity with a 4-digit PIN.', icon: MapPin },
                    { step: '02', title: 'Travel Together', desc: 'Companion coordinates comfortable cab/auto transport directly to the hospital entrance.', icon: Car },
                    { step: '03', title: 'OPD & Registration', desc: 'Handles patient registration slips, queue tokens, and departmental floor navigation.', icon: FileText },
                    { step: '04', title: 'Consultation & Tests', desc: 'Waits with you outside doctor chambers, billing counters, and diagnostic pathology labs.', icon: Clock },
                    { step: '05', title: 'Safe Return Drop', desc: 'Escorts you back in a return cab and ensures you are settled safely back at home.', icon: CheckCircle2 },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-left space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                          {s.step}
                        </span>
                        <s.icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#142b20] dark:text-white">{s.title}</h3>
                      <p className="text-[11px] text-[#5c5647] dark:text-[#b4aca0] leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRANSPARENT PRICING & SAFETY BOUNDARIES SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Transparent Pricing Card */}
                <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Receipt className="w-5 h-5" />
                    <h3 className="font-bold text-base text-[#142b20] dark:text-white">
                      Transparent Pricing Model
                    </h3>
                  </div>

                  <p className="text-xs text-[#5c5647] dark:text-[#b4aca0]">
                    No hidden charges. You receive a complete price snapshot before confirming:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30]">
                      <div>
                        <span className="font-bold text-[#142b20] dark:text-white">Base Companion Assistance</span>
                        <p className="text-[10px] text-slate-500">Includes dispatch & initial 1 hour accompaniment</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹299</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30]">
                      <div>
                        <span className="font-bold text-[#142b20] dark:text-white">Additional Hospital Hours</span>
                        <p className="text-[10px] text-slate-500">Calculated per hour of stay & queue waiting</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹149 / hr</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30]">
                      <div>
                        <span className="font-bold text-[#142b20] dark:text-white">Cab / Auto Road Transport</span>
                        <p className="text-[10px] text-slate-500">Estimated from real route km (Home ↔ Hospital)</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹14/km + Base</span>
                    </div>
                  </div>
                </div>

                {/* Clinical Safety Boundaries Card */}
                <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold text-base text-[#142b20] dark:text-white">
                      Safety & Clinical Boundaries
                    </h3>
                  </div>

                  <p className="text-xs text-[#5c5647] dark:text-[#b4aca0]">
                    MedBuddy companions are trained in empathy, administration, and hospital navigation:
                  </p>

                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>What MedBuddies DO:</strong> Queue management, OPD slips, wheelchair push assistance, reassurance, pharmacy pickup, return transport.</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>What MedBuddies DO NOT:</strong> Administer medical injections, change medication dosages, perform clinical treatments, or transport stretcher emergencies.</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Strict Verification:</strong> 100% government ID verification, background checks, and healthcare code-of-conduct training.</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* PAST BOOKINGS HISTORY (IF ANY) */}
              {userBookings.length > 0 && (
                <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
                    Your Companion Booking History ({userBookings.length})
                  </h3>

                  <div className="space-y-3">
                    {userBookings.map((bk) => (
                      <div
                        key={bk.id}
                        onClick={() => setActiveTrackingBooking(bk)}
                        className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer hover:border-emerald-600 transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#142b20] dark:text-white">{bk.destinationName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                bk.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : bk.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {bk.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-slate-500">
                            Pickup: {bk.pickupAddress} • Companion: {bk.assignedBuddy?.name || 'Assigned Companion'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                            ₹{bk.priceSnapshot.estimatedTotalMin} – ₹{bk.priceSnapshot.estimatedTotalMax}
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
};
