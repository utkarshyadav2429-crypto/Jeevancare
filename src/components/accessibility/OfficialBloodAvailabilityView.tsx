import React, { useState } from 'react';
import {
  HeartPulse,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Share2,
  Activity,
  Droplets,
  ExternalLink
} from 'lucide-react';
import {
  OfficialBloodUnitRecord,
  BloodComponentType,
  BloodGroup,
  UserProfile
} from '../../types';
import {
  officialBloodUnitsDirectory,
  bloodCompatibilityDirectory
} from '../../data/officialGovernmentData';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';

interface OfficialBloodAvailabilityViewProps {
  userProfile: UserProfile;
  onNavigateToDonorNetwork?: () => void;
}

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const componentTypes: BloodComponentType[] = [
  'Packed Red Blood Cells (PRBC)',
  'Whole Blood',
  'Platelet Concentrate (RDP)',
  'Single Donor Platelets (SDP)',
  'Fresh Frozen Plasma (FFP)',
  'Cryoprecipitate'
];

export const OfficialBloodAvailabilityView: React.FC<OfficialBloodAvailabilityViewProps> = ({
  userProfile,
  onNavigateToDonorNetwork
}) => {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup>(
    (userProfile.bloodGroup as BloodGroup) || 'O+'
  );
  const [selectedComponent, setSelectedComponent] = useState<BloodComponentType>(
    'Packed Red Blood Cells (PRBC)'
  );
  const [copiedHospitalId, setCopiedHospitalId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [patientHospital, setPatientHospital] = useState<string>('King George Medical University');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [requisitionCopied, setRequisitionCopied] = useState<boolean>(false);

  const searchResult = accessibilityIntelligenceService.searchOfficialBloodInventory({
    bloodGroup: selectedBloodGroup,
    componentType: selectedComponent,
    maxDistanceKm: 50
  });

  const compat = searchResult.compatibilityInfo || bloodCompatibilityDirectory[selectedBloodGroup];

  const handleCopyHospital = (record: OfficialBloodUnitRecord) => {
    const text = `🏥 *Blood Unit Availability Notice*\nFacility: ${record.facilityName}\nLocation: ${record.address}\nBlood Group: ${record.bloodGroup} (${record.componentType})\nUnits Available: ${record.availableUnits}\nContact: ${record.phone}\nSource: e-RaktKosh National Portal`;
    navigator.clipboard.writeText(text);
    setCopiedHospitalId(record.id);
    setTimeout(() => setCopiedHospitalId(null), 2500);
  };

  const generateRequisitionText = () => {
    return `🚨 *URGENT BLOOD REQUIREMENT (JeevanCare Emergency Requisition)* 🚨\n\n` +
      `👤 Patient: ${userProfile.name}\n` +
      `🩸 Blood Group: *${selectedBloodGroup}*\n` +
      `💉 Component: *${selectedComponent}*\n` +
      `🔢 Units Required: *${unitsNeeded} Units*\n` +
      `🏥 Hospital/Location: *${patientHospital}*\n` +
      `📍 City: Lucknow, UP\n` +
      `🕒 Required: IMMEDIATE\n` +
      `📞 Contact: ${userProfile.phone || '+91-9876543210'}\n\n` +
      `✅ *Compatible Donor Groups:* ${compat.canReceiveWholeBloodAndRBC.join(', ')}\n` +
      `🔗 Verified on JeevanCare Healthcare Intelligence Platform`;
  };

  const handleCopyRequisition = () => {
    navigator.clipboard.writeText(generateRequisitionText());
    setRequisitionCopied(true);
    setTimeout(() => setRequisitionCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <Droplets className="w-4 h-4" />
            <span>e-RaktKosh & National Blood Transfusion Registry</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
            Official Licensed Blood Bank Inventory & Compatibility
          </h2>
          <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
            Real-time verified blood unit availability across authorized government medical colleges and district transfusion centers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-200" />
            <span>Emergency Requisition Generator</span>
          </button>
        </div>
      </div>

      {/* Strict Source Distinction Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-800 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#2d4033] dark:text-amber-200/90 leading-relaxed space-y-1">
          <p className="font-bold">Important Source Distinction:</p>
          <p>
            The inventory below represents <strong>official licensed hospital blood stocks</strong> reported via e-RaktKosh / State Blood Transfusion Councils. To connect with <strong>voluntary registered peer donors</strong>, visit the{' '}
            <button
              onClick={onNavigateToDonorNetwork}
              className="text-amber-900 dark:text-amber-300 underline font-bold cursor-pointer"
            >
              Peer Blood Donor Network
            </button>.
          </p>
        </div>
      </div>

      {/* Blood Group & Component Selector */}
      <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
            Select Blood Group
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {bloodGroups.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedBloodGroup(bg)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBloodGroup === bg
                    ? 'bg-rose-700 text-white shadow-xs scale-105'
                    : 'bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] text-[#1b3b2b] dark:text-[#f2f0e8] hover:border-rose-400'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8]">
            Select Blood Component Type
          </label>
          <div className="flex flex-wrap gap-2">
            {componentTypes.map((ctype) => (
              <button
                key={ctype}
                onClick={() => setSelectedComponent(ctype)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedComponent === ctype
                    ? 'bg-[#1b3b2b] text-white dark:bg-emerald-400 dark:text-slate-950 font-bold'
                    : 'bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] text-[#5c5647] dark:text-[#c0b9ad] hover:bg-white'
                }`}
              >
                {ctype}
              </button>
            ))}
          </div>
        </div>

        {/* Compatibility Matrix Info Card */}
        <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>Scientific Compatibility for {selectedBloodGroup}</span>
            </h4>
            {compat.isUniversalDonorRBC && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">
                Universal RBC Donor
              </span>
            )}
            {compat.isUniversalRecipientRBC && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Universal RBC Recipient
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#15231b] border border-[#e6dfd3]/80 dark:border-[#283c2e]/80">
              <p className="text-[11px] font-bold text-[#827b6c] dark:text-slate-400">Can SAFELY RECEIVE from:</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(compat?.canReceiveWholeBloodAndRBC || []).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold border border-emerald-200 dark:border-emerald-800"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#15231b] border border-[#e6dfd3]/80 dark:border-[#283c2e]/80">
              <p className="text-[11px] font-bold text-[#827b6c] dark:text-slate-400">Can SAFELY DONATE to:</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(compat?.canDonateTo || []).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold border border-blue-200 dark:border-blue-800"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Blood Banks Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
            <span>Verified Transfusion Centers</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              {searchResult?.totalUnitsAvailable || 0} Units Total
            </span>
          </h3>
          <span className="text-xs text-[#827b6c] dark:text-slate-400">
            Within 50 km radius (Lucknow Region)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(searchResult?.results || []).map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 space-y-4 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eae3d5] dark:bg-[#253a2d] text-[#1b3b2b] dark:text-[#f2f0e8]">
                    {record.facilityTier}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    record.stockStatus === 'Adequate Stock'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {record.availableUnits} Units Available
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-white">
                    {record.facilityName}
                  </h4>
                  <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#827b6c]" />
                    <span>{record.address} ({record.distanceKm} km away)</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="flex items-center gap-1 text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    <span>{record.is24x7 ? '24x7 Emergency Desk' : '9:00 AM - 6:00 PM'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {record.freshnessTier}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e6dfd3] dark:border-[#283c2e] flex items-center justify-between gap-2">
                <a
                  href={`tel:${record.phone}`}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyHospital(record)}
                    className="p-2 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] text-[#5c5647] dark:text-[#c0b9ad] hover:bg-[#fcfaf6] dark:hover:bg-[#1a2b21] transition-colors cursor-pointer"
                    title="Copy details"
                  >
                    {copiedHospitalId === record.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${record.lat},${record.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e] text-[#5c5647] dark:text-[#c0b9ad] hover:bg-[#fcfaf6] dark:hover:bg-[#1a2b21] transition-colors"
                    title="Get Directions"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Requisition Generator Modal */}
      {showEmergencyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowEmergencyModal(false)}
        >
          <div
            className="bg-[#fcfaf6] dark:bg-[#15231b] border border-[#e6dfd3] dark:border-[#283d30] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dfd3] dark:border-[#283d30]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
                <h3 className="text-base font-bold text-[#1b3b2b] dark:text-white">
                  Emergency Blood Requisition Card
                </h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-xs font-bold text-[#827b6c] hover:underline"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1">
                  Admitted Hospital / Ward
                </label>
                <input
                  type="text"
                  value={patientHospital}
                  onChange={(e) => setPatientHospital(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1b3b2b] dark:text-[#f2f0e8] mb-1">
                  Units Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] bg-white dark:bg-[#1a2b21] font-semibold"
                />
              </div>

              {/* Formatted Preview Box */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283d30] font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {generateRequisitionText()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e6dfd3] dark:border-[#283d30]">
              <button
                onClick={handleCopyRequisition}
                className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                {requisitionCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copy for WhatsApp / SMS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
