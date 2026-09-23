import React, { useState } from 'react';
import {
  Users,
  Search,
  UserCheck,
  AlertTriangle,
  FileText,
  FilePlus,
  Activity,
  Calendar,
  Pill,
  FolderLock,
  MessageSquare,
  Bot,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import {
  PatientSummaryForDoctor,
  ClinicalNote,
  ActiveMedicine,
  VaultItem,
  HealthMetricLog,
  Appointment
} from '../../types';

interface DoctorPatientsViewProps {
  patients: PatientSummaryForDoctor[];
  clinicalNotes: ClinicalNote[];
  activeMedicines: ActiveMedicine[];
  vaultItems: VaultItem[];
  metricLogs: HealthMetricLog[];
  appointments: Appointment[];
  selectedPatientId?: string;
  onAddClinicalNote: (note: ClinicalNote) => void;
  onAddActiveMedicine: (med: ActiveMedicine) => void;
  onAddVaultItem: (item: VaultItem) => void;
  setActiveTab: (tab: string) => void;
}

export const DoctorPatientsView: React.FC<DoctorPatientsViewProps> = ({
  patients = [],
  clinicalNotes = [],
  activeMedicines = [],
  vaultItems = [],
  metricLogs = [],
  appointments = [],
  selectedPatientId,
  onAddClinicalNote,
  onAddActiveMedicine,
  onAddVaultItem,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePatientId, setActivePatientId] = useState<string>(
    selectedPatientId || patients[0]?.id || 'usr_001'
  );

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'notes' | 'prescriptions' | 'vault' | 'vitals'>('overview');

  // SOAP Note Form State
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.abhaNumber && p.abhaNumber.includes(searchTerm))
  );

  const currentPatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const patientNotes = clinicalNotes.filter((n) => n.patientId === currentPatient?.id);

  const handleSaveSOAPNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective || !assessment || !currentPatient) return;

    const newNote: ClinicalNote = {
      id: `cn_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      doctorId: 'doc_01',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      date: new Date().toISOString().split('T')[0],
      type: 'SOAP Note',
      subjective,
      objective: objective || 'Vitals stable on examination.',
      assessment,
      plan: plan || 'Follow up as required.',
      vitals: { bp: '124/80', pulse: 74, temp: 98.6, spO2: 98 },
      doctorSignature: 'Dr. Rajeshwar K. Tripathi (M.D. Pulmonology - Reg # KGMU-48219)',
      isLocked: true,
    };

    onAddClinicalNote(newNote);

    // Also copy summary note to patient's medical vault
    onAddVaultItem({
      id: `v_soap_${Date.now()}`,
      title: `Consultation SOAP Note - ${newNote.date}`,
      category: 'Doctor Note',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      diseaseOrTag: assessment,
      date: newNote.date,
      fileSize: '850 KB',
      fileType: 'pdf',
      notes: `Assessment: ${assessment}`,
    });

    setNoteSuccess(true);
    setTimeout(() => {
      setNoteSuccess(false);
      setShowNoteForm(false);
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
    }, 1500);
  };

  if (!currentPatient) {
    return <div className="p-8 text-center text-slate-500">No authorized patients found in roster.</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Patient Search & Quick Filter */}
      <div className="bg-white dark:bg-[#16241c] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name, email, or ABHA ID..."
              className="w-full pl-10 pr-4 min-h-[44px] py-2 bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1a5336] text-[#142b20] dark:text-[#f2f0e8]"
            />
          </div>
          <span className="text-xs text-[#827b6c] dark:text-[#969082] font-semibold whitespace-nowrap px-1">
            {filteredPatients.length} Authorized Patients
          </span>
        </div>

        <button
          onClick={() => setShowNoteForm(true)}
          className="w-full md:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-[#1a5336] hover:bg-[#143e29] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
        >
          <Plus className="w-4 h-4" />
          <span>New SOAP Note for {currentPatient.name}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Patient List Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#16241c] rounded-2xl p-4 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#827b6c] dark:text-[#969082] px-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" /> Patient Directory
          </h3>

          <div className="space-y-2 max-h-[300px] lg:max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.map((pat) => {
              const isSelected = pat.id === activePatientId;
              return (
                <div
                  key={pat.id}
                  onClick={() => setActivePatientId(pat.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 min-h-[44px] ${
                    isSelected
                      ? 'bg-[#153424] text-white border-[#1a5336] shadow-md ring-1 ring-[#1a5336]/50'
                      : 'bg-[#fcfaf6] dark:bg-[#1d2e23] border-[#e6dfd3] dark:border-[#283c2e] hover:border-[#d2ded0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{pat.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-[#234c35] text-[#a3d4b6]' : 'bg-[#f6f2e9] dark:bg-[#283c2e] text-[#5c5647] dark:text-[#c0b9ad]'
                    }`}>
                      {pat.gender}, {pat.age}y
                    </span>
                  </div>

                  <p className={isSelected ? 'text-emerald-200 text-[11px]' : 'text-[#827b6c] dark:text-[#969082] text-[11px]'}>
                    ABHA: {pat.abhaNumber || 'Not Linked'}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                    <span className={isSelected ? 'text-emerald-300 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                      ⚠️ Allergies: {pat.allergies.join(', ') || 'None'}
                    </span>
                    <span className={isSelected ? 'text-slate-300' : 'text-[#827b6c] dark:text-[#969082]'}>
                      Last Visit: {pat.lastVisitDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Comprehensive Patient Clinical Chart (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Demographic & Risk Header */}
          <div className="bg-white dark:bg-[#16241c] rounded-2xl p-4 sm:p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6dfd3] dark:border-[#283c2e] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">
                    {currentPatient.name}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-[#f6f2e9] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-bold text-[#5c5647] dark:text-[#c0b9ad]">
                    {currentPatient.age} yrs • {currentPatient.gender} • Blood: <strong className="text-rose-600">{currentPatient.bloodGroup}</strong>
                  </span>
                </div>
                <p className="text-xs text-[#827b6c] dark:text-[#969082] mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Phone: {currentPatient.phone}</span>
                  <span>•</span>
                  <span>ABHA: {currentPatient.abhaNumber || 'Not Linked'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('doctor-prescriptions')}
                  className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1a5336] hover:bg-[#143e29] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Issue e-Rx</span>
                </button>
                <button
                  onClick={() => setActiveTab('doctor-ai')}
                  className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>AI Chart Summary</span>
                </button>
              </div>
            </div>

            {/* Critical Clinical Alerts: Allergies & Chronic Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Documented Drug Allergies
                </span>
                <p className="font-bold text-[#142b20] dark:text-[#f2f0e8]">
                  {currentPatient.allergies.length > 0 ? currentPatient.allergies.join(', ') : 'No known drug allergies (NKDA)'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-amber-600" /> Chronic Medical Conditions
                </span>
                <p className="font-bold text-[#142b20] dark:text-[#f2f0e8]">
                  {currentPatient.chronicConditions.length > 0 ? currentPatient.chronicConditions.join(', ') : 'None documented'}
                </p>
              </div>
            </div>

            {/* Sub-tab Switcher inside Patient Chart */}
            <div className="flex border-b border-[#e6dfd3] dark:border-[#283c2e] overflow-x-auto scrollbar-none gap-4 pt-2">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`min-h-[44px] pb-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                  activeSubTab === 'overview'
                    ? 'border-[#1a5336] text-[#1a5336] dark:text-[#a3d4b6]'
                    : 'border-transparent text-[#827b6c] hover:text-[#142b20] dark:text-[#969082]'
                }`}
              >
                Chart Overview
              </button>
              <button
                onClick={() => setActiveSubTab('notes')}
                className={`min-h-[44px] pb-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                  activeSubTab === 'notes'
                    ? 'border-[#1a5336] text-[#1a5336] dark:text-[#a3d4b6]'
                    : 'border-transparent text-[#827b6c] hover:text-[#142b20] dark:text-[#969082]'
                }`}
              >
                Clinical SOAP Notes ({patientNotes.length})
              </button>
              <button
                onClick={() => setActiveSubTab('prescriptions')}
                className={`min-h-[44px] pb-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                  activeSubTab === 'prescriptions'
                    ? 'border-[#1a5336] text-[#1a5336] dark:text-[#a3d4b6]'
                    : 'border-transparent text-[#827b6c] hover:text-[#142b20] dark:text-[#969082]'
                }`}
              >
                Active Medications
              </button>
              <button
                onClick={() => setActiveSubTab('vault')}
                className={`min-h-[44px] pb-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                  activeSubTab === 'vault'
                    ? 'border-[#1a5336] text-[#1a5336] dark:text-[#a3d4b6]'
                    : 'border-transparent text-[#827b6c] hover:text-[#142b20] dark:text-[#969082]'
                }`}
              >
                Patient Vault Reports ({vaultItems.length})
              </button>
            </div>
          </div>

          {/* SOAP NOTE FORM MODAL / EXPANDABLE PANEL */}
          {showNoteForm && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base">New Structured SOAP Clinical Note</h3>
                </div>
                <button
                  onClick={() => setShowNoteForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {noteSuccess && (
                <div className="p-3 bg-emerald-950 text-emerald-200 border border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SOAP Note recorded and synced to patient's Medical Vault!</span>
                </div>
              )}

              <form onSubmit={handleSaveSOAPNote} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    [S] Subjective (Chief Complaint & History of Present Illness)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    placeholder="Patient reports cough for 3 days, low grade fever..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    [O] Objective (Examination Findings & Vitals)
                  </label>
                  <textarea
                    rows={2}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="BP 122/80, Pulse 76. Chest auscultation shows clear breath sounds..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    [A] Assessment (Clinical Diagnosis / Impressions)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Acute upper respiratory infection..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    [P] Plan (Medications, Lab Orders, Follow-up Instructions)
                  </label>
                  <textarea
                    rows={2}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Prescribed Amoxicillin 500mg TID x 7 days..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNoteForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Save & Lock Clinical Note
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-tab Content Area */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Recent Vitals & Logs */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Patient-Logged Vitals & History
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs min-w-0">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] font-bold block">Blood Pressure</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100">122/80 mmHg</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] font-bold block">Blood Glucose</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100">118 mg/dL</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] font-bold block">Body Weight</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100">68.5 kg</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] font-bold block">SpO2 Level</span>
                    <span className="text-base font-bold text-emerald-600">98%</span>
                  </div>
                </div>
              </div>

              {/* Recent SOAP Note Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Latest Doctor Clinical Assessment
                  </h4>
                  <button
                    onClick={() => setActiveSubTab('notes')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View All Notes →
                  </button>
                </div>

                {patientNotes.length > 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span>{patientNotes[0].type} • {patientNotes[0].date}</span>
                      <span className="text-emerald-600 font-mono text-[10px]">Locked & Signed</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Assessment:</strong> {patientNotes[0].assessment}
                    </p>
                    <p className="text-slate-500">
                      <strong>Plan:</strong> {patientNotes[0].plan}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous clinical notes recorded for this patient.</p>
                )}
              </div>

            </div>
          )}

          {activeSubTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Clinical SOAP Notes History
                </h4>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  + Add New SOAP Note
                </button>
              </div>

              {patientNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 font-bold">
                    <span className="text-slate-900 dark:text-white">{note.type} • {note.date}</span>
                    <span className="text-slate-500 font-normal">{note.doctorSignature}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400 block">[S] Subjective:</strong>
                      <p>{note.subjective}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400 block">[O] Objective:</strong>
                      <p>{note.objective}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400 block">[A] Assessment:</strong>
                      <p>{note.assessment}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400 block">[P] Plan:</strong>
                      <p>{note.plan}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSubTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Patient Active Medications ({activeMedicines.length})
                </h4>
                <button
                  onClick={() => setActiveTab('doctor-prescriptions')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  + Issue New Prescription
                </button>
              </div>

              <div className="space-y-2">
                {activeMedicines.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span>{med.name} ({med.dosage})</span>
                      <span className="text-emerald-600">{med.frequency}</span>
                    </div>
                    <p className="text-slate-500">Active Salt: {med.salt}</p>
                    <p className="text-slate-500">Duration: {med.duration} • Doctor: {med.doctorName || 'Prescribed'}</p>
                    {med.instructions && (
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">Instructions: {med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'vault' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Medical Vault Records Uploaded By Patient ({vaultItems.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vaultItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span className="truncate">{item.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-slate-500">Date: {item.date} • Size: {item.fileSize}</p>
                    {item.notes && <p className="text-slate-600 dark:text-slate-300">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
