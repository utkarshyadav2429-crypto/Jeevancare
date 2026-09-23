import React from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  MapPin,
  Car,
  FileText,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { MedBuddyBooking } from '../../types';

interface MedBuddyHomeCardProps {
  onBookMedBuddy?: () => void;
  onOpenMedBuddy?: () => void;
  activeBooking?: MedBuddyBooking | null;
  onViewActiveBooking?: (bookingId: string) => void;
  onOpenEmergency?: () => void;
}

export const MedBuddyHomeCard: React.FC<MedBuddyHomeCardProps> = ({
  onBookMedBuddy,
  onOpenMedBuddy,
  activeBooking,
  onViewActiveBooking,
  onOpenEmergency,
}) => {
  const handleOpen = onOpenMedBuddy || onBookMedBuddy;
  const hasActiveBooking = activeBooking && !['COMPLETED', 'CANCELLED'].includes(activeBooking.status);

  return (
    <section className="bg-gradient-to-br from-[#1b3b2b] via-[#153123] to-[#0f241a] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden transition-all border border-[#2b503b]">
      
      {/* Subtle Background Graphic Accents */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 bottom-0 opacity-10 hidden lg:block pointer-events-none">
        <HeartHandshake className="w-48 h-48 text-emerald-300" />
      </div>

      <div className="relative z-10 max-w-3xl space-y-5">
        
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider border border-emerald-400/30">
            <HeartHandshake className="w-3.5 h-3.5" />
            MedBuddy Companion
          </span>
          <span className="text-xs text-emerald-200/80 font-medium">
            Human Healthcare Assistance
          </span>
        </div>

        {/* Title & Core Purpose */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold tracking-tight text-white">
            Need someone to accompany you to the hospital?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-2 leading-relaxed">
            A trained, verified companion can pick you up from home, assist with registration & OPD queues, stay with you during your visit, and safely escort you back home.
          </p>
        </div>

        {/* If Active Booking Exists -> Highlight Active Trip */}
        {hasActiveBooking ? (
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Active Trip in Progress ({activeBooking.status.replace(/_/g, ' ')})
                </span>
              </div>
              <span className="text-xs font-mono text-white/80">
                {activeBooking.id}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-white text-sm">{activeBooking.destinationName}</p>
                <p className="text-emerald-200/80 mt-0.5">
                  {activeBooking.assignedBuddy
                    ? `Companion: ${activeBooking.assignedBuddy.name} (${activeBooking.assignedBuddy.rating}★)`
                    : 'Searching for nearest verified companion...'}
                </p>
              </div>

              <button
                onClick={() => onViewActiveBooking && onViewActiveBooking(activeBooking.id)}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-[#1b3b2b] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <span>Track Companion & PIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Feature Points Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-emerald-100">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">Home Pickup</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <Car className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">Travel Assistance</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <FileText className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">Hospital Registration</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <UserCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">OPD Navigation</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">Visit Companion</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-medium">Safe Return Drop</span>
            </div>
          </div>
        )}

        {/* Action & Non-Clinical Safety Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-emerald-800/40">
          <div className="flex items-center gap-2 text-[11px] text-emerald-200/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Non-clinical companion service • Verified background & ID</span>
          </div>

          <button
            onClick={handleOpen}
            className="min-h-[44px] px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-[#0f241a] font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 shrink-0"
          >
            <span>Book a MedBuddy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
