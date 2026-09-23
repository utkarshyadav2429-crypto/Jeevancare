import React from 'react';
import {
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  Clock,
  Languages,
  Award,
  IndianRupee,
  ShieldCheck,
  Video,
  UserCheck
} from 'lucide-react';
import { Doctor } from '../../types';
import { DoctorAvatar } from './DoctorAvatar';

interface DoctorCardProps {
  doctor: Doctor;
  onViewProfile: (doctor: Doctor) => void;
  onBookConsultation: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onViewProfile,
  onBookConsultation,
}) => {
  const isVerified = doctor.verificationStatus === 'VERIFIED' || doctor.verified;

  const getStatusBadge = () => {
    switch (doctor.onlineStatus) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Available Now
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Busy in Consultation
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Offline
          </span>
        );
    }
  };

  const nextSlot = doctor.availableSlots && doctor.availableSlots.length > 0
    ? doctor.availableSlots[0]
    : 'Contact Clinic';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between space-y-4 relative group">
      
      {/* Top Header Row */}
      <div className="flex items-start gap-4">
        <DoctorAvatar doctor={doctor} size="lg" showVerifiedBadge={true} />

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span>{doctor.name}</span>
            </h3>
            {getStatusBadge()}
          </div>

          {/* Verification Badge line */}
          {isVerified && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Doctor</span>
              {doctor.registrationNumber && (
                <span className="text-slate-400 font-mono font-normal">({doctor.registrationNumber})</span>
              )}
            </div>
          )}

          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">{doctor.specialty}</p>
          
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {doctor.qualification} • {doctor.experienceYears} Years Experience
          </p>

          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-0.5 truncate">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.hospital}</span>
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.city}, {doctor.state}</span>
            {doctor.distanceKm !== undefined && doctor.distanceKm > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">({doctor.distanceKm} km)</span>
            )}
          </p>
        </div>
      </div>

      {/* Languages & Consultation Modes */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
          <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{doctor.languages ? doctor.languages.join(', ') : 'Hindi, English'}</span>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px]">Slot: {nextSlot}</span>
        </div>
      </div>

      {/* Fee & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Consultation Fee</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center">
            ₹{doctor.fees.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile(doctor)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Profile
          </button>

          <button
            onClick={() => onBookConsultation(doctor)}
            disabled={doctor.onlineStatus === 'offline'}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Slot</span>
          </button>
        </div>
      </div>

    </div>
  );
};
