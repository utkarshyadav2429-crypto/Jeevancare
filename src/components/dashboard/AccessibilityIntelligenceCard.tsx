import React from 'react';
import {
  Sparkles,
  Building2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { UserProfile, ActiveMedicine, EconomicProfile } from '../../types';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';

interface AccessibilityIntelligenceCardProps {
  userProfile: UserProfile;
  activeMedicines: ActiveMedicine[];
  economicProfile: EconomicProfile | null;
  onNavigateTab: (tab: string) => void;
}

export const AccessibilityIntelligenceCard: React.FC<AccessibilityIntelligenceCardProps> = ({
  userProfile,
  activeMedicines,
  economicProfile,
  onNavigateTab
}) => {
  const scoreBreakdown = accessibilityIntelligenceService.calculateAccessibilityScore(
    userProfile,
    economicProfile,
    activeMedicines
  );

  const burden = accessibilityIntelligenceService.calculateFinancialBurden(
    activeMedicines,
    economicProfile
  );

  const topSchemes = accessibilityIntelligenceService.matchGovernmentSchemes(
    economicProfile,
    activeMedicines,
    userProfile.state || 'Uttar Pradesh'
  ).slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-[#fcfaf6] to-[#f4ede0] dark:from-[#16241c] dark:to-[#121c16] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              Healthcare Accessibility & Affordability Layer
            </h3>
            <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
              e-Kosh / Government Schemes • Janaushadhi Generic Savings
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-700 text-white shadow-2xs">
          Score: {scoreBreakdown.overallScore}/100 ({scoreBreakdown.ratingTier})
        </span>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Savings Box */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2b21] border border-[#e6dfd3]/80 dark:border-[#283c2e]/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Janaushadhi Generic Savings</span>
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[10px]">
              Up to 90% OFF
            </span>
          </div>
          <p className="text-lg font-extrabold text-[#1b3b2b] dark:text-white">
            ₹{burden.monthlyPotentialGenericSavings.toLocaleString('en-IN')}/mo
          </p>
          <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
            Potential annual relief of ₹{burden.annualPotentialGenericSavings.toLocaleString('en-IN')}/yr on {activeMedicines.length} routine medicines.
          </p>
        </div>

        {/* Top Matched Scheme */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2b21] border border-[#e6dfd3]/80 dark:border-[#283c2e]/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Government Health Shield</span>
            </span>
            <span className="bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded text-[10px]">
              {topSchemes[0]?.matchLevel || 'Eligible'}
            </span>
          </div>
          <p className="text-sm font-bold text-[#1b3b2b] dark:text-white line-clamp-1">
            {topSchemes[0]?.scheme.shortName || 'Ayushman Bharat (PM-JAY)'}
          </p>
          <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad] line-clamp-1">
            {topSchemes[0]?.scheme.coverageAmountDescription || '₹5,00,000 / family / year cashless'}
          </p>
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#e6dfd3]/60 dark:border-[#283c2e]/60">
        <span className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
          State: <strong>{userProfile.state || 'Uttar Pradesh'}</strong> • Burden: <strong>{burden.burdenTier}</strong>
        </span>
        <button
          onClick={() => onNavigateTab('intelligence')}
          className="px-3.5 py-1.5 bg-[#1b3b2b] hover:bg-[#254d39] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <span>Open Intelligence Center</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
        </button>
      </div>
    </div>
  );
};
