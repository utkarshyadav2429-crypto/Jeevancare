import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
  Download,
  Eye,
  ShieldCheck,
  UserCheck,
  Plus
} from 'lucide-react';
import { VaultItem, PatientSummaryForDoctor } from '../../types';

interface DoctorReportsViewProps {
  vaultItems: VaultItem[];
  patients: PatientSummaryForDoctor[];
  setActiveTab: (tab: string) => void;
  onAddVaultItem?: (item: VaultItem) => void;
}

export const DoctorReportsView: React.FC<DoctorReportsViewProps> = ({
  vaultItems = [],
  patients = [],
  setActiveTab,
  onAddVaultItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reviewedReportIds, setReviewedReportIds] = useState<Record<string, boolean>>({});

  const labReports = vaultItems.filter(
    (item) =>
      item.category === 'Lab Report' ||
      item.category === 'Prescription' ||
      item.title.toLowerCase().includes('report') ||
      item.title.toLowerCase().includes('lab') ||
      item.title.toLowerCase().includes('scan') ||
      item.title.toLowerCase().includes('test')
  );

  const filteredReports = labReports.filter((rep) => {
    const matchesSearch =
      rep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.doctorOrFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.tags && rep.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && rep.category !== categoryFilter) return false;
    return true;
  });

  const handleMarkReviewed = (id: string) => {
    setReviewedReportIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Diagnostics & Lab Reports Review</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review patient diagnostic findings, lab results, radiology scans, and signed records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('doctor-records')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderLock className="w-4 h-4 text-emerald-400" />
            <span>Full Medical Vault</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report name, facility, tags..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {['all', 'Lab Report', 'Prescription', 'Discharge Summary'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-700 space-y-3">
          <Activity className="w-12 h-12 mx-auto text-emerald-500/30" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            No diagnostic reports found
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no recent lab reports or diagnostic tests requiring review matching your search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((rep) => {
            const isReviewed = reviewedReportIds[rep.id];
            return (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {rep.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Facility: {rep.doctorOrFacility}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isReviewed
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40'
                      }`}
                    >
                      {isReviewed ? 'Reviewed ✓' : 'Awaiting Review'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {rep.summary || 'Lab report uploaded for doctor evaluation.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mr-2">
                      📅 {rep.date}
                    </span>
                    {rep.tags?.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Vault Record</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isReviewed && (
                      <button
                        onClick={() => handleMarkReviewed(rep.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign Off</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('doctor-records')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
