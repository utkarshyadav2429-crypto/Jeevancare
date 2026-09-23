import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  ExternalLink,
  Phone,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  GovernmentBenefitScheme,
  EconomicProfile,
  SchemeCoverageCategory
} from '../../types';
import { verifiedGovernmentSchemes } from '../../data/officialGovernmentData';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';

interface GovernmentSchemesViewProps {
  economicProfile: EconomicProfile | null;
  userState?: string;
  onOpenEconomicModal: () => void;
}

export const GovernmentSchemesView: React.FC<GovernmentSchemesViewProps> = ({
  economicProfile,
  userState = 'Uttar Pradesh',
  onOpenEconomicModal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const matchedResults = accessibilityIntelligenceService.matchGovernmentSchemes(
    economicProfile,
    [],
    userState
  );

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Public Schemes' },
    { id: 'Hospitalization & Surgeries', label: 'Inpatient & Surgeries (PM-JAY)' },
    { id: 'Generic Medicines & Discounts', label: 'Generic Medicines (PMBJP)' },
    { id: 'Critical Illness Emergency Relief', label: 'Super-Specialty Aid (RAN)' },
    { id: 'Direct Financial Grant / e-Kosh', label: 'e-Kosh / State Grants' },
    { id: 'Elderly & Geriatric Healthcare', label: 'Senior Care (NPHCE)' }
  ];

  const filteredMatches = matchedResults.filter((match) => {
    const s = match.scheme;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Economic Profile Link */}
      <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <Building2 className="w-4 h-4" />
            <span>Government Health Schemes & e-Kosh Direct Relief Registry</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Official Public Healthcare Benefits & Assistance
          </h2>
          <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
            Verified national and state health assurance programs. Matches are calculated transparently using your voluntary economic parameters.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenEconomicModal}
            className="px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#254d39] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Update Economic Profile</span>
          </button>
        </div>
      </div>

      {/* Official Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#827b6c] dark:text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
          <strong>Official Integrity Notice:</strong> JeevanCare evaluates potential eligibility based on public criteria published by the Ministry of Health and Family Welfare (MoHFW), National Health Authority (NHA), and State Health Assurance Societies. Final verification is conducted via official biometric e-KYC or District Magistrate/CMO desks.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#827b6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, code (PM-JAY, RAN, PMBJP, e-Kosh), or authority..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] bg-white dark:bg-[#1a2b21] text-xs font-semibold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1b3b2b] text-white dark:bg-emerald-400 dark:text-slate-950'
                    : 'bg-white dark:bg-[#1a2b21] text-[#5c5647] dark:text-[#c0b9ad] border border-[#e6dfd3] dark:border-[#283c2e] hover:bg-[#fcfaf6]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#16241c] rounded-3xl border border-[#e6dfd3] dark:border-[#283c2e]">
            <p className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              No schemes matching your search filter.
            </p>
            <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] mt-1">
              Try adjusting your search terms or category selection.
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const s = match.scheme;
            const isExpanded = expandedSchemeId === s.id;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 transition-all hover:shadow-xs space-y-4"
              >
                {/* Top Badge & Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eae3d5] dark:bg-[#253a2d] text-[#1b3b2b] dark:text-[#f2f0e8]">
                        {s.level}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {s.category}
                      </span>
                      {s.eKoshTreasuryIntegrated && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          e-Kosh Treasury Integrated
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#1b3b2b] dark:text-white pt-1">
                      {s.name} ({s.shortName})
                    </h3>
                    <p className="text-xs font-semibold text-[#827b6c] dark:text-slate-400">
                      Authority: {s.authority}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        match.matchLevel === 'Strong Potential Match'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : match.matchLevel === 'General Universal Benefit'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : match.matchLevel === 'Potential Match'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {match.matchLevel} ({match.matchPercentage}%)
                    </span>
                  </div>
                </div>

                {/* Coverage Summary Box */}
                <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#827b6c] dark:text-slate-400">
                      Coverage & Financial Benefit
                    </p>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                      {s.coverageAmountDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={s.applicationPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#1b3b2b] hover:bg-[#254d39] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Key Benefits List */}
                <div className="space-y-1.5 text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                  <p className="font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">Core Highlights:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(s.keyBenefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expand / Collapse Details for Documents and Action Steps */}
                {isExpanded && (
                  <div className="pt-4 border-t border-[#e6dfd3] dark:border-[#283c2e] space-y-4 animate-fade-in text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Documents Checklist */}
                      <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
                        <h4 className="font-bold text-[#1b3b2b] dark:text-white flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>Required Documents Checklist</span>
                        </h4>
                        <ul className="space-y-1.5">
                          {(s.requiredDocuments || []).map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-[#5c5647] dark:text-[#c0b9ad]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Matching Factors & Next Steps */}
                      <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
                        <h4 className="font-bold text-[#1b3b2b] dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>Profile Match Breakdown</span>
                        </h4>
                        <div className="space-y-1 text-[#5c5647] dark:text-[#c0b9ad]">
                          {(match.matchingFactors || []).map((fact, i) => (
                            <p key={i} className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{fact}</span>
                            </p>
                          ))}
                          {(match.missingOrUnmetFactors || []).map((unmet, i) => (
                            <p key={i} className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>{unmet}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span className="font-bold text-[#1b3b2b] dark:text-white">Official Helpline:</span>
                        <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">{s.officialHelpline}</span>
                      </div>
                      <span className="text-[10px] text-[#827b6c]">Verified: {s.lastVerifiedDate}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setExpandedSchemeId(isExpanded ? null : s.id)}
                  className="w-full pt-2 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Scheme Verification Details' : 'View Application Protocol & Document Checklist'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
