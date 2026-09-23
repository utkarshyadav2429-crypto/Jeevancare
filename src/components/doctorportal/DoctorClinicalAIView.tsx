import React, { useState } from 'react';
import {
  Bot,
  AlertTriangle,
  Sparkles,
  FileText,
  Search,
  CheckCircle2,
  Send,
  Users,
  ShieldCheck,
  Stethoscope,
  BookOpen
} from 'lucide-react';
import { PatientSummaryForDoctor, VaultItem, ClinicalNote } from '../../types';

interface DoctorClinicalAIViewProps {
  patients: PatientSummaryForDoctor[];
  vaultItems: VaultItem[];
  clinicalNotes: ClinicalNote[];
}

export const DoctorClinicalAIView: React.FC<DoctorClinicalAIViewProps> = ({
  patients = [],
  vaultItems = [],
  clinicalNotes = [],
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'usr_001');
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleQuickPrompt = (promptText: string) => {
    setQuery(promptText);
    runClinicalAi(promptText);
  };

  const runClinicalAi = (promptToRun?: string) => {
    const activePrompt = promptToRun || query;
    if (!activePrompt.trim()) return;

    setIsThinking(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsThinking(false);

      if (activePrompt.toLowerCase().includes('summary') || activePrompt.toLowerCase().includes('chart')) {
        setAiResponse(`
### Clinical Chart Summary for ${selectedPatient?.name} (Age ${selectedPatient?.age}, ${selectedPatient?.gender})

**Primary Clinical Profile:**
- **Documented Allergies:** ${selectedPatient?.allergies.join(', ') || 'NKDA'}
- **Chronic Conditions:** ${selectedPatient?.chronicConditions.join(', ') || 'None'}
- **Recent Vitals:** ${selectedPatient?.recentVitalsSummary || 'BP 122/80 mmHg, SpO2 98%'}

**Key Historical Insights:**
1. **Respiratory Record:** Patient has a history of seasonal rhinitis and mild asthma. Last consult on 05/08/2026 noted upper respiratory tract irritation treated with Amoxicillin Trihydrate & Montelukast.
2. **Medical Vault Documents:** ${vaultItems.length} documents uploaded, including CBC Lab Reports and Digital Prescriptions.
3. **Medication Adherence:** 3 active prescriptions logged with no reported contraindications.

**AI Decision Support Note:** Patient is stable. If prescribing new anti-infectives, confirm no history of penicillin allergy sensitivity.
        `);
      } else if (activePrompt.toLowerCase().includes('interaction') || activePrompt.toLowerCase().includes('drug')) {
        setAiResponse(`
### Drug Interaction & Safety Review

**Active Regimen:** Amoxicillin 500mg, Montelukast 10mg, Metformin 500mg ER.

**Interaction Analysis:**
- **Amoxicillin + Montelukast:** No major pharmacokinetic interaction. Safe co-administration.
- **Metformin + Amoxicillin:** Minor risk of mild GI upset. Recommend taking Metformin with meals.
- **Allergy Check:** ${selectedPatient?.allergies.includes('Penicillin') ? '⚠️ CRITICAL WARNING: Patient has documented Penicillin allergy. Beta-lactams like Amoxicillin should be replaced with Macrolides (e.g., Azithromycin).' : '✅ No documented penicillin sensitivity recorded for current regimen.'}
        `);
      } else {
        setAiResponse(`
### Clinical Literature & Guideline Synthesis

**Clinical Evaluation Query:** "${activePrompt}"

**Guideline Recommendations (ICMR & International Chest Guidelines):**
1. **Diagnostic Criteria:** Evaluate for viral vs. bacterial etiology using Centor/McIsaac criteria.
2. **Symptomatic Management:** First-line supportive therapy includes adequate hydration, throat lozenges, and antipyretics (Paracetamol 500-650mg PRN).
3. **Escalation Protocol:** Consider sputum culture or chest radiograph if fever persists > 72 hours or if SpO2 drops below 95%.
        `);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* MANDATORY CLINICAL AI DISCLAIMER BANNER */}
      <div className="bg-indigo-950 border-2 border-indigo-500/60 rounded-2xl p-4 text-indigo-100 shadow-lg flex items-start gap-3.5">
        <AlertTriangle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <span>Mandatory Clinical AI Notice</span>
            <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 text-[10px] font-mono">
              Grounded Guidance
            </span>
          </h2>
          <p className="leading-relaxed">
            AI-assisted clinical summary and decision support tools are intended solely to assist licensed medical practitioners. <strong>Review original patient vault documents and conduct direct clinical evaluations before making diagnosis or prescribing decisions.</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Context & Quick Triggers (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Patient Context
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gender}, {p.age}y)
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">{selectedPatient.name}</p>
              <p className="text-slate-500">ABHA: {selectedPatient.abhaNumber || 'Not Linked'}</p>
              <p className="text-rose-600 font-bold">
                Allergies: {selectedPatient.allergies.join(', ') || 'NKDA'}
              </p>
              <p className="text-slate-500">
                Conditions: {selectedPatient.chronicConditions.join(', ') || 'None'}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Clinical AI Actions
            </span>
            <button
              onClick={() => handleQuickPrompt(`Summarize full clinical chart for ${selectedPatient?.name}`)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-between"
            >
              <span>📊 Summarize Patient Chart</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            <button
              onClick={() => handleQuickPrompt(`Check drug interactions for active medications of ${selectedPatient?.name}`)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-between"
            >
              <span>💊 Check Drug Interactions</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            <button
              onClick={() => handleQuickPrompt(`Synthesize latest ICMR guidelines for upper respiratory symptoms`)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-between"
            >
              <span>📖 Search ICMR Guidelines</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Output & Interactive Clinical Query Console (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Clinical AI Query Console
              </h3>
            </div>
            <span className="text-xs text-slate-400">Context: {selectedPatient?.name}</span>
          </div>

          {/* AI Response Display Window */}
          <div className="min-h-[300px] p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 font-sans text-xs leading-relaxed space-y-3">
            {isThinking ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-indigo-200 font-semibold">
                  Synthesizing patient vault records & clinical guidelines...
                </p>
              </div>
            ) : aiResponse ? (
              <div className="whitespace-pre-wrap font-sans text-xs text-slate-200 space-y-2">
                {aiResponse}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2 text-center">
                <Bot className="w-10 h-10 text-indigo-500/40" />
                <p className="font-semibold text-slate-400">Ask the Clinical AI Assistant</p>
                <p className="text-[11px] max-w-sm">
                  Select a quick prompt or enter custom queries regarding patient history, lab values, or treatment guidelines.
                </p>
              </div>
            )}
          </div>

          {/* Query Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runClinicalAi();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask Clinical AI regarding ${selectedPatient?.name}...`}
              className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={isThinking || !query.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Query AI</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
