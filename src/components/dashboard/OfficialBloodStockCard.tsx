import React from 'react';
import {
  Droplets,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Clock,
  Phone
} from 'lucide-react';
import { UserProfile } from '../../types';
import { accessibilityIntelligenceService } from '../../services/accessibilityIntelligenceService';

interface OfficialBloodStockCardProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: string) => void;
}

export const OfficialBloodStockCard: React.FC<OfficialBloodStockCardProps> = ({
  userProfile,
  onNavigateTab
}) => {
  const bloodGroup = (userProfile.bloodGroup as any) || 'O+';
  const bloodResult = accessibilityIntelligenceService.searchOfficialBloodInventory({
    bloodGroup,
    maxDistanceKm: 30
  });

  const topFacility = bloodResult.results[0];

  return (
    <div className="bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              e-RaktKosh Blood Availability ({bloodGroup})
            </h3>
            <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad]">
              Verified Government Transfusion Centers
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
          {bloodResult.totalUnitsAvailable} Units Nearby
        </span>
      </div>

      {topFacility && (
        <div className="p-3.5 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2b21] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1b3b2b] dark:text-white line-clamp-1">
              {topFacility.facilityName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0">
              {topFacility.availableUnits} Units
            </span>
          </div>

          <p className="text-[11px] text-[#5c5647] dark:text-[#c0b9ad] line-clamp-1">
            {topFacility.address} ({topFacility.distanceKm} km away)
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-[#827b6c] dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-700" />
              <span>{topFacility.is24x7 ? '24/7 Desk' : 'Day Service'}</span>
            </span>
            <a
              href={`tel:${topFacility.phone}`}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
            >
              {topFacility.phone}
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#827b6c] dark:text-slate-400">
          Compatible: <strong>{(bloodResult?.compatibleGroupsIncluded || []).join(', ')}</strong>
        </span>
        <button
          onClick={() => onNavigateTab('intelligence')}
          className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Live Inventory & Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
