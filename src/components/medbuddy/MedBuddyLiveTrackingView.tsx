import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  MapPin,
  Building2,
  Phone,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  RotateCcw,
  XCircle,
  FileText,
  UserCheck,
  Share2,
  Sparkles,
  ChevronRight,
  KeyRound,
  MessageSquare
} from 'lucide-react';
import {
  MedBuddyBooking,
  MedBuddyBookingStatus,
  MedBuddyProfile
} from '../../types';
import { medbuddyService } from '../../services/medbuddyService';
import { calculateHaversineDistanceKm } from '../../services/locationService';

interface MedBuddyLiveTrackingViewProps {
  booking: MedBuddyBooking;
  onBookingUpdated: (booking: MedBuddyBooking) => void;
  onClose: () => void;
  onOpenEmergency: () => void;
}

const STATUS_STEPS: Array<{ status: MedBuddyBookingStatus; label: string; sub: string }> = [
  { status: 'SEARCHING_FOR_BUDDY', label: 'Matching Companion', sub: 'Finding nearest verified buddy' },
  { status: 'BUDDY_ASSIGNED', label: 'Buddy Assigned', sub: 'Companion confirmed booking' },
  { status: 'BUDDY_EN_ROUTE', label: 'En-Route to Pickup', sub: 'Travelling to your home' },
  { status: 'BUDDY_ARRIVED', label: 'Arrived at Doorstep', sub: 'Ready for PIN verification' },
  { status: 'PICKUP_CONFIRMED', label: 'Pickup Confirmed', sub: 'PIN verified successfully' },
  { status: 'TRAVELLING_TO_HOSPITAL', label: 'Travelling to Hospital', sub: 'En-route in cab / auto' },
  { status: 'ARRIVED_AT_HOSPITAL', label: 'Arrived at Hospital', sub: 'At main entrance & OPD' },
  { status: 'REGISTRATION_ASSISTANCE', label: 'Registration & Token', sub: 'OPD slip & queue assistance' },
  { status: 'WAITING_WITH_PATIENT', label: 'Doctor Consultation', sub: 'Waiting & chamber escort' },
  { status: 'RETURN_TRIP', label: 'Returning Home', sub: 'Return ride coordination' },
  { status: 'DROPPED_HOME', label: 'Safely Dropped', sub: 'Arrived back at doorstep' },
  { status: 'COMPLETED', label: 'Trip Completed', sub: 'All tasks completed' },
];

export const MedBuddyLiveTrackingView: React.FC<MedBuddyLiveTrackingViewProps> = ({
  booking,
  onBookingUpdated,
  onClose,
  onOpenEmergency,
}) => {
  const [currentBooking, setCurrentBooking] = useState<MedBuddyBooking>(booking);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);

  // Sync internal state if prop updates
  useEffect(() => {
    setCurrentBooking(booking);
  }, [booking]);

  // Find step index
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === currentBooking.status);

  // Companion distance simulation if en-route
  const companionDistanceText = currentBooking.status === 'BUDDY_EN_ROUTE'
    ? '1.8 km away • Arriving in ~8 mins'
    : currentBooking.status === 'BUDDY_ARRIVED'
    ? 'Arrived at your doorstep'
    : currentBooking.status === 'TRAVELLING_TO_HOSPITAL'
    ? 'Travelling to hospital'
    : currentBooking.status.replace(/_/g, ' ');

  // Simulate next state transition (for interactive inspection and testing)
  const handleSimulateNextStep = async () => {
    const nextStepObj = STATUS_STEPS[currentStepIndex + 1];
    if (!nextStepObj) return;

    try {
      const updated = await medbuddyService.transitionStatus(
        currentBooking.id,
        nextStepObj.status,
        { id: currentBooking.assignedBuddyId || 'system', role: 'buddy' },
        `Simulated progression to ${nextStepObj.label}`
      );
      setCurrentBooking(updated);
      onBookingUpdated(updated);

      if (nextStepObj.status === 'COMPLETED') {
        setShowRatingModal(true);
      }
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    }
  };

  // Cancel booking handler
  const handleCancelBooking = async () => {
    try {
      const updated = await medbuddyService.transitionStatus(
        currentBooking.id,
        'CANCELLED',
        { id: currentBooking.patientId, role: 'patient' },
        cancelReason || 'Cancelled by patient'
      );
      setCurrentBooking(updated);
      onBookingUpdated(updated);
      setShowCancelModal(false);
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  // Submit Rating Handler
  const handleSubmitRating = async () => {
    setIsSubmittingRating(true);
    try {
      const updated = await medbuddyService.submitRatingAndReview(
        currentBooking.id,
        ratingStars,
        reviewFeedback,
        currentBooking.patientId
      );
      setCurrentBooking(updated);
      onBookingUpdated(updated);
      setShowRatingModal(false);
    } catch (err: any) {
      alert(`Rating submission error: ${err.message}`);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(currentBooking.pickupPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto animate-fade-up">
      
      {/* Live Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e6dfd3] dark:border-[#24382c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#142b20] dark:text-[#f2f0e8]">
              Live MedBuddy Journey Tracking
            </h1>
          </div>
          <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-1 font-mono">
            Booking ID: {currentBooking.id} • Destination: {currentBooking.destinationName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEmergency}
            className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS Support</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#e6dfd3] dark:border-[#283d30] text-xs font-bold text-[#142b20] dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-[#1f3328] transition-all cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>

      {/* 4-DIGIT PICKUP PIN HIGHLIGHT BANNER */}
      {!['COMPLETED', 'CANCELLED'].includes(currentBooking.status) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-[#10241a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-emerald-700">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Your 4-Digit Pickup Verification PIN
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Share this PIN with your MedBuddy upon arrival at your doorstep to start your journey securely.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-black/20 p-2 rounded-2xl border border-white/20">
            <div className="flex gap-1.5 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest px-3 py-1 bg-white text-emerald-950 rounded-xl shadow-xs">
              {currentBooking.pickupPin}
            </div>
            <button
              onClick={copyPinToClipboard}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {copiedPin ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* COMPANION PROFILE CARD */}
      {currentBooking.assignedBuddy ? (
        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentBooking.assignedBuddy.photo}
              alt={currentBooking.assignedBuddy.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-[#142b20] dark:text-white">
                  {currentBooking.assignedBuddy.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Companion
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentBooking.assignedBuddy.rating} ({currentBooking.assignedBuddy.reviewCount} reviews)
                </span>
                <span>•</span>
                <span>{currentBooking.assignedBuddy.completedTrips} Trips Completed</span>
                <span>•</span>
                <span>{currentBooking.assignedBuddy.languages.join(', ')}</span>
              </div>

              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                Status: {companionDistanceText}
              </p>
            </div>
          </div>

          <a
            href={`tel:${currentBooking.assignedBuddy.phone}`}
            className="min-h-[44px] px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer self-stretch sm:self-auto"
          >
            <Phone className="w-4 h-4" />
            <span>Call Companion</span>
          </a>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Clock className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
          <div className="flex-1">
            <span className="font-bold block">Finding Nearest Verified Companion...</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Matching based on your location, languages requested, and hospital destination.
            </span>
          </div>
        </div>
      )}

      {/* JOURNEY PROGRESS TIMELINE (HORIZONTAL ON DESKTOP, VERTICAL ON MOBILE) */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[#142b20] dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>Journey Progress Stages</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isPast = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.status}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-xs'
                    : isPast
                    ? 'border-emerald-300 dark:border-emerald-800/60 bg-white/60 dark:bg-[#1a2d22]/50 opacity-90'
                    : 'border-slate-200 dark:border-[#24382c] bg-slate-50/40 dark:bg-[#121f18]/30 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    0{idx + 1}
                  </span>
                  {isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  ) : null}
                </div>
                <p className="font-bold text-[11px] text-[#142b20] dark:text-white leading-tight truncate">
                  {step.label}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {step.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* HOSPITAL ADMINISTRATIVE TASKS CHECKLIST */}
      <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-[#142b20] dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Hospital Navigation & Administrative Tasks Checklist</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
            {currentBooking.tasks.filter((t) => t.completed).length} / {currentBooking.tasks.length} Done
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentBooking.tasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                task.completed
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#14231b] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  task.completed ? 'bg-emerald-700 text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}
              >
                {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-xs ${task.completed ? 'line-through text-slate-400 font-normal' : 'font-medium'}`}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* TRANSPARENT PRICING SNAPSHOT & RECEIPT */}
      <div className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#e6dfd3] dark:border-[#283d30]">
          <span className="font-bold text-[#142b20] dark:text-white uppercase tracking-wider text-xs">
            Trip Price Summary & Immutable Snapshot
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
            Est: ₹{currentBooking.priceSnapshot.estimatedTotalMin} – ₹{currentBooking.priceSnapshot.estimatedTotalMax}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 block">Companion Assistance</span>
            <span className="font-bold text-[#142b20] dark:text-white font-mono">₹{currentBooking.priceSnapshot.companionFee}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Outbound Transport</span>
            <span className="font-bold text-[#142b20] dark:text-white font-mono">₹{currentBooking.priceSnapshot.outboundTransportMin}-₹{currentBooking.priceSnapshot.outboundTransportMax}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Return Transport</span>
            <span className="font-bold text-[#142b20] dark:text-white font-mono">
              {currentBooking.priceSnapshot.returnRequired
                ? `₹${currentBooking.priceSnapshot.returnTransportMin}-₹${currentBooking.priceSnapshot.returnTransportMax}`
                : 'Not requested'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Platform & Tax</span>
            <span className="font-bold text-[#142b20] dark:text-white font-mono">₹{currentBooking.priceSnapshot.platformFee + currentBooking.priceSnapshot.taxAmount}</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SIMULATION & CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e6dfd3] dark:border-[#24382c]">
        {/* Test Mode / State Advancer */}
        {!['COMPLETED', 'CANCELLED'].includes(currentBooking.status) && (
          <button
            onClick={handleSimulateNextStep}
            className="px-4 py-2 bg-slate-100 dark:bg-[#1a2d22] hover:bg-slate-200 text-xs font-bold rounded-xl text-[#142b20] dark:text-white border border-[#e6dfd3] dark:border-[#283d30] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Simulate Next Stage ({STATUS_STEPS[currentStepIndex + 1]?.label || 'Done'})</span>
          </button>
        )}

        {/* Cancellation or Review action */}
        {!['COMPLETED', 'CANCELLED'].includes(currentBooking.status) ? (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel Booking
          </button>
        ) : currentBooking.status === 'COMPLETED' && !currentBooking.rating ? (
          <button
            onClick={() => setShowRatingModal(true)}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Rate & Review Companion</span>
          </button>
        ) : null}
      </div>

      {/* CANCEL BOOKING MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#142b20] dark:text-white">
                Cancel MedBuddy Booking?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentBooking.priceSnapshot.cancellationPolicy.description}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Reason for cancellation</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Appointment rescheduled, family member is accompanying instead..."
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-[#142b20] dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-[#e6dfd3] dark:border-[#283d30] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING & REVIEW MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-scale-in">
            <div className="text-center space-y-1">
              <Star className="w-8 h-8 text-amber-500 mx-auto fill-amber-500" />
              <h3 className="font-bold text-lg text-[#142b20] dark:text-white">
                Rate Your MedBuddy Experience
              </h3>
              <p className="text-xs text-slate-500">
                How was your journey with {currentBooking.assignedBuddy?.name || 'your companion'}?
              </p>
            </div>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingStars(star)}
                  className="p-1 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingStars
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Feedback / Review</label>
              <textarea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Priya was extremely helpful with the OPD token queue and kept my mother comfortable..."
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 border border-[#e6dfd3] dark:border-[#283d30] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={isSubmittingRating}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
