import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Clock,
  Sparkles,
  FileText,
  Building2,
  MapPin,
  Eye
} from 'lucide-react';
import {
  MedBuddyProfile,
  MedBuddyBooking,
  MedBuddyPricingConfig,
  TransportPricingConfig
} from '../../types';
import { medbuddyService } from '../../services/medbuddyService';
import { medbuddyPricingService } from '../../services/medbuddyPricingService';

export const MedBuddyAdminOperations: React.FC = () => {
  const [buddies, setBuddies] = useState<MedBuddyProfile[]>([]);
  const [bookings, setBookings] = useState<MedBuddyBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'pricing' | 'audit'>('overview');
  const [selectedBookingForAudit, setSelectedBookingForAudit] = useState<MedBuddyBooking | null>(null);

  // Pricing Form State
  const [pricingConfig, setPricingConfig] = useState<MedBuddyPricingConfig>(() =>
    medbuddyPricingService.getPricingConfig()
  );
  const [transportConfig, setTransportConfig] = useState<TransportPricingConfig>(() =>
    medbuddyPricingService.getTransportConfig()
  );
  const [pricingSavedToast, setPricingSavedToast] = useState<boolean>(false);

  // Load Data
  const loadData = async () => {
    const allBuddies = await medbuddyService.getBuddies();
    const allBookings = await medbuddyService.getBookings();
    setBuddies(allBuddies);
    setBookings(allBookings);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Buddy verification handlers
  const handleVerifyBuddy = async (buddyId: string, status: 'verified' | 'suspended') => {
    const updated = await medbuddyService.updateBuddyVerification(buddyId, status, 'admin_ops');
    if (updated) {
      loadData();
    }
  };

  // Pricing save handler
  const handleSavePricing = () => {
    medbuddyPricingService.savePricingConfig(pricingConfig);
    medbuddyPricingService.saveTransportConfig(transportConfig);
    setPricingSavedToast(true);
    setTimeout(() => setPricingSavedToast(false), 3000);
  };

  const handleResetPricing = () => {
    const defaultPricing = medbuddyPricingService.resetPricingConfig();
    setPricingConfig(defaultPricing);
    setPricingSavedToast(true);
    setTimeout(() => setPricingSavedToast(false), 3000);
  };

  // Derived KPIs
  const totalTrips = bookings.filter((b) => b.status === 'COMPLETED').length;
  const activeTrips = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status)).length;
  const verifiedBuddiesCount = buddies.filter((b) => b.verificationStatus === 'verified').length;
  const pendingBuddiesCount = buddies.filter((b) => b.verificationStatus === 'pending').length;
  const totalRevenue = bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.priceSnapshot.companionFee + b.priceSnapshot.platformFee), 0);

  return (
    <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 max-w-5xl mx-auto animate-fade-up">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e6dfd3] dark:border-[#24382c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#142b20] dark:text-[#f2f0e8]">
              MedBuddy Operations & Companion Dispatch Console
            </h1>
          </div>
          <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-1">
            Manage verified healthcare companion fleet, configure live pricing snapshots, and inspect safety audit logs.
          </p>
        </div>

        {/* Navigation Subtabs */}
        <div className="flex items-center gap-1.5 bg-[#fcfaf6] dark:bg-[#1a2d22] p-1 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] self-start sm:self-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'roster', label: `Fleet Roster (${buddies.length})` },
            { id: 'pricing', label: 'Pricing Engine' },
            { id: 'audit', label: `Audit Trail (${bookings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SUBTAB 1: OPERATIONAL OVERVIEW & KPIS
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Active Companion Trips</span>
              <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">{activeTrips}</p>
              <span className="text-[10px] text-slate-400">Live in-transit / at hospital</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Verified Companions</span>
              <p className="text-2xl font-extrabold text-[#142b20] dark:text-white">{verifiedBuddiesCount}</p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                {pendingBuddiesCount} pending verification
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Completed Trips</span>
              <p className="text-2xl font-extrabold text-[#142b20] dark:text-white">{totalTrips}</p>
              <span className="text-[10px] text-slate-400">Doorstep to doorstep</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Companion Revenue (₹)</span>
              <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">₹{totalRevenue}</p>
              <span className="text-[10px] text-slate-400">Platform + companion fees</span>
            </div>
          </div>

          {/* Quick Fleet Summary */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
              Fleet Availability Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buddies.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.photo}
                      alt={b.name}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-600 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-bold text-[#142b20] dark:text-white block">{b.name}</span>
                      <span className="text-slate-500 text-[11px] block">{b.serviceArea}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        b.currentAvailability === 'available'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {b.currentAvailability}
                    </span>
                    <span className="text-[10px] text-amber-600 block mt-0.5 font-bold">★ {b.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 2: FLEET ROSTER & VERIFICATION MANAGEMENT
          ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
              Companion Fleet Roster ({buddies.length})
            </h3>
            <span className="text-xs text-slate-500">
              Identity verification, training clearance & suspension control
            </span>
          </div>

          <div className="space-y-3">
            {buddies.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={b.photo}
                    alt={b.name}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-600 shrink-0 mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#142b20] dark:text-white text-sm">{b.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          b.verificationStatus === 'verified'
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                            : b.verificationStatus === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {b.verificationStatus}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">
                      Phone: {b.phone} • Email: {b.email}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Languages: {b.languages.join(', ')} • Experience: {b.experienceYears || 2} yrs • Service Area: {b.serviceArea}
                    </p>
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {b.verificationStatus === 'pending' && (
                    <button
                      onClick={() => handleVerifyBuddy(b.id, 'verified')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Verify</span>
                    </button>
                  )}

                  {b.verificationStatus === 'verified' && (
                    <button
                      onClick={() => handleVerifyBuddy(b.id, 'suspended')}
                      className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </button>
                  )}

                  {b.verificationStatus === 'suspended' && (
                    <button
                      onClick={() => handleVerifyBuddy(b.id, 'verified')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 3: PRICING CONFIGURATION ENGINE
          ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
                Live Companion & Transport Pricing Engine
              </h3>
              <p className="text-xs text-[#5c5647] dark:text-[#b4aca0]">
                Configure base fees, hourly rates, night/weekend surcharges, and road fare multipliers.
              </p>
            </div>

            {pricingSavedToast && (
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl animate-fade-in">
                ✓ Pricing Saved Successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Base Service Fee (₹)</label>
              <span className="text-[10px] text-slate-500 block">Includes companion dispatch & first 1 hour</span>
              <input
                type="number"
                value={pricingConfig.baseServiceFee}
                onChange={(e) => setPricingConfig({ ...pricingConfig, baseServiceFee: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Hourly Rate (₹/hr)</label>
              <span className="text-[10px] text-slate-500 block">Per additional hour of hospital stay</span>
              <input
                type="number"
                value={pricingConfig.hourlyRate}
                onChange={(e) => setPricingConfig({ ...pricingConfig, hourlyRate: Number(e.target.value) || 0, additionalHourRate: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Night Surcharge (₹)</label>
              <span className="text-[10px] text-slate-500 block">For bookings 8:00 PM – 6:00 AM</span>
              <input
                type="number"
                value={pricingConfig.nightSurcharge}
                onChange={(e) => setPricingConfig({ ...pricingConfig, nightSurcharge: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Weekend Surcharge (₹)</label>
              <span className="text-[10px] text-slate-500 block">Saturday & Sunday bookings</span>
              <input
                type="number"
                value={pricingConfig.weekendSurcharge}
                onChange={(e) => setPricingConfig({ ...pricingConfig, weekendSurcharge: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Platform & Security Fee (₹)</label>
              <span className="text-[10px] text-slate-500 block">Identity screening & PIN service</span>
              <input
                type="number"
                value={pricingConfig.platformFee}
                onChange={(e) => setPricingConfig({ ...pricingConfig, platformFee: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-1">
              <label className="font-bold text-[#142b20] dark:text-white block">Cancellation Fee (₹)</label>
              <span className="text-[10px] text-slate-500 block">If cancelled after companion is en-route</span>
              <input
                type="number"
                value={pricingConfig.cancellationFee}
                onChange={(e) => setPricingConfig({ ...pricingConfig, cancellationFee: Number(e.target.value) || 0 })}
                className="w-full p-2 text-xs bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl font-mono font-bold text-[#142b20] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e6dfd3] dark:border-[#24382c]">
            <button
              onClick={handleResetPricing}
              className="px-4 py-2 border border-[#e6dfd3] dark:border-[#283d30] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Reset to Factory Defaults
            </button>
            <button
              onClick={handleSavePricing}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Publish Pricing</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 4: AUDIT TRAIL & BOOKING LIFECYCLE
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
              Booking Events & Audit Log ({bookings.length})
            </h3>
            <span className="text-xs text-slate-500">
              Immutable audit events recording every state transition and PIN check
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No companion bookings recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">{bk.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-[#142b20] dark:text-white">{bk.destinationName}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        bk.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bk.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {bk.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                    <div>Patient: {bk.patientName} ({bk.patientPhone})</div>
                    <div>Companion: {bk.assignedBuddy?.name || 'Unassigned'}</div>
                    <div>Est Total: ₹{bk.priceSnapshot.estimatedTotalMin} – ₹{bk.priceSnapshot.estimatedTotalMax}</div>
                  </div>

                  {/* Audit Event Timeline */}
                  <div className="pt-2 border-t border-slate-200 dark:border-[#24382c] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Event History:</span>
                    <div className="space-y-1 pl-2 border-l-2 border-emerald-500/40">
                      {bk.events.map((evt) => (
                        <div key={evt.id} className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>{evt.description} ({evt.actorRole})</span>
                          <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
