import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  Clock,
  Languages,
  ShieldCheck,
  Video,
  Phone,
  UserCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Doctor, Appointment } from '../../types';
import { DoctorAvatar } from './DoctorAvatar';
import { InteractiveDoctorCalendar } from './InteractiveDoctorCalendar';
import { auditLogger } from '../../services/AuditLogger';

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  existingAppointments: Appointment[];
  onClose: () => void;
  onBookAppointment: (app: Appointment) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  existingAppointments = [],
  onClose,
  onBookAppointment,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-08-12');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');
  const [consultType, setConsultType] = useState<'In-Person' | 'Audio' | 'Video'>('Video');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [doubleBookError, setDoubleBookError] = useState('');

  if (!doctor) return null;

  const isVerified = doctor.verificationStatus === 'VERIFIED' || doctor.verified;

  // Check if slot is already double booked
  const isSlotBooked = existingAppointments.some(
    (app) =>
      app.doctorId === doctor.id &&
      app.date === selectedDate &&
      app.timeSlot === selectedSlot &&
      app.status !== 'CANCELLED'
  );

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setDoubleBookError('');

    if (isSlotBooked) {
      setDoubleBookError(`Slot ${selectedSlot} on ${selectedDate} is already booked. Please choose another slot.`);
      return;
    }

    const newApp: Appointment = {
      id: `app_${Date.now()}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      patientName: 'Aarav Sharma',
      date: selectedDate,
      timeSlot: selectedSlot,
      type: consultType,
      status: 'UPCOMING',
      fees: doctor.fees,
      notes,
      createdAt: new Date().toISOString(),
    };

    onBookAppointment(newApp);

    auditLogger.logAction(
      'APPOINTMENT_BOOKED',
      `Booked ${consultType} consultation with ${doctor.name} on ${selectedDate} at ${selectedSlot}. Fee: ₹${doctor.fees}`,
      { doctorId: doctor.id, date: selectedDate, slot: selectedSlot },
      'SUCCESS'
    );

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      onClose();
    }, 1800);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-profile-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#16241c] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e6dfd3] dark:border-[#283c2e] overflow-hidden relative sm:my-6 max-h-[92dvh] sm:max-h-[85vh] flex flex-col"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-[#d2ded0] dark:bg-[#2a4435] rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1a5336] dark:bg-[#153424] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <DoctorAvatar doctor={doctor} size="md" showVerifiedBadge={true} />
            <div>
              <h3 id="doctor-profile-modal-title" className="font-bold text-base sm:text-lg font-serif-editorial">{doctor.name}</h3>
              <p className="text-xs text-emerald-200">{doctor.specialty} • {doctor.qualification}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close doctor profile modal"
            className="min-h-[44px] min-w-[44px] p-2 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto text-xs flex-1">

          {/* Doctor Verification Header Banner */}
          <div className="p-4 rounded-xl bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Medical Doctor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 text-xs">
                    <ShieldCheck className="w-4 h-4" /> Verification Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#827b6c] dark:text-[#969082] font-mono">
                Reg No: {doctor.registrationNumber || 'Pending'} ({doctor.registrationAuthority || 'Medical Council'})
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-[#827b6c] dark:text-[#969082] uppercase tracking-wider block">Consultation Fee</span>
              <span className="font-extrabold text-[#142b20] dark:text-[#f2f0e8] text-base">
                ₹{doctor.fees.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <span className="font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider text-[10px] block">Practice Location</span>
              <p className="font-semibold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {doctor.hospital}
              </p>
              <p className="text-[#5c5647] dark:text-[#c0b9ad] flex items-center gap-1.5 pl-5">
                <MapPin className="w-3.5 h-3.5 text-[#827b6c] shrink-0" />
                {doctor.address || `${doctor.city}, ${doctor.state}`}
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider text-[10px] block">Languages & Experience</span>
              <p className="font-semibold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {doctor.languages ? doctor.languages.join(', ') : 'Hindi, English'}
              </p>
              <p className="text-[#5c5647] dark:text-[#c0b9ad] pl-5">
                {doctor.experienceYears} Years Clinical Experience
              </p>
            </div>

          </div>

          {/* Bio */}
          {doctor.about && (
            <div className="space-y-1 pt-2 border-t border-[#e6dfd3] dark:border-[#283c2e]">
              <span className="font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider text-[10px] block">About & Clinical Expertise</span>
              <p className="text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed bg-[#fcfaf6] dark:bg-[#1d2e23] p-3 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e]">
                {doctor.about}
              </p>
            </div>
          )}

          {/* Booking Form */}
          <form onSubmit={handleConfirmBooking} className="pt-4 border-t border-[#e6dfd3] dark:border-[#283c2e] space-y-4">
            <h4 className="font-bold text-sm text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Book Appointment Slot
            </h4>

            {doubleBookError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{doubleBookError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Appointment successfully booked! Syncing with Doctor Portal...</span>
              </div>
            )}

            {/* Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#142b20] dark:text-[#f2f0e8] mb-1">
                Consultation Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Video', 'Audio', 'In-Person'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setConsultType(mode)}
                    className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                      consultType === mode
                        ? 'bg-[#1a5336] text-white border-[#143e29] shadow-xs'
                        : 'bg-[#fcfaf6] dark:bg-[#1d2e23] text-[#5c5647] dark:text-[#c0b9ad] border-[#e6dfd3] dark:border-[#283c2e]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Calendar & Slot Picker */}
            <InteractiveDoctorCalendar
              doctor={doctor}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onSelectDate={setSelectedDate}
              onSelectSlot={setSelectedSlot}
            />

            {/* Reason for visit */}
            <div>
              <label className="block text-xs font-semibold text-[#142b20] dark:text-[#f2f0e8] mb-1">
                Consultation Reason / Symptoms Overview
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your health symptoms or reason for follow-up..."
                rows={2}
                className="w-full p-3 text-xs bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#142b20] dark:text-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
              />
            </div>

            <button
              type="submit"
              disabled={isSlotBooked || bookingSuccess}
              className="w-full min-h-[48px] py-3 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSlotBooked
                  ? 'Slot Unavailable (Already Booked)'
                  : `Confirm Booking & Pay ₹${doctor.fees.toLocaleString('en-IN')}`}
              </span>
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};
