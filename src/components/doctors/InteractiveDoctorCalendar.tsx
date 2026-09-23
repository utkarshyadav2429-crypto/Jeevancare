import React from 'react';
import { Calendar, Clock, CheckCircle2, Lock } from 'lucide-react';
import { Doctor } from '../../types';

interface InteractiveDoctorCalendarProps {
  doctor: Doctor;
  selectedDate: string;
  selectedSlot: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: string) => void;
  bookedSlots?: string[];
}

export const InteractiveDoctorCalendar: React.FC<InteractiveDoctorCalendarProps> = ({
  doctor,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  bookedSlots = [],
}) => {
  // Generate next 7 dates starting from today/tomorrow
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({ iso, dayName, dayNum, monthName });
    }
    return dates;
  };

  const dates = generateDates();

  const slots = doctor.availableSlots && doctor.availableSlots.length > 0
    ? doctor.availableSlots
    : ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '05:30 PM'];

  return (
    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      
      {/* Date Picker Horizontal Row */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          Select Date
        </label>
        <div className="grid grid-cols-7 gap-1.5">
          {dates.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => onSelectDate(d.iso)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                  isSelected
                    ? 'bg-emerald-700 text-white font-bold shadow-xs scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400">
                  {d.dayName}
                </span>
                <span className="text-sm font-extrabold my-0.5">{d.dayNum}</span>
                <span className="text-[9px] font-medium">{d.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          Available Time Slots ({doctor.consultationDurationMins || 20} mins per session)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {slots.map((s) => {
            const isBooked = bookedSlots.includes(s);
            const isSelected = selectedSlot === s;

            return (
              <button
                key={s}
                type="button"
                disabled={isBooked}
                onClick={() => onSelectSlot(s)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  isBooked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                {isBooked ? (
                  <>
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Booked</span>
                  </>
                ) : (
                  <>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    <span>{s}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
