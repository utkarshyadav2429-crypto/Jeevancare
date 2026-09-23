import React from 'react';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  FilePlus,
  FileText,
  Bot,
  AlertCircle,
  CheckCircle2,
  Video,
  Phone,
  Building2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Appointment, UserProfile, PatientSummaryForDoctor } from '../../types';

interface DoctorDashboardViewProps {
  doctorProfile: UserProfile;
  appointments: Appointment[];
  patients: PatientSummaryForDoctor[];
  setActiveTab: (tab: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  doctorProfile,
  appointments,
  patients,
  setActiveTab,
  onSelectPatient,
}) => {
  const safeApps = appointments || [];
  const upcomingApps = safeApps.filter((a) => a.status === 'Upcoming');
  const todayApps = safeApps.slice(0, 4);

  return (
    <div className="space-y-6 text-[#142b20] dark:text-[#f2f0e8]">
      
      {/* Top Professional Welcome Banner */}
      <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 sm:p-8 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] flex items-center justify-center text-[#1a5336] dark:text-[#a3d4b6] shadow-xs border border-[#d2ded0] dark:border-[#2a4435] shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif-editorial text-[#142b20] dark:text-[#f2f0e8]">
                Welcome, Dr. {doctorProfile.name || 'Rajeshwar K. Tripathi'}
              </h2>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Practitioner
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] mt-1.5 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="font-semibold text-[#142b20] dark:text-[#f2f0e8]">{doctorProfile.specialty || 'Pulmonology & Internal Medicine'}</span>
              <span>•</span>
              <span>Reg #: {doctorProfile.registrationNumber || 'KGMU-48219'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
                <Building2 className="w-3.5 h-3.5" /> {doctorProfile.hospitalAffiliation || 'KGMU Hospital, Lucknow'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('doctor-prescriptions')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1a5336] hover:bg-[#143e29] text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
          >
            <FilePlus className="w-4 h-4 text-emerald-300" />
            <span>New e-Prescription</span>
          </button>
          <button
            onClick={() => setActiveTab('doctor-notes')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#1d2e23] hover:bg-[#f6f2e9] dark:hover:bg-[#25382d] border border-[#e6dfd3] dark:border-[#283c2e] text-[#142b20] dark:text-[#f2f0e8] text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
          >
            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>SOAP Note</span>
          </button>
        </div>
      </div>

      {/* Key Clinical Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <div className="bg-white dark:bg-[#16241c] p-5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider">
            <span className="truncate">Today's Consultations</span>
            <Calendar className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6] shrink-0" />
          </div>
          <p className="text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">{todayApps.length}</p>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {upcomingApps.length} Upcoming scheduled
          </p>
        </div>

        <div className="bg-white dark:bg-[#16241c] p-5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider">
            <span className="truncate">Active Patients Roster</span>
            <Users className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6] shrink-0" />
          </div>
          <p className="text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">{patients.length}</p>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] truncate">Authorized clinical records</p>
        </div>

        <div className="bg-white dark:bg-[#16241c] p-5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider">
            <span className="truncate">Pending Lab Reviews</span>
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">2</p>
          <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold truncate">Lab reports awaiting review</p>
        </div>

        <div className="bg-white dark:bg-[#16241c] p-5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#827b6c] dark:text-[#969082] uppercase tracking-wider">
            <span className="truncate">Clinical AI Assistant</span>
            <Bot className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6] shrink-0" />
          </div>
          <p className="text-2xl font-bold text-[#1a5336] dark:text-[#a3d4b6] font-serif-editorial">Ready</p>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] truncate">Grounded in medical guidelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        
        {/* Left Column: Today's Consultation Schedule (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16241c] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4 min-w-0">
          <div className="flex items-center justify-between border-b border-[#e6dfd3] dark:border-[#283c2e] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1a5336] dark:text-[#a3d4b6]" />
              <h3 className="font-bold text-base sm:text-lg text-[#142b20] dark:text-[#f2f0e8]">
                Today's Consultation Queue
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('doctor-appointments')}
              className="text-xs font-bold text-[#1a5336] dark:text-[#a3d4b6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Schedule ({safeApps.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayApps.length === 0 ? (
            <div className="p-8 text-center text-[#827b6c] dark:text-[#969082] space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600/40" />
              <p className="text-sm font-semibold text-[#142b20] dark:text-[#f2f0e8]">You're all caught up!</p>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">No pending consultations scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] bg-[#fcfaf6] dark:bg-[#1d2e23] hover:border-[#1a5336] dark:hover:border-[#a3d4b6] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#142b20] dark:text-[#f2f0e8]">
                        {app.patientName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8eee5] text-[#1a5336] dark:bg-[#23382b] dark:text-[#a3d4b6]">
                        {app.type}
                      </span>
                    </div>
                    <p className="text-[#5c5647] dark:text-[#c0b9ad] text-xs">
                      Reason: <strong className="text-[#142b20] dark:text-[#f2f0e8]">{app.notes || 'General Evaluation'}</strong>
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1 mt-1">
                      <span>📅 {app.date} at {app.timeSlot}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (onSelectPatient) onSelectPatient(app.patientName === 'Aarav Sharma' ? 'usr_001' : 'usr_002');
                        setActiveTab('doctor-patients');
                      }}
                      className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] text-[#142b20] dark:text-[#f2f0e8] font-bold hover:bg-[#f6f2e9] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    >
                      View Chart
                    </button>
                    <button
                      onClick={() => setActiveTab('doctor-prescriptions')}
                      className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1a5336] hover:bg-[#143e29] text-white font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    >
                      Issue Rx
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Clinical Actions & AI Helper (1 Col) */}
        <div className="space-y-6">
          
          {/* Clinical AI Quick Assistant Card */}
          <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e8eee5] dark:bg-[#23382b] flex items-center justify-center text-[#1a5336] dark:text-[#a3d4b6]">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#142b20] dark:text-[#f2f0e8]">Clinical AI Assistant</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
              Summarize multi-year patient vault records, analyze uploaded lab values, or format clinical SOAP notes instantly.
            </p>
            <button
              onClick={() => setActiveTab('doctor-ai')}
              className="w-full min-h-[44px] py-2.5 px-4 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            >
              <span>Open Clinical AI Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Patient Roster Preview */}
          <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#827b6c] dark:text-[#969082] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" /> Patient Roster
              </h3>
              <button
                onClick={() => setActiveTab('doctor-patients')}
                className="text-xs font-bold text-[#1a5336] dark:text-[#a3d4b6] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2">
              {patients.slice(0, 3).map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => {
                    if (onSelectPatient) onSelectPatient(pat.id);
                    setActiveTab('doctor-patients');
                  }}
                  className="p-3.5 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] bg-[#fcfaf6] dark:bg-[#1d2e23] hover:border-[#1a5336] text-xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-sm text-[#142b20] dark:text-[#f2f0e8]">{pat.name}</p>
                    <p className="text-[#5c5647] dark:text-[#c0b9ad] text-xs mt-0.5">
                      {pat.age} yrs • {pat.gender} • Blood: <strong className="text-rose-700 dark:text-rose-400 font-bold">{pat.bloodGroup}</strong>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#827b6c]" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
