import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, X, CheckCircle2, BookOpen, Share2, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { VaultItem } from '../../types';

interface DocumentSummaryModalProps {
  vaultItem: VaultItem;
  onClose: () => void;
  onDownload: (item: VaultItem) => void;
}

interface SummaryData {
  simpleSummary: string;
  extractedMedicines: string[];
  medicalTermsExplained: { term: string; definition: string }[];
  keyTakeaways: string[];
  sharingNote: string;
}

export const DocumentSummaryModal: React.FC<DocumentSummaryModalProps> = ({
  vaultItem,
  onClose,
  onDownload
}) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gemini/document-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vaultItem })
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setSummaryData(json.data);
        }
      } catch (err) {
        console.error('Document summary error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [vaultItem]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#16241c] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xl p-5 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200 flex flex-col"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-[#d2ded0] dark:bg-[#2a4435] rounded-full mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close summary modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 min-h-[44px] min-w-[44px] p-2 rounded-full hover:bg-[#f6f2e9] dark:hover:bg-[#1d2e23] text-[#827b6c] hover:text-[#142b20] dark:hover:text-[#f2f0e8] transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center shrink-0 border border-[#d2ded0] dark:border-[#2a4435]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e8eee5] text-[#1a5336] dark:bg-[#23382b] dark:text-[#a3d4b6] text-[10px] font-bold border border-[#d2ded0] dark:border-[#2a4435]">
                {vaultItem.category}
              </span>
              <span className="text-xs text-[#827b6c] dark:text-[#969082] font-medium">{vaultItem.date}</span>
            </div>
            <h3 id="summary-modal-title" className="text-lg sm:text-xl font-bold text-[#142b20] dark:text-[#f2f0e8] mt-0.5 font-serif-editorial">
              AI Summary: {vaultItem.title}
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] mt-0.5">
              Doctor: {vaultItem.doctorName || 'N/A'} • Tag: {vaultItem.diseaseOrTag}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-3 bg-[#fcfaf6] dark:bg-[#1d2e23] rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e]">
            <RefreshCw className="w-8 h-8 text-[#1a5336] dark:text-[#a3d4b6] animate-spin mx-auto" />
            <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] font-medium">Generating factual clinical summary & terminology decoder...</p>
          </div>
        )}

        {/* Content */}
        {!loading && summaryData && (
          <div className="space-y-5 flex-1 overflow-y-auto pr-1">
            {/* Plain English Summary */}
            <div className="p-4 bg-[#e8eee5]/60 dark:bg-[#23382b]/50 rounded-2xl border border-[#d2ded0] dark:border-[#2a4435] space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a5336] dark:text-[#a3d4b6] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" /> Summary
              </h4>
              <p className="text-xs sm:text-sm text-[#142b20] dark:text-[#f2f0e8] leading-relaxed font-sans">
                {summaryData.simpleSummary}
              </p>
            </div>

            {/* Extracted Medicines */}
            {summaryData.extractedMedicines && summaryData.extractedMedicines.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#827b6c] dark:text-[#969082]">
                  Prescribed / Mentioned Medications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.extractedMedicines.map((med, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#fcfaf6] dark:bg-[#1d2e23] text-[#142b20] dark:text-[#f2f0e8] rounded-xl text-xs font-semibold border border-[#e6dfd3] dark:border-[#283c2e]">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Terms Explained */}
            {summaryData.medicalTermsExplained && summaryData.medicalTermsExplained.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#827b6c] dark:text-[#969082] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#1a5336] dark:text-[#a3d4b6]" /> Medical Terminology Decoder
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {summaryData.medicalTermsExplained.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#fcfaf6] dark:bg-[#1d2e23] rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] text-xs">
                      <span className="font-bold text-[#142b20] dark:text-[#f2f0e8]">{item.term}: </span>
                      <span className="text-[#5c5647] dark:text-[#c0b9ad]">{item.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Clinical Takeaways */}
            {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#827b6c] dark:text-[#969082]">Key Conclusions</h4>
                <ul className="space-y-1.5 text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                  {summaryData.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#fcfaf6] dark:bg-[#1d2e23] p-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Doctor Sharing Note */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 font-medium">
              💡 <span className="font-bold">Sharing Note for Doctors: </span>{summaryData.sharingNote}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#e6dfd3] dark:border-[#283c2e]">
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#f6f2e9] dark:bg-[#1d2e23] hover:bg-[#eae4d7] text-[#142b20] dark:text-[#f2f0e8] rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onDownload(vaultItem);
                  onClose();
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#1a5336] hover:bg-[#143e29] text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
              >
                <Download className="w-4 h-4" />
                <span>Download Original Document</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
