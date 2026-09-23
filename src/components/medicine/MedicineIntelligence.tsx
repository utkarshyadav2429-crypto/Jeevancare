import React, { useState } from 'react';
import {
  Pill,
  Search,
  ShieldAlert,
  IndianRupee,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Activity,
  History,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Plus
} from 'lucide-react';
import { MedicineDetail, ActiveMedicine, MedicineUsageLog } from '../../types';
import { initialMedicineDirectory } from '../../data/initialData';
import { JevanCareLoader } from '../common/JevanCareLoader';

interface MedicineIntelligenceProps {
  medicineDirectory?: MedicineDetail[];
  activeMedicines: ActiveMedicine[];
  onAddActiveMedicine: (med: ActiveMedicine) => void;
  setActiveTab: (tab: string) => void;
}

export const MedicineIntelligence: React.FC<MedicineIntelligenceProps> = ({
  medicineDirectory = initialMedicineDirectory,
  activeMedicines = [],
  onAddActiveMedicine,
  setActiveTab,
}) => {
  const safeDirectory = medicineDirectory || [];
  const safeActive = activeMedicines || [];

  const [search, setSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<MedicineDetail>(safeDirectory[0]);
  const [subTab, setSubTab] = useState<'intelligence' | 'tracker'>('intelligence');
  
  // AI Risk Audit state connected to server API
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const runRiskAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/gemini/check-medicine-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeMedicines: safeActive,
          allergies: ['Dust', 'Penicillin (mild)']
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.data);
      }
    } catch (err) {
      console.error('Failed to run AI risk audit:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Usage logs state
  const [usageLogs, setUsageLogs] = useState<MedicineUsageLog[]>([
    { id: 'ul_1', medicineName: 'Amoxicillin 500mg', takenAt: 'Today, 08:30 AM', status: 'taken' },
    { id: 'ul_2', medicineName: 'Amoxicillin 500mg', takenAt: 'Yesterday, 08:30 PM', status: 'taken' },
    { id: 'ul_3', medicineName: 'Montelukast 10mg', takenAt: 'Yesterday, 09:30 PM', status: 'taken' },
    { id: 'ul_4', medicineName: 'Amoxicillin 500mg', takenAt: 'Yesterday, 02:00 PM', status: 'missed' },
  ]);

  const filteredMeds = safeDirectory.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.saltComposition.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  // Prolonged usage check logic
  const isProlongedUsage = safeActive.some(
    (m) => m.name.includes('Amoxicillin') && parseInt(m.duration) >= 7
  );

  return (
    <div className="space-y-6">

      {/* Header & Subtab Switcher */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Smart Medicine Intelligence & Usage Tracker</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In-depth salt compositions, generic price comparisons, risk levels, and AI overuse detection.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setSubTab('intelligence')}
            className={`px-4 py-2 rounded-lg transition-all ${
              subTab === 'intelligence'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Drug Intelligence
          </button>
          <button
            onClick={() => setSubTab('tracker')}
            className={`px-4 py-2 rounded-lg transition-all ${
              subTab === 'tracker'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Usage & Overuse Tracker
          </button>
        </div>
      </div>

      {/* Prolonged Usage / Overuse AI Alert Banner */}
      {isProlongedUsage && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              AI Recommendation: Medical Consultation Advised
            </h4>
            <p className="text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              You have been taking antibiotic medication (Amoxicillin) for 7+ days. If symptoms persist without marked recovery, please consult a qualified healthcare professional instead of extending antibiotic usage independently.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('doctors')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
          >
            Book Doctor
          </button>
        </div>
      )}

      {subTab === 'intelligence' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Search & Directory List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by drug or salt name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
              {filteredMeds.map((m) => {
                const isSelected = selectedMed.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMed(m)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.riskLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {m.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{m.saltComposition}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                      <span>{m.category}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">₹{m.brandPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Medicine Deep Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">

              {/* Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {selectedMed.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-2">
                    {selectedMed.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Active Salt: <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedMed.saltComposition}</span>
                  </p>
                </div>

                <button
                  onClick={() =>
                    onAddActiveMedicine({
                      id: `med_added_${Date.now()}`,
                      name: selectedMed.name,
                      salt: selectedMed.saltComposition,
                      dosage: 'As prescribed',
                      frequency: 'Once daily',
                      duration: '7 Days',
                      startDate: new Date().toISOString().split('T')[0],
                      remainingDoses: 7,
                      totalDoses: 7,
                    })
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Active Schedule</span>
                </button>
              </div>

              {/* Grid Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                {/* Uses */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Primary Indications & Uses
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    {selectedMed.uses.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>

                {/* Side Effects */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-500" /> Potential Side Effects
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    {selectedMed.sideEffects.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Drug Interactions */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Drug & Food Interactions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    {selectedMed.drugInteractions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Pregnancy & Allergy Warnings
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">{selectedMed.pregnancyWarning}</p>
                  <p className="text-rose-600 dark:text-rose-400 font-semibold mt-1">{selectedMed.allergyWarning}</p>
                </div>

              </div>

              {/* Price Comparison & Generic Alternatives ⭐ */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-200 dark:border-teal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Generic Alternatives & Savings</h4>
                  </div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    Brand Price: ₹{selectedMed.brandPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedMed.genericAlternatives.map((gen, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{gen.name}</span>
                        <p className="text-[11px] text-slate-400">Mfg: {gen.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{gen.price.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          Save {Math.round((1 - gen.price / selectedMed.brandPrice) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Usage Tracker Subtab */
        <div className="space-y-6">

          {/* AI Safety Audit Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">AI Drug Interaction & Overuse Audit</h3>
                  <p className="text-xs text-indigo-200/80">Analyze active prescriptions against allergies, salt overlaps, and duration thresholds.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={runRiskAudit}
                disabled={isAuditing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2"
              >
                {isAuditing ? (
                  <JevanCareLoader size="sm" color="white" label="Auditing Active Meds..." />
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-indigo-300" />
                    <span>Run AI Safety Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Audit Result Display */}
            {auditResult && (
              <div className="mt-4 pt-4 border-t border-indigo-800/60 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-200">
                    Audit Status: {auditResult.hasRisks ? '⚠️ Caution / Overlap Detected' : '✅ Safe Medication Schedule'}
                  </span>
                  <span className="text-[10px] text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded-md border border-indigo-700">
                    Backend Verified
                  </span>
                </div>

                <div className="space-y-2">
                  {auditResult.alerts?.map((alert: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{alert.title}</span>
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                          alert.severity === 'high' ? 'bg-rose-500 text-white' : alert.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {alert.severity} Risk
                        </span>
                      </div>
                      <p className="text-indigo-200 text-[11px]">{alert.description}</p>
                      <p className="text-emerald-300 text-[11px] font-semibold mt-1">💡 Recommendation: {alert.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Consumption History & Intake Log
              </h3>
              <span className="text-xs text-slate-400">Recorded Doses: {usageLogs.length}</span>
            </div>

            <div className="space-y-2">
              {usageLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{log.medicineName}</span>
                    <p className="text-[11px] text-slate-400">{log.takenAt}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                      log.status === 'taken'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
