import React from 'react';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorAvatarProps {
  doctor: Doctor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showVerifiedBadge?: boolean;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  doctor,
  size = 'md',
  showVerifiedBadge = true,
}) => {
  const getInitials = (name: string) => {
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase() || 'DR';
  };

  const dimensions = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-28 h-28 text-2xl',
  }[size];

  const badgeSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size];

  const hasPhoto = Boolean(doctor.photoUrl || doctor.avatarUrl);

  return (
    <div className="relative inline-block shrink-0">
      {hasPhoto ? (
        <img
          src={doctor.photoUrl || doctor.avatarUrl}
          alt={`Dr. ${doctor.name}`}
          className={`${dimensions} rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm`}
          onError={(e) => {
            // If uploaded photo fails to load, fallback to initials badge
            (e.target as HTMLElement).style.display = 'none';
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              const fallback = parent.querySelector('.avatar-fallback');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }
          }}
        />
      ) : null}

      {/* Clean SVG Initials Fallback Badge */}
      <div
        className={`avatar-fallback ${dimensions} rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-950 dark:to-teal-900 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold flex flex-col items-center justify-center shadow-xs ${
          hasPhoto ? 'hidden' : 'flex'
        }`}
        title={`Verified Doctor: ${doctor.name}`}
      >
        <span>{getInitials(doctor.name)}</span>
        {size !== 'sm' && (
          <Stethoscope className="w-3 h-3 text-emerald-700 dark:text-emerald-300 opacity-80 mt-0.5" />
        )}
      </div>

      {/* Verified Doctor Badge Overlay */}
      {showVerifiedBadge && doctor.verificationStatus === 'VERIFIED' && (
        <div
          className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-xs"
          title="Verified Doctor by Medical Registration Authority"
        >
          <CheckCircle2 className={`${badgeSize} text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950`} />
        </div>
      )}
    </div>
  );
};
