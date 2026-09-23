import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  HeartHandshake,
  ShieldCheck,
  TrendingDown,
  Droplets,
  Pill,
  ArrowRight,
  Info,
  CheckCircle2,
  DollarSign,
  HeartPulse,
  Activity,
  Layers
} from 'lucide-react';
import {
  UserProfile,
  ActiveMedicine,
  EconomicProfile,
  Appointment,
  VaultItem
} from '../../types';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';
import { EconomicAffordabilityModal } from './EconomicAffordabilityModal';
import { HealthcarePathwayWizard } from './HealthcarePathwayWizard';
import { GovernmentSchemesView } from './GovernmentSchemesView';
import { OfficialBloodAvailabilityView } from './OfficialBloodAvailabilityView';
import { officialJanaushadhiDirectory } from '../../data/officialGovernmentData';

interface HealthcareAccessibilityCenterProps {
  userProfile: UserProfile;
  activeMedicines: ActiveMedicine[];
  appointments?: Appointment[];
  vaultItems?: VaultItem[];
  economicProfile: EconomicProfile | null;
  onUpdateEconomicProfile: (profile: EconomicProfile | null) => void;
  onNavigateTab: (tab: string) => void;
}

export const HealthcareAccessibilityCenter: React.FC<HealthcareAccessibilityCenterProps> = ({
  userProfile,
  activeMedicines,
  appointments = [],
  vaultItems = [],
  economicProfile,
  onUpdateEconomicProfile,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'pathway' | 'cost_burden' | 'schemes' | 'blood_inventory'
  >('overview');

  const [isEconomicModalOpen, setIsEconomicModalOpen] = useState<boolean>(false);

  // Compute live scores and burden metrics
  const scoreBreakdown = accessibilityIntelligenceService.calculateAccessibilityScore(
    userProfile,
    economicProfile,
    activeMedicines
  );

  const burdenAnalysis = accessibilityIntelligenceService.calculateFinancialBurden(
    activeMedicines,
    economicProfile,
    appointments,
    vaultItems
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Hero Banner: Accessibility & Affordability Intelligence */}
      <div className="bg-gradient-to-br from-[#1b3b2b] via-[#214332] to-[#12241b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JeevanCare 2.0 Intelligence Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-editorial font-bold tracking-tight text-white">
              Healthcare Accessibility & Affordability Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
              Real-time synergy across Government Health Schemes (PM-JAY, RAN, e-Kosh), Janaushadhi generic bio-equivalents, out-of-pocket cost burden analysis, and official e-RaktKosh blood availability.
            </p>
          </div>

          {/* Unified Score Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-400/40 border-t-emerald-400 flex items-center justify-center text-xl font-bold font-serif-editorial text-white">
                {scoreBreakdown.overallScore}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">
                Accessibility Index
              </p>
              <p className="text-base font-bold text-white">
                {scoreBreakdown.ratingTier} Tier
              </p>
              <button
                onClick={() => setIsEconomicModalOpen(true)}
                className="text-[11px] text-emerald-300 hover:text-white font-bold underline cursor-pointer"
              >
                {economicProfile ? 'Update Economic Data' : '+ Add Economic Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-6 mt-2 border-t border-white/10">
          {[
            { id: 'overview', label: 'Intelligence Overview', icon: Layers },
            { id: 'pathway', label: 'Pathway Navigator', icon: Sparkles },
            { id: 'cost_burden', label: 'Cost Burden & Janaushadhi', icon: TrendingDown },
            { id: 'schemes', label: 'Govt Schemes & e-Kosh', icon: Building2 },
            { id: 'blood_inventory', label: 'e-RaktKosh Blood Stock', icon: Droplets }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-400 text-slate-950 shadow-md font-extrabold'
                    : 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: INTELLIGENCE OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Dimension Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Affordability */}
            <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827b6c] dark:text-slate-400">
                  Affordability
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {scoreBreakdown.dimensions.affordability.score}/{scoreBreakdown.dimensions.affordability.max} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                {burdenAnalysis.burdenTier}
              </h4>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                {scoreBreakdown.dimensions.affordability.insight}
              </p>
            </div>

            {/* 2. Resource Proximity */}
            <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827b6c] dark:text-slate-400">
                  Proximity
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {scoreBreakdown.dimensions.resourceProximity.score}/{scoreBreakdown.dimensions.resourceProximity.max} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                Urban Core Network
              </h4>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                {scoreBreakdown.dimensions.resourceProximity.insight}
              </p>
            </div>

            {/* 3. Government Scheme Protection */}
            <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827b6c] dark:text-slate-400">
                  Scheme Shield
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {scoreBreakdown.dimensions.schemeProtection.score}/{scoreBreakdown.dimensions.schemeProtection.max} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                {economicProfile?.hasAyushmanCard ? 'AB-PMJAY Active' : 'Eligible for PM-JAY'}
              </h4>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                {scoreBreakdown.dimensions.schemeProtection.insight}
              </p>
            </div>

            {/* 4. Emergency & Blood Readiness */}
            <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827b6c] dark:text-slate-400">
                  Emergency Blood
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {scoreBreakdown.dimensions.emergencyReadiness.score}/{scoreBreakdown.dimensions.emergencyReadiness.max} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                Group {userProfile.bloodGroup || 'O+'} Verified
              </h4>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                {scoreBreakdown.dimensions.emergencyReadiness.insight}
              </p>
            </div>
          </div>

          {/* Core Spotlight: Generic Savings & Pathway Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Monthly Healthcare Cost Breakdown & Janaushadhi Savings */}
            <div className="lg:col-span-2 bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    <span>Cost Intelligence & Janaushadhi Generic Savings</span>
                  </h3>
                  <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                    Monthly out-of-pocket healthcare expenses vs. potential generic savings
                  </p>
                </div>

                <button
                  onClick={() => setActiveSubTab('cost_burden')}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Detailed Pricing Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e]">
                  <p className="text-xs text-[#827b6c] dark:text-slate-400 font-semibold">Branded Meds Cost</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                    ₹{burdenAnalysis.monthlyEstimatedMedsBrandedCost}/mo
                  </p>
                  <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad] mt-1">
                    Based on {activeMedicines.length} active prescriptions
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">PMBJP Generic Cost</p>
                  <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                    ₹{burdenAnalysis.monthlyEstimatedMedsGenericCost}/mo
                  </p>
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-400 font-semibold mt-1">
                    WHO-GMP Bio-Equivalents
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-600 dark:bg-emerald-700 text-white">
                  <p className="text-xs text-emerald-100 font-semibold">Annual Potential Savings</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">
                    ₹{burdenAnalysis.annualPotentialGenericSavings.toLocaleString('en-IN')}/yr
                  </p>
                  <p className="text-[11px] text-emerald-100 mt-1">
                    ₹{burdenAnalysis.monthlyPotentialGenericSavings}/month directly saved
                  </p>
                </div>
              </div>

              {/* Action Directives */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
                  Personalized Healthcare Optimization Directives:
                </h5>
                <div className="space-y-2">
                  {(burdenAnalysis.costMitigationStrategy || []).map((strat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#5c5647] dark:text-[#c0b9ad] p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2b21]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{strat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: 1-Tap Pathway Wizard Launcher & e-RaktKosh Status */}
            <div className="space-y-5">
              {/* Pathway Wizard Box */}
              <div className="bg-gradient-to-br from-emerald-800 to-[#12241b] rounded-3xl p-6 text-white space-y-4 shadow-md">
                <div className="p-2.5 rounded-2xl bg-white/10 w-fit">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Need Guidance for a Procedure or Prescription?
                  </h4>
                  <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                    Launch the interactive 7-step pathway navigator to connect with matching schemes, generic salts, and empaneled centers.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab('pathway')}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50 text-[#1b3b2b] rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Pathway Navigator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick e-RaktKosh Blood Stock Callout */}
              <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-rose-700" />
                    <span>e-RaktKosh Inventory</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    Live Verified
                  </span>
                </div>
                <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                  38 Units of {userProfile.bloodGroup || 'O+'} Packed Red Blood Cells available at KGMU & SGPGI Lucknow.
                </p>
                <button
                  onClick={() => setActiveSubTab('blood_inventory')}
                  className="w-full py-2 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] hover:bg-[#fcfaf6] dark:hover:bg-[#1a2b21] transition-colors cursor-pointer"
                >
                  View Blood Bank Directory & Matrix
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: PATHWAY NAVIGATOR */}
      {activeSubTab === 'pathway' && (
        <HealthcarePathwayWizard
          userProfile={userProfile}
          economicProfile={economicProfile}
          activeMedicines={activeMedicines}
          onOpenEconomicModal={() => setIsEconomicModalOpen(true)}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* SUB-TAB 3: COST BURDEN & JANAUSHADHI GENERICS */}
      {activeSubTab === 'cost_burden' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                  PMBJP Janaushadhi Generic Bio-Equivalent Catalog
                </h3>
                <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                  Official price comparison of popular branded formulations vs. Janaushadhi generic medicines.
                </p>
              </div>

              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                WHO-GMP Certified Quality
              </div>
            </div>

            {/* Catalog Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e6dfd3] dark:border-[#283c2e] text-[#827b6c] dark:text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Generic Salt & Strength</th>
                    <th className="pb-3">Popular Brand Names</th>
                    <th className="pb-3">Brand Avg MRP</th>
                    <th className="pb-3 text-emerald-700 dark:text-emerald-400">Janaushadhi MRP</th>
                    <th className="pb-3 text-right">Direct Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dfd3]/60 dark:divide-[#283c2e]/60">
                  {officialJanaushadhiDirectory.map((item) => (
                    <tr key={item.pmbjpCode} className="hover:bg-[#fcfaf6] dark:hover:bg-[#1a2b21]">
                      <td className="py-3 font-bold text-[#1b3b2b] dark:text-white">
                        {item.genericSalt} ({item.dosageStrength})
                        <span className="block text-[10px] font-normal text-[#827b6c]">
                          PMBJP Code: {item.pmbjpCode} • Strip of {item.stripSize}
                        </span>
                      </td>
                      <td className="py-3 text-[#5c5647] dark:text-[#c0b9ad]">
                        {item.popularBrandNames.join(', ')}
                      </td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        ₹{item.brandAvgMrpPerStrip.toFixed(2)}
                      </td>
                      <td className="py-3 font-bold text-emerald-800 dark:text-emerald-400">
                        ₹{item.janaushadhiMrpPerStrip.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                        {Math.round(item.savingsPercentage)}% OFF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: GOVERNMENT SCHEMES & E-KOSH */}
      {activeSubTab === 'schemes' && (
        <GovernmentSchemesView
          economicProfile={economicProfile}
          userState={userProfile.state || 'Uttar Pradesh'}
          onOpenEconomicModal={() => setIsEconomicModalOpen(true)}
        />
      )}

      {/* SUB-TAB 5: E-RAKTKOSH BLOOD INVENTORY */}
      {activeSubTab === 'blood_inventory' && (
        <OfficialBloodAvailabilityView
          userProfile={userProfile}
          onNavigateToDonorNetwork={() => onNavigateTab('blood-donation')}
        />
      )}

      {/* Voluntary Economic Profile Editor Modal */}
      <EconomicAffordabilityModal
        isOpen={isEconomicModalOpen}
        onClose={() => setIsEconomicModalOpen(false)}
        userId={userProfile.id}
        currentProfile={economicProfile}
        onProfileUpdated={(updated) => onUpdateEconomicProfile(updated)}
      />

    </div>
  );
};
