import React, { useState } from 'react';
import {
  FilePlus,
  Pill,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  Send,
  Sparkles
} from 'lucide-react';
import { ActiveMedicine, PatientSummaryForDoctor, VaultItem } from '../../types';

interface DoctorPrescriptionsViewProps {
  patients: PatientSummaryForDoctor[];
  onAddActiveMedicine: (med: ActiveMedicine) => void;
  onAddVaultItem: (item: VaultItem) => void;
}

export const DoctorPrescriptionsView: React.FC<DoctorPrescriptionsViewProps> = ({
  patients = [],
  onAddActiveMedicine,
  onAddVaultItem,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'usr_001');

  // Form Fields
  const [medName, setMedName] = useState('');
  const [salt, setSalt] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('Twice daily after food');
  const [duration, setDuration] = useState('7 Days');
  const [totalDoses, setTotalDoses] = useState('14');
  const [instructions, setInstructions] = useState('Take with warm water. Finish complete course.');
  const [prescribedFor, setPrescribedFor] = useState('Acute Respiratory Infection');

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [issuedSuccess, setIssuedSuccess] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !selectedPatient) return;
    setShowConfirmModal(true);
  };

  const handleFinalizePrescription = () => {
    if (!selectedPatient || !medName) return;

    const newMed: ActiveMedicine = {
      id: `rx_doc_${Date.now()}`,
      name: medName,
      salt: salt || `${medName} Active Salt`,
      dosage,
      frequency,
      duration,
      startDate: new Date().toISOString().split('T')[0],
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      instructions,
      remainingDoses: parseInt(totalDoses) || 14,
      totalDoses: parseInt(totalDoses) || 14,
      prescribedFor,
    };

    onAddActiveMedicine(newMed);

    // Add e-Prescription PDF record to patient's Medical Vault
    onAddVaultItem({
      id: `v_rx_${Date.now()}`,
      title: `Digital Prescription - ${medName}`,
      category: 'Prescription',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      diseaseOrTag: prescribedFor,
      date: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      fileType: 'pdf',
      notes: `Rx: ${medName} ${dosage}, ${frequency} x ${duration}. Instructions: ${instructions}`,
      isImportant: true,
    });

    setShowConfirmModal(false);
    setIssuedSuccess(true);

    setTimeout(() => {
      setIssuedSuccess(false);
      setMedName('');
      setSalt('');
    }, 2500);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-emerald-900/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Digital e-Prescription Generator</h2>
            <p className="text-xs text-emerald-200">
              Verified clinical prescription pad. Directly pushes active dosing schedules & PDF records to patient profile.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
          Authorized Prescriber
        </span>
      </div>

      {issuedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            e-Prescription successfully issued for <strong>{selectedPatient?.name}</strong>! Pushed to active medication schedule & Medical Vault.
          </span>
        </div>
      )}

      {/* Main Prescription Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
        
        <form onSubmit={handleOpenConfirm} className="space-y-5 text-xs">
          
          {/* Patient Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender}, {p.age}y) — ABHA: {p.abhaNumber || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="block font-bold text-slate-500 text-[11px]">Selected Patient Safety Check</span>
              <p className="text-rose-600 font-bold">
                ⚠️ Allergies: {selectedPatient?.allergies.join(', ') || 'No known drug allergies'}
              </p>
              <p className="text-slate-500">
                Chronic Conditions: {selectedPatient?.chronicConditions.join(', ') || 'None'}
              </p>
            </div>
          </div>

          {/* Medicine Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Augmentin / Montair-LC / Telma"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Active Salt / Generic Composition
              </label>
              <input
                type="text"
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dosage / Strength
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frequency
              </label>
              <input
                type="text"
                required
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Twice daily after meals"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Duration
              </label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 7 Days"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Doses / Pills
              </label>
              <input
                type="number"
                value={totalDoses}
                onChange={(e) => setTotalDoses(e.target.value)}
                placeholder="14"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Prescribed For (Indication / Diagnosis)
            </label>
            <input
              type="text"
              value={prescribedFor}
              onChange={(e) => setPrescribedFor(e.target.value)}
              placeholder="e.g. Upper Respiratory Tract Infection"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Special Doctor Instructions & Refill Notes
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Take with warm water. Finish full course..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-400 italic">
              Verification required before finalizing e-Prescription.
            </span>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review & Confirm e-Prescription →</span>
            </button>
          </div>

        </form>

      </div>

      {/* VERIFICATION & CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full p-6 border border-emerald-500/50 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Confirm Clinical e-Prescription</h3>
                <p className="text-xs text-slate-300">Review prescription parameters prior to digital signing.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Patient Name:</span>
                <strong className="text-emerald-400">{selectedPatient?.name}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Medicine & Strength:</span>
                <strong className="text-white">{medName} ({dosage})</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Active Salt:</span>
                <span className="text-slate-200">{salt || medName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Frequency & Duration:</span>
                <span className="text-slate-200">{frequency} x {duration}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Instructions:</span>
                <p className="text-slate-300 italic">{instructions || 'None'}</p>
              </div>
            </div>

            <div className="text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              ⚠️ By clicking confirm, this e-prescription will be digitally signed under Dr. Rajeshwar K. Tripathi (Reg # KGMU-48219) and synced to the patient's active schedule.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalizePrescription}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Issue e-Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
