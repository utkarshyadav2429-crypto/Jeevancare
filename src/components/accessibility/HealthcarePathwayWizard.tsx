import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Pill,
  HeartPulse,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import {
  UserProfile,
  ActiveMedicine,
  EconomicProfile,
  SchemeMatchingResult,
  OfficialBloodUnitRecord
} from '../../types';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';
import { officialJanaushadhiDirectory } from '../../data/officialGovernmentData';

interface HealthcarePathwayWizardProps {
  userProfile: UserProfile;
  economicProfile: EconomicProfile | null;
  activeMedicines: ActiveMedicine[];
  onOpenEconomicModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HealthcarePathwayWizard: React.FC<HealthcarePathwayWizardProps> = ({
  userProfile,
  economicProfile,
  activeMedicines,
  onOpenEconomicModal,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedNeed, setSelectedNeed] = useState<
    'prescription_cost' | 'government_scheme' | 'blood_emergency' | 'doctor_specialist' | 'diagnostic_support'
  >('prescription_cost');
  const [selectedMedicineSalt, setSelectedMedicineSalt] = useState<string>(
    activeMedicines[0]?.salt || 'Amoxicillin'
  );
  const [urgencyLevel, setUrgencyLevel] = useState<'routine' | 'urgent' | 'emergency'>('routine');

  const burdenAnalysis = accessibilityIntelligenceService.calculateFinancialBurden(
    activeMedicines,
    economicProfile
  );

  const matchedSchemes = accessibilityIntelligenceService.matchGovernmentSchemes(
    economicProfile,
    activeMedicines,
    userProfile.state || 'Uttar Pradesh'
  );

  const bloodInventoryResult = accessibilityIntelligenceService.searchOfficialBloodInventory({
    bloodGroup: (userProfile.bloodGroup as any) || 'O+',
    maxDistanceKm: 30
  });

  const selectedGenericMatch = officialJanaushadhiDirectory.find((j) =>
    selectedMedicineSalt.toLowerCase().includes(j.genericSalt.toLowerCase()) ||
    j.popularBrandNames.some((b) => selectedMedicineSalt.toLowerCase().includes(b.toLowerCase()))
  ) || officialJanaushadhiDirectory[0];

  const totalSteps = 7;

  return (
    <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      
      {/* Wizard Header & Progress Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Step {currentStep} of {totalSteps}: Find My Healthcare Path</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mt-1">
              Personalized Healthcare Pathway Navigator
            </h2>
          </div>

          <div className="text-xs font-semibold text-[#5c5647] dark:text-[#c0b9ad] bg-[#fcfaf6] dark:bg-[#1a2b21] px-3.5 py-1.5 rounded-full border border-[#e6dfd3] dark:border-[#283c2e] shrink-0 self-start sm:self-auto">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </div>
        </div>

        {/* Multi-step progress track */}
        <div className="grid grid-cols-7 gap-1.5 h-1.5 w-full">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx + 1 <= currentStep
                  ? 'bg-emerald-700 dark:bg-emerald-400'
                  : 'bg-[#e6dfd3] dark:bg-[#283c2e]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Select Primary Healthcare Need */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            What primary healthcare assistance or resource do you need today?
          </h3>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
            Select your primary objective so JeevanCare can curate verified subsidies, generics, blood units, or empaneled hospitals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {[
              {
                id: 'prescription_cost',
                title: 'Lower Medicine & Prescription Costs',
                desc: 'Find PMBJP Janaushadhi generic bio-equivalents and save up to 90%',
                icon: Pill
              },
              {
                id: 'government_scheme',
                title: 'Government Scheme & e-Kosh Grants',
                desc: 'Check eligibility for AB-PMJAY (₹5 Lakhs), RAN, and State CM Relief Funds',
                icon: Building2
              },
              {
                id: 'blood_emergency',
                title: 'Official Blood Bank Units',
                desc: 'Locate verified live blood units via e-RaktKosh with compatibility match',
                icon: HeartHandshake
              },
              {
                id: 'doctor_specialist',
                title: 'Specialist Consultation & Booking',
                desc: 'Connect with verified physicians for physical or teleconsultation',
                icon: HeartPulse
              },
              {
                id: 'diagnostic_support',
                title: 'Diagnostic & Lab Subsidies',
                desc: 'Locate government diagnostic centers and discounted lab screening packages',
                icon: ShieldCheck
              }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = selectedNeed === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedNeed(item.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-600/20'
                      : 'bg-[#fcfaf6] dark:bg-[#1a2b21] border-[#e6dfd3] dark:border-[#283c2e] hover:border-emerald-500/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className={`p-2.5 rounded-xl w-fit ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-[#eae3d5] dark:bg-[#253a2d] text-[#1b3b2b] dark:text-[#f2f0e8]'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mt-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selected Objective</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Identify Condition / Prescription Salt */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Select or enter the therapeutic salt / medicine in question
          </h3>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
            JeevanCare maps clinical formulations directly to standard PMBJP generic inventory codes.
          </p>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
              Active Prescriptions & Therapeutic Directory
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {officialJanaushadhiDirectory.map((j) => {
                const isSelected = selectedMedicineSalt === j.genericSalt;
                return (
                  <button
                    key={j.pmbjpCode}
                    onClick={() => setSelectedMedicineSalt(j.genericSalt)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 font-bold'
                        : 'bg-[#fcfaf6] dark:bg-[#1a2b21] border-[#e6dfd3] dark:border-[#283c2e] hover:bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                        {j.genericSalt} ({j.dosageStrength})
                      </p>
                      <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
                        Popular Brands: {j.popularBrandNames.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      Save {Math.round(j.savingsPercentage)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Branded vs. PMBJP Generic Pricing Intelligence */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Branded vs. Janaushadhi Generic Price Analysis
          </h3>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
            Quality assurance: PMBJP generic medicines have identical active pharmaceutical ingredients (API) and bio-equivalence certifications.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Commercial Branded Card */}
            <div className="p-5 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300">
                  Commercial Branded
                </span>
                <span className="text-xs font-semibold text-[#827b6c]">Avg Retail MRP</span>
              </div>
              <h4 className="text-base font-bold text-[#1b3b2b] dark:text-white">
                {selectedGenericMatch.popularBrandNames[0]} ({selectedGenericMatch.dosageStrength})
              </h4>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                ₹{selectedGenericMatch.brandAvgMrpPerStrip.toFixed(2)}
                <span className="text-xs font-normal text-[#827b6c]"> / {selectedGenericMatch.stripSize} units</span>
              </p>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                Annualized cost for continuous daily routine: ₹{(selectedGenericMatch.brandAvgMrpPerStrip * 36.5).toFixed(0)}/yr
              </p>
            </div>

            {/* PMBJP Janaushadhi Generic Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border-2 border-emerald-600 dark:border-emerald-500 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white">
                  PMBJP Janaushadhi Generic
                </span>
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  {Math.round(selectedGenericMatch.savingsPercentage)}% Direct Savings
                </span>
              </div>
              <h4 className="text-base font-bold text-[#1b3b2b] dark:text-white">
                Generic {selectedGenericMatch.genericSalt} ({selectedGenericMatch.dosageStrength})
              </h4>
              <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400">
                ₹{selectedGenericMatch.janaushadhiMrpPerStrip.toFixed(2)}
                <span className="text-xs font-normal text-[#5c5647] dark:text-slate-300"> / {selectedGenericMatch.stripSize} units</span>
              </p>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                Annualized cost: ₹{(selectedGenericMatch.janaushadhiMrpPerStrip * 36.5).toFixed(0)}/yr (Saves ₹{((selectedGenericMatch.brandAvgMrpPerStrip - selectedGenericMatch.janaushadhiMrpPerStrip) * 36.5).toFixed(0)}/year)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Household Economic & Out-of-Pocket Burden */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              Household Health Financial Burden Assessment
            </h3>
            <button
              onClick={onOpenEconomicModal}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Edit Economic Profile
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dfd3] dark:border-[#283c2e]">
              <div>
                <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">Estimated Monthly Healthcare Out-of-Pocket</p>
                <p className="text-xl font-bold text-[#1b3b2b] dark:text-white">
                  ₹{burdenAnalysis.totalMonthlyEstimatedHealthcareCost.toLocaleString('en-IN')}/month
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">Burden Index (% of Monthly Income)</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  burdenAnalysis.burdenRatioPercentage < 5
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : burdenAnalysis.burdenRatioPercentage < 15
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {burdenAnalysis.burdenRatioPercentage}% ({burdenAnalysis.burdenTier})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
                Cost Mitigation Directives:
              </h5>
              {(burdenAnalysis?.costMitigationStrategy || []).map((strat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{strat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Matching Official Government Benefit Schemes */}
      {currentStep === 5 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Evaluated Government Health & Assistance Schemes
          </h3>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
            Schemes evaluated against your voluntary household profile (State: {userProfile?.state || 'Uttar Pradesh'}, Income: ₹{(economicProfile?.annualHouseholdIncome || 336000).toLocaleString('en-IN')}).
          </p>

          <div className="space-y-3 pt-1">
            {(matchedSchemes || []).slice(0, 3).map((match) => {
              const s = match.scheme;
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-white flex items-center gap-2">
                        <span>{s.shortName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#eae3d5] dark:bg-[#253a2d] text-[#5c5647] dark:text-[#c0b9ad]">
                          {s.authority}
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        {s.coverageAmountDescription}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {match.matchLevel} ({match.matchPercentage}%)
                    </span>
                  </div>

                  <div className="text-xs text-[#5c5647] dark:text-[#c0b9ad] space-y-1">
                    <p><strong>Key Benefits:</strong> {s.keyBenefits?.[0] || 'Comprehensive healthcare support'}</p>
                    <p><strong>Required Documents:</strong> {(s.requiredDocuments || []).slice(0, 2).join(', ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 6: Verified Local Resources (PMBJP & Blood Centers) */}
      {currentStep === 6 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Verified Nearby Healthcare Facilities & Blood Centers
          </h3>
          <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
            Licensed e-RaktKosh blood banks and PMBJP generic pharmacies near Lucknow, UP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {(bloodInventoryResult?.results || []).slice(0, 2).map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                    {record.facilityTier}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {record.availableUnits} Units ({record.bloodGroup})
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1b3b2b] dark:text-white">
                  {record.facilityName}
                </h4>
                <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{record.address} ({record.distanceKm} km away)</span>
                </p>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <a
                    href={`tel:${record.phone}`}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{record.phone}</span>
                  </a>
                  <span className="text-[10px] text-[#827b6c]">{record.freshnessTier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: Consolidated Action Plan & Next Steps */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#1b3b2b] dark:text-emerald-200 space-y-1">
              <h4 className="font-bold text-sm">Your Healthcare Pathway is Ready!</h4>
              <p>
                Based on your selections, here is your consolidated action plan to minimize out-of-pocket costs and secure maximum public health assistance.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
              Recommended 1-Tap Actions:
            </h4>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <span className="font-bold text-[#1b3b2b] dark:text-white">Switch to Janaushadhi Generic at KGMU Kendra</span>
                </div>
                <button
                  onClick={() => onNavigateTab('scanner')}
                  className="px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-xs hover:bg-emerald-800 cursor-pointer"
                >
                  Locate Store
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <span className="font-bold text-[#1b3b2b] dark:text-white">Verify Ayushman Card e-KYC (₹5 Lakhs/year)</span>
                </div>
                <a
                  href="https://beneficiary.nha.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white dark:bg-[#253a2d] border border-[#e6dfd3] dark:border-[#283c2e] font-bold rounded-lg text-xs hover:bg-[#f6f2e9] flex items-center gap-1"
                >
                  <span>NHA Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <span className="font-bold text-[#1b3b2b] dark:text-white">Check Live Blood Units & Compatibility Matrix</span>
                </div>
                <button
                  onClick={() => onNavigateTab('blood-donation')}
                  className="px-3 py-1 bg-white dark:bg-[#253a2d] border border-[#e6dfd3] dark:border-[#283c2e] font-bold rounded-lg text-xs hover:bg-[#f6f2e9] cursor-pointer"
                >
                  Blood Center
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#e6dfd3] dark:border-[#283c2e]">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-bold text-[#5c5647] dark:text-[#c0b9ad] hover:bg-[#fcfaf6] dark:hover:bg-[#1a2b21] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
            className="px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#254d39] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(1)}
            className="px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#254d39] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Start New Pathway</span>
          </button>
        )}
      </div>
    </div>
  );
};
