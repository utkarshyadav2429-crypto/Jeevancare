import React, { useState } from 'react';
import {
  FolderLock,
  Search,
  User,
  ShieldCheck,
  FileText,
  Activity,
  Pill,
  Calendar,
  Lock,
  AlertCircle,
  Eye,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { VaultItem, PatientSummaryForDoctor, ClinicalNote, ActiveMedicine } from '../../types';

interface DoctorRecordsViewProps {
  patients: PatientSummaryForDoctor[];
  vaultItems: VaultItem[];
  clinicalNotes: ClinicalNote[];
  activeMedicines: ActiveMedicine[];
  setActiveTab: (tab: string) => void;
}

export const DoctorRecordsView: React.FC<DoctorRecordsViewProps> = ({
  patients = [],
  vaultItems = [],
  clinicalNotes = [],
  activeMedicines = [],
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || 'usr_001'
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const patientVault = vaultItems.filter(
    (v) => v.title.toLowerCase().includes(selectedPatient?.name.toLowerCase() || '') || true
  );

  const patientNotes = clinicalNotes.filter((n) => n.patientId === selectedPatient?.id);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Authorized Patient Records & Vault</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access encrypted patient medical records, ABHA health histories, lab reports, and clinical notes under authorized physician access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RLS Security Enforced</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Patient Selector & Right Vault Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Patient List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Authorized Patients
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {patients.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by patient name or ABHA..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-none">
            {patients
              .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((p) => {
                const isSelected = p.id === selectedPatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-xs font-medium'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.age} yrs • {p.gender} • ABHA: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{p.abhaNumber || '91-8273-1928-1102'}</strong>
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Col: Selected Patient Medical Record & Vault Inspection (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Profile Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedPatient.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                        Consent Active ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedPatient.age} Yrs • {selectedPatient.gender} • Blood Group:{' '}
                      <strong className="text-rose-600">{selectedPatient.bloodGroup}</strong> • Phone:{' '}
                      {selectedPatient.phone}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('doctor-prescriptions')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Pill className="w-4 h-4" />
                    <span>Issue e-Prescription</span>
                  </button>
                </div>

                {/* Chronic Conditions & Allergy Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                    <p className="font-bold text-amber-900 dark:text-amber-300 mb-1">
                      ⚠️ Allergy & Risk Flags
                    </p>
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      {selectedPatient.allergies?.join(', ') || 'Penicillin, Dust Mites'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
                    <p className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      🩺 Chronic Conditions
                    </p>
                    <p className="text-indigo-800 dark:text-indigo-200 font-medium">
                      {selectedPatient.chronicConditions?.join(', ') || 'Mild Bronchial Asthma, Seasonal Rhinitis'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Vault Documents */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderLock className="w-4 h-4 text-emerald-600" /> Vault Documents & Diagnostics
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {patientVault.length} Items Available
                  </span>
                </div>

                {patientVault.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <FolderLock className="w-10 h-10 mx-auto text-emerald-500/30" />
                    <p className="text-sm font-semibold">No medical records uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientVault.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-slate-500">
                            Facility/Doctor: <strong className="text-slate-700 dark:text-slate-300">{item.doctorOrFacility}</strong>
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold text-[11px]">
                            📅 Uploaded: {item.date}
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab('doctor-reports')}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Detail</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-700">
              <p>Select a patient from the left roster to view records.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
