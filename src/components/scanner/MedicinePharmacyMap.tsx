import React from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PharmacyListing } from '../../types';

interface MedicinePharmacyMapProps {
  userLocation: { lat: number; lng: number; label?: string } | null;
  pharmacies: PharmacyListing[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (id: string) => void;
  onRefreshLocation: () => void;
  isRefreshingLocation: boolean;
}

export const MedicinePharmacyMap: React.FC<MedicinePharmacyMapProps> = ({
  userLocation,
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onRefreshLocation,
  isRefreshingLocation,
}) => {
  const hasValidLocation = userLocation && userLocation.lat !== 0 && userLocation.lng !== 0;
  const selectedPharmacy = pharmacies.find((p) => p.pharmacyId === selectedPharmacyId) || pharmacies[0];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      {/* Interactive Map Visual Stage */}
      <div className="relative w-full h-72 sm:h-80 bg-stone-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-4">
        {/* Subtle Map Grid Pattern */}
        <div className="absolute inset-0 opacity-15 dark:opacity-20 pointer-events-none bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px]" />

        {!hasValidLocation ? (
          <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-xs">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Location Access Needed
            </h4>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              To compare medicine prices at licensed pharmacies near you, please share your device location.
            </p>
            <button
              onClick={onRefreshLocation}
              disabled={isRefreshingLocation}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isRefreshingLocation ? 'Locating...' : 'Use Current Location'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* User GPS Pin Center */}
            <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping" />
                <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <span className="mt-1 text-[10px] font-bold bg-emerald-900 text-white px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                YOU ARE HERE
              </span>
            </div>

        {/* Pharmacy Pin Layout in Radius */}
        <div className="relative w-full h-full max-w-lg mx-auto flex items-center justify-center">
          {pharmacies.slice(0, 5).map((pharm, idx) => {
            // Position pins radially around center for clear distinction
            const angle = (idx * (360 / Math.min(pharmacies.length, 5)) - 90) * (Math.PI / 180);
            const radius = 80 + (idx % 2 === 0 ? 25 : 0);
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;

            const isSelected = pharm.pharmacyId === selectedPharmacyId;

            return (
              <button
                key={pharm.pharmacyId}
                onClick={() => onSelectPharmacy(pharm.pharmacyId)}
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                className={`absolute z-30 group transition-all duration-300 flex flex-col items-center cursor-pointer ${
                  isSelected ? 'scale-110 z-40' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`px-2.5 py-1 rounded-xl font-bold text-xs shadow-md border flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-600 ring-4 ring-emerald-500/20'
                      : pharm.pricePerUnit !== null
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-emerald-300 dark:border-emerald-700 hover:border-emerald-500'
                      : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 border-stone-300 dark:border-slate-700'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-emerald-600'}`} />
                  <span>
                    {pharm.pricePerUnit !== null ? `₹${pharm.pricePerUnit.toFixed(2)}/unit` : 'Price unverified'}
                  </span>
                </div>
                <div
                  className={`w-2 h-2 rotate-45 -mt-1 shadow-sm ${
                    isSelected ? 'bg-emerald-800' : 'bg-white dark:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded-md mt-0.5 max-w-[110px] truncate shadow-xs">
                  {pharm.pharmacyName} ({pharm.distanceKm} km)
                </span>
              </button>
            );
          })}
        </div>
          </>
        )}
      </div>

      {/* Selected Pharmacy Quick Card */}
      {selectedPharmacy && (
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedPharmacy.pharmacyName}
                </h4>
                {selectedPharmacy.isVerifiedPrice && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedPharmacy.address}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              {selectedPharmacy.pricePerUnit !== null ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Price</span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                    ₹{selectedPharmacy.pricePerUnit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    (₹{selectedPharmacy.packPrice?.toFixed(2)} / pack of {selectedPharmacy.packSize})
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                  Current price could not be verified
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900 text-xs">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <span className="font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {selectedPharmacy.openStatus}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {selectedPharmacy.distanceKm} km away
              </span>
              {selectedPharmacy.verifiedTimestamp && (
                <span className="text-[11px] text-slate-500 italic">
                  {selectedPharmacy.verifiedTimestamp}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedPharmacy.phone && (
                <a
                  href={`tel:${selectedPharmacy.phone}`}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-stone-200 dark:border-slate-700 transition-all flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPharmacy.lat},${selectedPharmacy.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
