import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Mic,
  Upload,
  Loader2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { FactCheckResult, RumorClassification } from '../../types';
import { JevanCareLoader } from '../common/JevanCareLoader';

export const FactCheckCenter: React.FC = () => {
  const [claimText, setClaimText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleRumors = [
    'Can antibiotics cure viral fever or common flu?',
    'Does drinking hot lemon water cure COVID-19 or neutralize viruses?',
    'Is every fever caused by a serious bacterial infection requiring antibiotics?',
    'Does eating raw garlic instantly cure high blood pressure without medicine?',
  ];

  const handleRunFactCheck = async (textToVerify?: string) => {
    const finalClaim = textToVerify || claimText;
    if (!finalClaim && !selectedImage) {
      setErrorMsg('Please enter a health claim or upload a rumor image.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: finalClaim,
          imageBase64: selectedImage,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Fact-check analysis failed.');
      }

      setFactCheckResult({
        id: `fc_${Date.now()}`,
        claim: json.data.claim || finalClaim,
        classification: (json.data.classification as RumorClassification) || 'Misleading',
        explanation: json.data.explanation || 'Analyzed against global health guidelines.',
        keyTakeaways: json.data.keyTakeaways || [],
        trustedReferences: json.data.trustedReferences || [
          { title: 'World Health Organization (WHO)', url: 'https://www.who.int' },
          { title: 'Centers for Disease Control and Prevention (CDC)', url: 'https://www.cdc.gov' },
        ],
        safeGuidance: json.data.safeGuidance || 'Consult your healthcare provider for clinical evaluation.',
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Fact check error:', err);
      setErrorMsg(err.message || 'Verification service failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getClassificationBadge = (cls: RumorClassification) => {
    switch (cls) {
      case 'True':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> True & Scientifically Valid
          </span>
        );
      case 'False':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
            <XCircle className="w-4 h-4 text-rose-600" /> False / Health Myth
          </span>
        );
      case 'Misleading':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Misleading / Context Missing
          </span>
        );
      case 'Partially True':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
            <HelpCircle className="w-4 h-4 text-blue-600" /> Partially True
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Medical Rumor & Misinformation Fact-Checker</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Combat health misinformation with evidence-based verification against WHO, CDC, and PubMed clinical literature.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ask or Paste Health Rumor / Claim
        </label>

        <div className="relative">
          <textarea
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            placeholder="Type any medical claim or rumor (e.g. 'Can hot water cure COVID-19?')..."
            rows={3}
            className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Sample Rumors Quick Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">Try common viral health claims:</span>
          <div className="flex flex-wrap gap-2">
            {sampleRumors.map((rumor, i) => (
              <button
                key={i}
                onClick={() => {
                  setClaimText(rumor);
                  handleRunFactCheck(rumor);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all text-left"
              >
                "{rumor}"
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-xs font-medium flex items-center gap-2 border border-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={() => handleRunFactCheck()}
          disabled={isAnalyzing}
          className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <JevanCareLoader size="sm" color="white" label="Verifying with Trusted Medical Literature..." />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fact-Check Claim with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Fact-Check Result Card */}
      {factCheckResult && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-md space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Claim Analyzed:</span>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-0.5">
                "{factCheckResult.claim}"
              </h3>
            </div>
            <div>{getClassificationBadge(factCheckResult.classification)}</div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-600" /> Clinical Reasoning & Evidence
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {factCheckResult.explanation}
            </p>
          </div>

          {/* Key Takeaways */}
          {factCheckResult.keyTakeaways.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Key Scientific Takeaways</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {factCheckResult.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safe Guidance */}
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs space-y-1">
            <span className="font-bold block">Safe Evidence-Based Guidance:</span>
            <p className="leading-relaxed">{factCheckResult.safeGuidance}</p>
          </div>

          {/* Trusted References */}
          {factCheckResult.trustedReferences.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Trusted References & Citations:</span>
              <div className="flex flex-wrap gap-2">
                {factCheckResult.trustedReferences.map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    <span>{ref.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
