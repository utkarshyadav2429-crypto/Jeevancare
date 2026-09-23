import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Video,
  Building2,
  FileText,
  FilePlus,
  UserCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Appointment } from '../../types';

interface DoctorAppointmentsViewProps {
  appointments: Appointment[];
  setActiveTab: (tab: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const DoctorAppointmentsView: React.FC<DoctorAppointmentsViewProps> = ({
  appointments = [],
  setActiveTab,
  onSelectPatient,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredApps = appointments.filter((app) => {
    const matchesSearch =
      app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'today') {
      return app.date === todayStr || app.status === 'Upcoming';
    }
    if (filter === 'upcoming') {
      return app.status === 'Upcoming';
    }
    if (filter === 'completed') {
      return app.status === 'Completed';
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Clinical Appointments Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage scheduled patient consultations, video visits, and clinic appointments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('doctor-patients')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Patients Roster</span>
          </button>
          <button
            onClick={() => setActiveTab('doctor-prescriptions')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Issue e-Prescription</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#16241c] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#827b6c]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, doctor, or complaint..."
            className="w-full pl-9 pr-4 min-h-[44px] py-2 text-xs bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5336] text-[#142b20] dark:text-[#f2f0e8] placeholder-[#827b6c]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-[#827b6c] shrink-0 ml-1 mr-1" />
          {(['all', 'today', 'upcoming', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                filter === f
                  ? 'bg-[#1a5336] text-white shadow-xs'
                  : 'bg-[#f6f2e9] dark:bg-[#1d2e23] text-[#5c5647] dark:text-[#c0b9ad] hover:bg-[#eae4d7] dark:hover:bg-[#283c2e]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-[#16241c] rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-[#827b6c] space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-[#1a5336]/40" />
            <p className="text-base font-bold text-[#142b20] dark:text-[#f2f0e8]">
              No appointments scheduled
            </p>
            <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] max-w-sm mx-auto">
              There are no patient appointments matching your search filter "{filter}".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e6dfd3] dark:divide-[#283c2e]">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-4 sm:p-5 hover:bg-[#fcfaf6] dark:hover:bg-[#1d2e23]/60 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 sm:gap-4 w-full">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#e8eee5] dark:bg-[#23382b] border border-[#d2ded0] dark:border-[#2a4435] flex items-center justify-center text-[#1a5336] dark:text-[#a3d4b6] font-bold shrink-0">
                    {app.type.includes('Video') ? (
                      <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-[#142b20] dark:text-[#f2f0e8]">
                        {app.patientName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Completed'
                            ? 'bg-[#f6f2e9] text-[#5c5647] dark:bg-[#1d2e23] dark:text-[#c0b9ad]'
                            : 'bg-[#e8eee5] text-[#1a5336] dark:bg-[#23382b] dark:text-[#a3d4b6]'
                        }`}
                      >
                        {app.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                        {app.type}
                      </span>
                    </div>

                    <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                      Reason for Consultation:{' '}
                      <strong className="text-[#142b20] dark:text-[#f2f0e8]">
                        {app.notes || 'Routine Follow-up & Evaluation'}
                      </strong>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-[#1a5336] dark:text-[#a3d4b6] font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {app.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {app.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => {
                      if (onSelectPatient) {
                        onSelectPatient(app.patientName === 'Aarav Sharma' ? 'usr_001' : 'usr_002');
                      }
                      setActiveTab('doctor-patients');
                    }}
                    className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-xl bg-[#f6f2e9] dark:bg-[#1d2e23] hover:bg-[#eae4d7] text-[#142b20] dark:text-[#f2f0e8] text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                  >
                    Medical Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('doctor-notes')}
                    className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-900 dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-blue-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>SOAP Note</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('doctor-prescriptions')}
                    className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1a5336] hover:bg-[#143e29] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Issue Rx</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
