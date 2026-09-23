/**
 * Centralized Pharmacy & Medicine Discovery Service
 *
 * Strictly requires real GPS / LocationContext coordinates without hardcoded fallbacks.
 * Validates coordinate integrity and staleness before searching nearby pharmacies or comparing prices.
 */

import {
  calculateHaversineDistanceKm,
  enforceValidFreshCoordinates,
  DEFAULT_MAX_LOCATION_AGE_MS,
  LocationRequiredError,
  LocationStaleError,
  InvalidCoordinatesError,
} from './locationService';
import { ExtractedMedicineItem, MedicinePharmacyComparison, CompletePrescriptionStore } from '../types';

export interface NearbyPharmacyStore {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  isJanAushadhi: boolean;
  rating: number;
  userRatingCount: number;
  phone: string;
  openNow?: boolean;
  googleMapsUri?: string;
}

export interface PharmacyDiscoveryOptions {
  latitude: number;
  longitude: number;
  locationTimestamp?: number;
  radiusMeters?: number;
  searchQuery?: string;
  sortBy?: 'nearest' | 'rating' | 'reviews';
  maxAgeMs?: number;
  allowStale?: boolean;
}

export interface PharmacyPriceComparisonOptions {
  medicines: ExtractedMedicineItem[];
  latitude: number;
  longitude: number;
  locationTimestamp?: number;
  sortBy?: 'cheapest' | 'nearest' | 'generic';
  maxAgeMs?: number;
  allowStale?: boolean;
}

export interface PharmacyPriceComparisonResponse {
  success: boolean;
  medicineResults: MedicinePharmacyComparison[];
  completePrescriptionStore: CompletePrescriptionStore | null;
  searchCenter: { lat: number; lng: number };
  queryTimestamp: number;
  error?: string;
}

export const pharmacyDiscoveryService = {
  /**
   * Search for nearby physical pharmacies and Jan Aushadhi Kendras.
   * STRICT REQUIREMENT: lat & lng MUST come from LocationContext with staleness verification.
   * NO fallback hardcoded coordinates are used.
   */
  async searchNearbyPharmacies(
    options: PharmacyDiscoveryOptions
  ): Promise<{ success: boolean; pharmacies: NearbyPharmacyStore[]; searchCenter: { lat: number; lng: number } }> {
    const validLoc = enforceValidFreshCoordinates(
      options.latitude,
      options.longitude,
      options.locationTimestamp,
      {
        maxAgeMs: options.maxAgeMs || DEFAULT_MAX_LOCATION_AGE_MS,
        allowStale: options.allowStale ?? false,
        serviceName: 'Pharmacy Discovery Service',
      }
    );

    const lat = validLoc.latitude;
    const lng = validLoc.longitude;
    const radiusMeters = options.radiusMeters || 5000;

    const res = await fetch('/api/places/search-nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        radiusMeters,
        includedTypes: ['pharmacy', 'drugstore'],
        maxResultCount: 20,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status} for pharmacy discovery.`);
    }

    const data = await res.json();
    const pharmacies: NearbyPharmacyStore[] = [];

    if (data.success && Array.isArray(data.places)) {
      for (const p of data.places) {
        const pLat = p.location?.latitude ?? p.location?.lat;
        const pLng = p.location?.longitude ?? p.location?.lng;
        if (pLat === undefined || pLng === undefined) continue;

        const numLat = Number(pLat);
        const numLng = Number(pLng);
        const name = typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || 'Pharmacy');
        const isJanAushadhi =
          name.toLowerCase().includes('jan aushadhi') ||
          name.toLowerCase().includes('pmbik') ||
          name.toLowerCase().includes('generic');

        const distanceKm = calculateHaversineDistanceKm(lat, lng, numLat, numLng);

        pharmacies.push({
          id: p.id || `pharmacy_${numLat}_${numLng}`,
          name,
          address: p.formattedAddress || '',
          lat: numLat,
          lng: numLng,
          distanceKm,
          isJanAushadhi,
          rating: typeof p.rating === 'number' ? p.rating : 4.5,
          userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
          openNow: p.regularOpeningHours?.openNow ?? true,
          googleMapsUri: p.googleMapsUri,
        });
      }
    }

    if (options.sortBy === 'rating') {
      pharmacies.sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
    } else {
      pharmacies.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return {
      success: true,
      pharmacies,
      searchCenter: { lat, lng },
    };
  },

  /**
   * Compare prescription medicine prices across Jan Aushadhi & retail pharmacies.
   * STRICT REQUIREMENT: lat & lng MUST come from LocationContext with staleness verification.
   * NO fallback hardcoded coordinates are used.
   */
  async comparePrescriptionPharmacyPrices(
    options: PharmacyPriceComparisonOptions
  ): Promise<PharmacyPriceComparisonResponse> {
    if (!options.medicines || options.medicines.length === 0) {
      throw new Error('At least one medicine item is required for price comparison.');
    }

    const validLoc = enforceValidFreshCoordinates(
      options.latitude,
      options.longitude,
      options.locationTimestamp,
      {
        maxAgeMs: options.maxAgeMs || DEFAULT_MAX_LOCATION_AGE_MS,
        allowStale: options.allowStale ?? false,
        serviceName: 'Pharmacy Price Comparison Service',
      }
    );

    const lat = validLoc.latitude;
    const lng = validLoc.longitude;

    const res = await fetch('/api/pharmacy/search-medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicines: options.medicines,
        userLat: lat,
        userLng: lng,
        sortBy: options.sortBy || 'cheapest',
      }),
    });

    if (!res.ok) {
      throw new Error(`Pharmacy price search failed with status ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || 'Failed to retrieve pharmacy price comparison data.');
    }

    return {
      success: true,
      medicineResults: json.medicineResults || [],
      completePrescriptionStore: json.completePrescriptionStore || null,
      searchCenter: { lat, lng },
      queryTimestamp: Date.now(),
    };
  },
};
