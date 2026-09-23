import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  Star,
  MapPin,
  Building2,
  Phone,
  CheckCircle2,
  Clock,
  Car,
  KeyRound,
  Navigation,
  FileCheck,
  AlertCircle,
  Power,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  MedBuddyProfile,
  MedBuddyBooking,
  MedBuddyBookingStatus
} from '../../types';
import { medbuddyService } from '../../services/medbuddyService';

interface MedBuddyCompanionPortalProps {
  currentBuddyId?: string;
  onViewBookingDetails?: (booking: MedBuddyBooking) => void;
}

export const MedBuddyCompanionPortal: React.FC<MedBuddyCompanionPortalProps> = ({
  currentBuddyId = 'mb_101',
  onViewBookingDetails,
}) => {
  const [buddy, setBuddy] = useState<MedBuddyProfile | null>(null);
  const [assignedBookings, setAssignedBookings] = useState<MedBuddyBooking[]>([]);
  const [allAvailableRequests, setAllAvailableRequests] = useState<MedBuddyBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<MedBuddyBooking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // PIN Verification Modal
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);

  // Load buddy & bookings
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const b = await medbuddyService.getBuddyById(currentBuddyId);
      setBuddy(b);

      const allBookings = await medbuddyService.getBookings();
      const myBookings = allBookings.filter((bk) => bk.assignedBuddyId === currentBuddyId);
      const available = allBookings.filter(
        (bk) => bk.status === 'SEARCHING_FOR_BUDDY' && !bk.assignedBuddyId
      );

      setAssignedBookings(myBookings);
      setAllAvailableRequests(available);

      if (myBookings.length > 0 && !selectedBooking) {
        setSelectedBooking(myBookings[0]);
      }
    } catch (err) {
      console.error('Error loading buddy portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentBuddyId]);

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!buddy) return;
    const nextState = buddy.currentAvailability === 'available' ? 'offline' : 'available';
    const updated = await medbuddyService.setBuddyAvailability(buddy.id, nextState);
    if (updated) setBuddy(updated);
  };

  // Accept booking request
  const handleAcceptRequest = async (bookingId: string) => {
    if (!buddy) return;
    try {
      const updated = await medbuddyService.assignBuddyToBooking(bookingId, buddy.id, buddy.id, 'admin');
      if (updated) {
        setSelectedBooking(updated);
        refreshData();
      }
    } catch (err: any) {
      alert(`Could not accept booking: ${err.message}`);
    }
  };

  // Transition selected booking state
  const handleStateTransition = async (nextStatus: MedBuddyBookingStatus, note?: string) => {
    if (!selectedBooking || !buddy) return;
    try {
      const updated = await medbuddyService.transitionStatus(
        selectedBooking.id,
        nextStatus,
        { id: buddy.id, role: 'buddy', name: buddy.name },
        note || `Companion progressed status to ${nextStatus}`
      );
      setSelectedBooking(updated);
      refreshData();
    } catch (err: any) {
      alert(`Error updating state: ${err.message}`);
    }
  };

  // Verify PIN
  const handleVerifyPin = async () => {
    if (!selectedBooking || !buddy) return;
    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await medbuddyService.verifyPickupPin(
        selectedBooking.id,
        enteredPin.trim(),
        buddy.id
      );

      if (!res.success) {
        setPinError(res.message);
      } else {
        setShowPinModal(false);
        setEnteredPin('');
        if (res.booking) {
          setSelectedBooking(res.booking);
        }
        refreshData();
      }
    } catch (err: any) {
      setPinError(err.message || 'Verification error');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Toggle task
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!selectedBooking || !buddy) return;
    try {
      const updated = await medbuddyService.toggleTaskCompletion(
        selectedBooking.id,
        taskId,
        !currentCompleted,
        buddy.id
      );
      setSelectedBooking(updated);
      refreshData();
    } catch (err) {
      console.error('Task toggle error:', err);
    }
  };

  if (isLoading || !buddy) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading MedBuddy Companion Portal...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto animate-fade-up">
      
      {/* COMPANION HEADER & AVAILABILITY STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e6dfd3] dark:border-[#24382c]">
        <div className="flex items-center gap-4">
          <img
            src={buddy.photo}
            alt={buddy.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-[#142b20] dark:text-white">
                {buddy.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                <ShieldCheck className="w-3 h-3" />
                Verified Companion
              </span>
            </div>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3 h-3 fill-current" />
                {buddy.rating} ({buddy.reviewCount} reviews)
              </span>
              <span>•</span>
              <span>{buddy.completedTrips} Trips Completed</span>
              <span>•</span>
              <span>{buddy.serviceArea}</span>
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto ${
            buddy.currentAvailability === 'available'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {buddy.currentAvailability === 'available' ? 'Status: ONLINE & AVAILABLE' : 'Status: OFFLINE'}
          </span>
        </button>
      </div>

      {/* ACTIVE ASSIGNED BOOKINGS CAROUSEL / SELECTOR */}
      {assignedBookings.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#142b20] dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Assigned Active Booking ({assignedBookings.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Status: {selectedBooking?.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Booking Card */}
          {selectedBooking && (
            <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
              
              {/* Patient & Hospital Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Patient Details</span>
                  <p className="font-bold text-[#142b20] dark:text-white text-sm">
                    {selectedBooking.patientName} ({selectedBooking.patientRelationship}, Age {selectedBooking.patientAge})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <a href={`tel:${selectedBooking.patientPhone}`} className="underline font-bold">
                      {selectedBooking.patientPhone}
                    </a>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{selectedBooking.pickupAddress}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Hospital Destination</span>
                  <p className="font-bold text-[#142b20] dark:text-white text-sm">
                    {selectedBooking.destinationName}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{selectedBooking.destinationAddress}</span>
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-300 font-medium text-[11px] mt-1">
                    Estimated Duration: ~{selectedBooking.priceSnapshot.estimatedCompanionHours} hrs • Mobility: {selectedBooking.mobilityRequirement}
                  </p>
                </div>
              </div>

              {/* NAVIGATION ACTION BAR */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBooking.pickupCoordinates.lat},${selectedBooking.pickupCoordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white dark:bg-[#1a2d22] border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate to Patient Home</span>
                </a>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBooking.destinationCoordinates.lat},${selectedBooking.destinationCoordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white dark:bg-[#1a2d22] border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Navigate to Hospital</span>
                </a>
              </div>

              {/* DYNAMIC ACTION BUTTON BASED ON CURRENT STATE */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#14231b] border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Next Step in Companion Flow
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.status === 'BUDDY_ASSIGNED' && (
                  <button
                    onClick={() => handleStateTransition('BUDDY_EN_ROUTE', 'Companion departed towards patient home')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    <span>Start En-Route to Patient Home</span>
                  </button>
                )}

                {selectedBooking.status === 'BUDDY_EN_ROUTE' && (
                  <button
                    onClick={() => handleStateTransition('BUDDY_ARRIVED', 'Companion arrived at patient doorstep')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Mark Arrived at Patient Home</span>
                  </button>
                )}

                {selectedBooking.status === 'BUDDY_ARRIVED' && (
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enter Patient 4-Digit Pickup PIN to Confirm Pickup</span>
                  </button>
                )}

                {selectedBooking.status === 'PICKUP_CONFIRMED' && (
                  <button
                    onClick={() => handleStateTransition('TRAVELLING_TO_HOSPITAL', 'Companion and patient departed towards hospital')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    <span>Start Ride to Hospital</span>
                  </button>
                )}

                {selectedBooking.status === 'TRAVELLING_TO_HOSPITAL' && (
                  <button
                    onClick={() => handleStateTransition('ARRIVED_AT_HOSPITAL', 'Arrived at hospital main entrance')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Confirm Arrived at Hospital OPD</span>
                  </button>
                )}

                {selectedBooking.status === 'ARRIVED_AT_HOSPITAL' && (
                  <button
                    onClick={() => handleStateTransition('REGISTRATION_ASSISTANCE', 'Assisting with registration slip & queue')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Start OPD Registration & Token Collection</span>
                  </button>
                )}

                {selectedBooking.status === 'REGISTRATION_ASSISTANCE' && (
                  <button
                    onClick={() => handleStateTransition('WAITING_WITH_PATIENT', 'Waiting with patient outside doctor chamber')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Doctor Chamber Escort & Waiting Companionship</span>
                  </button>
                )}

                {selectedBooking.status === 'WAITING_WITH_PATIENT' && (
                  <button
                    onClick={() => handleStateTransition('RETURN_TRIP', 'Coordinating return cab with patient')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    <span>Start Return Journey to Patient Home</span>
                  </button>
                )}

                {selectedBooking.status === 'RETURN_TRIP' && (
                  <button
                    onClick={() => handleStateTransition('DROPPED_HOME', 'Patient safely escorted back home')}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Patient Safely Dropped at Home</span>
                  </button>
                )}

                {selectedBooking.status === 'DROPPED_HOME' && (
                  <button
                    onClick={() => handleStateTransition('COMPLETED', 'Trip finalized and closed successfully')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Booking & Settle Trip</span>
                  </button>
                )}

                {selectedBooking.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold text-center">
                    ✓ This booking has been completed successfully.
                  </div>
                )}
              </div>

              {/* HOSPITAL TASK CHECKLIST (COMPANION INTERACTION) */}
              <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                <span className="text-xs font-bold text-[#142b20] dark:text-white block">
                  Interactive Hospital Tasks Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBooking.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                        task.completed
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-950 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#14231b] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          task.completed ? 'bg-emerald-700 text-white' : 'border border-slate-400'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${task.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#16271e] border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
          <HeartHandshake className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-[#142b20] dark:text-white">
            No Active Bookings Assigned
          </h3>
          <p className="text-xs text-slate-500">
            You are online and ready to receive companion requests.
          </p>
        </div>
      )}

      {/* AVAILABLE REQUESTS POOL */}
      {allAvailableRequests.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#e6dfd3] dark:border-[#24382c]">
          <h3 className="font-bold text-sm text-[#142b20] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Available Patient Companion Requests ({allAvailableRequests.length})</span>
          </h3>

          <div className="space-y-2.5">
            {allAvailableRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-[#142b20] dark:text-white text-sm">
                    {req.destinationName} ({req.reasonCategory})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Pickup: {req.pickupAddress}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-400 font-medium">
                    Patient: {req.patientName} • Total Est: ~{req.priceSnapshot.estimatedCompanionHours} hrs
                  </p>
                </div>

                <button
                  onClick={() => handleAcceptRequest(req.id)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <span>Accept Booking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <KeyRound className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#142b20] dark:text-white">
                Enter Patient 4-Digit Pickup PIN
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Ask patient <strong>{selectedBooking?.patientName}</strong> for the 4-digit verification PIN displayed on their JeevanCare screen.
            </p>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN (e.g. 4829)"
                className="w-full text-center tracking-widest font-mono text-2xl p-3 bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white font-bold"
              />
              {pinError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {pinError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setEnteredPin('');
                  setPinError(null);
                }}
                className="px-4 py-2 border border-[#e6dfd3] dark:border-[#283d30] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={enteredPin.length !== 4 || isVerifyingPin}
                className={`px-6 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  enteredPin.length === 4 && !isVerifyingPin
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isVerifyingPin ? 'Verifying...' : 'Confirm PIN & Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
