import React, { useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Bot,
  User,
  Calendar,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { ClinicalNote, PatientSummaryForDoctor, VaultItem } from '../../types';

interface DoctorClinicalNotesViewProps {
  clinicalNotes: ClinicalNote[];
  patients: PatientSummaryForDoctor[];
  onAddClinicalNote: (note: ClinicalNote) => void;
  onAddVaultItem: (item: VaultItem) => void;
}

export const DoctorClinicalNotesView: React.FC<DoctorClinicalNotesViewProps> = ({
  clinicalNotes = [],
  patients = [],
  onAddClinicalNote,
  onAddVaultItem,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'usr_001');
  const [noteType, setNoteType] = useState<'SOAP Note' | 'Progress Note' | 'Discharge Summary' | 'Pre-Op Evaluation'>('SOAP Note');

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [bp, setBp] = useState('122/80');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6');
  const [spO2, setSpO2] = useState('98');

  const [searchQuery, setSearchQuery] = useState('');
  const [issuedSuccess, setIssuedSuccess] = useState(false);
  const [aiStructuring, setAiStructuring] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleAiAutoStructure = () => {
    if (!subjective && !assessment) {
      setSubjective('Patient reports mild dry cough x 3 days, throat tickle, no fever or shortness of breath.');
      setAssessment('Acute mild pharyngitis / viral upper respiratory tract irritation.');
    }
    setAiStructuring(true);
    setTimeout(() => {
      setAiStructuring(false);
      if (!objective) setObjective('Pharyngeal erythema present without exudates. Lungs clear to auscultation bilaterally. SpO2 98%.');
      if (!plan) setPlan('1. Warm saline gargles TID.\n2. Hydration & voice rest.\n3. Paracetamol 500mg PRN for throat discomfort.\n4. Follow up if fever > 100.4°F develops.');
    }, 800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !subjective || !assessment) return;

    const newNote: ClinicalNote = {
      id: `cn_${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc_01',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      date: new Date().toISOString().split('T')[0],
      type: noteType,
      subjective,
      objective: objective || 'Vitals stable on clinical evaluation.',
      assessment,
      plan: plan || 'Routine monitoring as advised.',
      vitals: {
        bp,
        pulse: parseInt(pulse) || 72,
        temp: parseFloat(temp) || 98.6,
        spO2: parseInt(spO2) || 98,
      },
      doctorSignature: 'Dr. Rajeshwar K. Tripathi (M.D. Pulmonology - Reg # KGMU-48219)',
      isLocked: true,
    };

    onAddClinicalNote(newNote);

    // Sync to patient vault
    onAddVaultItem({
      id: `v_cn_${Date.now()}`,
      title: `${noteType} - ${newNote.date}`,
      category: 'Doctor Note',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      diseaseOrTag: assessment,
      date: newNote.date,
      fileSize: '920 KB',
      fileType: 'pdf',
      notes: `Assessment: ${assessment}`,
    });

    setIssuedSuccess(true);
    setTimeout(() => {
      setIssuedSuccess(false);
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
    }, 2000);
  };

  const filteredNotes = clinicalNotes.filter(
    (n) =>
      n.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.assessment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Structured SOAP Clinical Notes Pad</h2>
            <p className="text-xs text-slate-300">
              Standardized clinical documentation automatically synced to patient records & ABHA health vault.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAiAutoStructure}
          disabled={aiStructuring}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{aiStructuring ? 'Formatting...' : 'AI Format SOAP Draft'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Create New SOAP Note Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" /> New Clinical Record
            </h3>
            <span className="text-xs text-slate-400 font-mono">SOAP Standard Format</span>
          </div>

          {issuedSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SOAP Note signed and synced to patient's Medical Vault!</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender}, {p.age}y)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Note Classification
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="SOAP Note">SOAP Consultation Note</option>
                  <option value="Progress Note">Inpatient / Outpatient Progress</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Pre-Op Evaluation">Pre-Operative Assessment</option>
                </select>
              </div>
            </div>

            {/* Examination Vitals Inputs */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                Objective Vitals On Examination
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">BP (mmHg)</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Temp (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">SpO2 (%)</label>
                  <input
                    type="text"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  [S] Subjective — Symptoms & Patient Complaints
                </label>
                <textarea
                  required
                  rows={2}
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="e.g. Patient presents with cough x 4 days..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  [O] Objective — Physical Findings & Diagnostic Reports
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Chest auscultation shows mild rhonchi..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  [A] Assessment — Diagnosis & Clinical Impressions
                </label>
                <textarea
                  required
                  rows={2}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g. Acute upper respiratory tract infection..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  [P] Plan — Treatment Strategy, Refills & Follow-up
                </label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="e.g. Prescribed Amoxicillin 500mg TID x 7 days..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                Digitally signed by Dr. Rajeshwar K. Tripathi
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer"
              >
                Sign & Lock SOAP Record
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Historical Clinical SOAP Records (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Recent Clinical Records ({filteredNotes.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient or assessment..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{note.patientName}</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950">
                    {note.date}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong className="text-emerald-700 dark:text-emerald-400">Assessment:</strong> {note.assessment}
                </p>
                <p className="text-slate-500 text-[11px] truncate">
                  <strong>Plan:</strong> {note.plan}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>BP: {note.vitals?.bp || 'N/A'} • Temp: {note.vitals?.temp || '98.6'}°F</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    <Lock className="w-3 h-3 text-emerald-600" /> Signed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
