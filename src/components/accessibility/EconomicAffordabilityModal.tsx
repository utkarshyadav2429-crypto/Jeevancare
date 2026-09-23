import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Trash2,
  CheckCircle2,
  Info,
  CreditCard,
  HeartHandshake
} from 'lucide-react';
import {
  EconomicProfile,
  OccupationCategory,
  RationCardType,
  IncomeBracket
} from '../../types';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';
import { useToast } from '../../context/ToastContext';

interface EconomicAffordabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentProfile: EconomicProfile | null;
  onProfileUpdated: (updated: EconomicProfile | null) => void;
}

const occupationOptions: OccupationCategory[] = [
  'Organized Sector / Salaried',
  'Unorganized / Informal / Gig',
  'Agriculture / Farming',
  'Self-Employed / Small Business',
  'Daily Wage Earner',
  'Retired / Pensioner / Senior',
  'Student / Homemaker',
  'Unemployed'
];

const rationCardOptions: RationCardType[] = [
  'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
  'Priority Household (BPL / PHH)',
  'State Food Security (NFSA)',
  'Non-NFSA / Above Poverty Line (APL)',
  'None / Not Applicable'
];

const indianStates = [
  'Uttar Pradesh',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Andhra Pradesh',
  'Rajasthan',
  'Madhya Pradesh',
  'Bihar',
  'West Bengal',
  'Gujarat',
  'Kerala',
  'Punjab',
  'Haryana',
  'Odisha'
];

export const EconomicAffordabilityModal: React.FC<EconomicAffordabilityModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentProfile,
  onProfileUpdated
}) => {
  const { showToast, showConfirm } = useToast();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(
    currentProfile?.monthlyHouseholdIncome || 28000
  );
  const [familySize, setFamilySize] = useState<number>(currentProfile?.familySize || 4);
  const [seniorDependents, setSeniorDependents] = useState<number>(
    currentProfile?.seniorDependentsCount || 0
  );
  const [childDependents, setChildDependents] = useState<number>(
    currentProfile?.childDependentsCount || 1
  );
  const [occupation, setOccupation] = useState<OccupationCategory>(
    currentProfile?.occupationCategory || 'Self-Employed / Small Business'
  );
  const [rationCard, setRationCard] = useState<RationCardType>(
    currentProfile?.rationCardType || 'State Food Security (NFSA)'
  );
  const [state, setState] = useState<string>(currentProfile?.state || 'Uttar Pradesh');
  const [district, setDistrict] = useState<string>(currentProfile?.district || 'Lucknow');
  const [hasAyushman, setHasAyushman] = useState<boolean>(
    currentProfile?.hasAyushmanCard ?? true
  );
  const [ayushmanNumber, setAyushmanNumber] = useState<string>(
    currentProfile?.ayushmanCardNumber || 'AB-PMJAY-9102-4821'
  );
  const [hasStateCard, setHasStateCard] = useState<boolean>(
    currentProfile?.hasStateHealthCard ?? true
  );
  const [hasPrivateIns, setHasPrivateIns] = useState<boolean>(
    currentProfile?.hasPrivateInsurance ?? false
  );
  const [isConsentGiven, setIsConsentGiven] = useState<boolean>(true);

  if (!isOpen) return null;

  const annualIncome = monthlyIncome * 12;

  let bracket: IncomeBracket = '₹2,50,000 - ₹5,00,000 / year (₹20.8k - ₹41.6k/mo)';
  if (annualIncome < 100000) bracket = 'Below ₹1,00,000 / year (Under ₹8.3k/mo)';
  else if (annualIncome <= 250000) bracket = '₹1,00,000 - ₹2,50,000 / year (₹8.3k - ₹20.8k/mo)';
  else if (annualIncome <= 500000) bracket = '₹2,50,000 - ₹5,00,000 / year (₹20.8k - ₹41.6k/mo)';
  else if (annualIncome <= 1000000) bracket = '₹5,00,000 - ₹10,00,000 / year (₹41.6k - ₹83.3k/mo)';
  else bracket = 'Above ₹10,00,000 / year (Above ₹83.3k/mo)';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const profileToSave: EconomicProfile = {
      id: currentProfile?.id || `econ_${userId}_${Date.now()}`,
      userId,
      monthlyHouseholdIncome: monthlyIncome,
      annualHouseholdIncome: annualIncome,
      incomeBracket: bracket,
      familySize,
      dependentsCount: seniorDependents + childDependents,
      seniorDependentsCount: seniorDependents,
      childDependentsCount: childDependents,
      occupationCategory: occupation,
      rationCardType: rationCard,
      areaType: 'Urban',
      state,
      district,
      hasAyushmanCard: hasAyushman,
      ayushmanCardNumber: hasAyushman ? ayushmanNumber : undefined,
      hasStateHealthCard: hasStateCard,
      stateHealthCardName: hasStateCard ? `${state} Health Card` : undefined,
      hasPrivateInsurance: hasPrivateIns,
      hasDisabilityOrSpecialCategory: false,
      consentGiven: isConsentGiven,
      consentGivenAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const saved = accessibilityIntelligenceService.saveEconomicProfile(profileToSave);
    onProfileUpdated(saved);
    onClose();
  };

  const handleClear = () => {
    showConfirm({
      title: 'Delete Economic Profile?',
      message: 'Are you sure you want to delete your voluntary economic profile? All matched scheme calculations will revert to general citizen baselines.',
      confirmText: 'Delete Profile',
      cancelText: 'Keep Profile',
      isDestructive: true,
      onConfirm: () => {
        accessibilityIntelligenceService.clearEconomicProfile(userId);
        onProfileUpdated(null);
        showToast('Economic profile cleared.', 'info');
        onClose();
      }
    });
  };

  return (
    <div
      id="economic-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfaf6] dark:bg-[#15231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#e6dfd3] dark:border-[#283d30] flex items-center justify-between sticky top-0 bg-[#fcfaf6]/95 dark:bg-[#15231b]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                Economic & Scheme Eligibility Profile
              </h2>
              <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad]">
                Voluntary parameters used to match government health schemes & calculate cost burden
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5c5647] dark:text-[#c0b9ad] hover:bg-[#eae3d5] dark:hover:bg-[#1f3328] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-4 mx-6 mt-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-[#2d4033] dark:text-emerald-200/90 leading-relaxed space-y-1">
            <p className="font-bold">Privacy & Encryption Commitment:</p>
            <p>
              Your financial details are encrypted and stored locally. JeevanCare uses this information purely to assess eligibility for official government schemes (AB-PMJAY, PMBJP, e-Kosh, RAN) and calculate healthcare affordability metrics.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Section 1: Income & Household */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
                Monthly Household Income (INR)
              </label>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                ₹{monthlyIncome.toLocaleString('en-IN')}/mo (₹{annualIncome.toLocaleString('en-IN')}/yr)
              </span>
            </div>

            <input
              type="range"
              min="5000"
              max="150000"
              step="2500"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full h-2 bg-[#e6dfd3] dark:bg-[#283d30] rounded-lg appearance-none cursor-pointer accent-emerald-700 dark:accent-emerald-400"
            />

            <div className="flex justify-between text-[11px] text-[#827b6c] dark:text-slate-400 font-semibold">
              <span>Under ₹10k</span>
              <span>₹25k</span>
              <span>₹50k</span>
              <span>₹1 Lakh</span>
              <span>₹1.5 Lakh+</span>
            </div>
          </div>

          {/* Section 2: Family & Dependents */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                Total Family Size
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={familySize}
                onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                Senior Dependents (Age 60+)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={seniorDependents}
                onChange={(e) => setSeniorDependents(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                Child Dependents (Age &lt;18)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={childDependents}
                onChange={(e) => setChildDependents(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Section 3: Occupation & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                Occupation Sector
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value as OccupationCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              >
                {occupationOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                Ration Card / Food Security Category
              </label>
              <select
                value={rationCard}
                onChange={(e) => setRationCard(e.target.value as RationCardType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              >
                {rationCardOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                State of Residence
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              >
                {indianStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1.5">
                District / City
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Lucknow, Varanasi, Kanpur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] text-[#1b3b2b] dark:text-[#f2f0e8] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Section 4: Existing Health Cards & Insurance */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283d30] space-y-3">
            <h4 className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Current Health Protection Cards</span>
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#15231b] border border-[#e6dfd3]/60 dark:border-[#283d30]/60 cursor-pointer">
                <div className="text-xs">
                  <p className="font-bold text-[#1b3b2b] dark:text-white">Ayushman Bharat (PM-JAY) Card</p>
                  <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
                    Provides ₹5 Lakh/year cashless coverage
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasAyushman}
                  onChange={(e) => setHasAyushman(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </label>

              {hasAyushman && (
                <div className="pl-2">
                  <input
                    type="text"
                    value={ayushmanNumber}
                    onChange={(e) => setAyushmanNumber(e.target.value)}
                    placeholder="Ayushman Card / Family ID (Optional)"
                    className="w-full px-3 py-2 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#15231b] text-xs font-mono text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
              )}

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#15231b] border border-[#e6dfd3]/60 dark:border-[#283d30]/60 cursor-pointer">
                <div className="text-xs">
                  <p className="font-bold text-[#1b3b2b] dark:text-white">State Government Health Assurance Card</p>
                  <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
                    e.g. UP MMJAY, MJPJAY, Aarogyasri, Swasthya Sathi
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasStateCard}
                  onChange={(e) => setHasStateCard(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcfaf6] dark:bg-[#15231b] border border-[#e6dfd3]/60 dark:border-[#283d30]/60 cursor-pointer">
                <div className="text-xs">
                  <p className="font-bold text-[#1b3b2b] dark:text-white">Private Commercial Health Insurance</p>
                  <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
                    Individual or Corporate Mediclaim Policy
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasPrivateIns}
                  onChange={(e) => setHasPrivateIns(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-[#5c5647] dark:text-[#c0b9ad] cursor-pointer">
            <input
              type="checkbox"
              checked={isConsentGiven}
              onChange={(e) => setIsConsentGiven(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 mt-0.5"
            />
            <span>
              I voluntarily authorize JeevanCare to evaluate public health schemes and financial relief options using these parameters. I understand this does not constitute a formal legal application.
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#e6dfd3] dark:border-[#283d30]">
            {currentProfile ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] text-xs font-bold text-[#5c5647] dark:text-[#c0b9ad] hover:bg-white dark:hover:bg-[#1a2b21] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConsentGiven}
                className="px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#254d39] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Save & Calculate Eligibility</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
