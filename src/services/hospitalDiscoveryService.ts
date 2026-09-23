/**
 * Centralized Hospital & Healthcare Facility Discovery Service
 *
 * Strictly enforces real GPS / LocationContext coordinates without hardcoded fallbacks.
 * Validates coordinate integrity and staleness before initiating discovery requests.
 */

import {
  calculateHaversineDistanceKm,
  enforceValidFreshCoordinates,
  DEFAULT_MAX_LOCATION_AGE_MS,
  LocationRequiredError,
  LocationStaleError,
  InvalidCoordinatesError,
} from './locationService';

export interface HealthcareFacilityResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  type: string;
  types: string[];
  rating: number;
  userRatingCount: number;
  phone: string;
  openNow?: boolean;
  googleMapsUri?: string;
  isEmergency24x7?: boolean;
  categoryLabel: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Diagnostic Lab' | 'Blood Bank' | 'Medical Center';
}

export interface HealthcareDiscoveryOptions {
  latitude: number;
  longitude: number;
  locationTimestamp?: number;
  radiusMeters?: number;
  category?: 'All' | 'Hospitals' | 'Pharmacies' | 'Clinics' | 'Diagnostic Labs' | 'Blood Banks' | string;
  searchQuery?: string;
  sortBy?: 'nearest' | 'rating' | 'reviews';
  maxAgeMs?: number;
  allowStale?: boolean;
}

export interface HealthcareDiscoveryResponse {
  success: boolean;
  facilities: HealthcareFacilityResult[];
  searchCenter: { lat: number; lng: number };
  radiusMeters: number;
  queryTimestamp: number;
  totalFound: number;
  error?: string;
  errorDetails?: {
    code: string;
    message: string;
  };
}

// Category type mapping for Google Places API (New)
export const HEALTHCARE_CATEGORY_TYPES: Record<string, string[]> = {
  All: ['hospital', 'doctor', 'pharmacy', 'medical_lab'],
  Hospitals: ['hospital'],
  Clinics: ['doctor', 'dental_clinic', 'physiotherapist'],
  Pharmacies: ['pharmacy', 'drugstore'],
  'Diagnostic Labs': ['medical_lab'],
  'Blood Banks': ['hospital', 'medical_lab'],
};

/**
 * Classify place type into a user-facing category
 */
function classifyHealthcareCategory(types: string[] = []): HealthcareFacilityResult['categoryLabel'] {
  const tStr = types.join(' ').toLowerCase();
  if (tStr.includes('pharmacy') || tStr.includes('drugstore')) return 'Pharmacy';
  if (tStr.includes('medical_lab') || tStr.includes('diagnostic')) return 'Diagnostic Lab';
  if (tStr.includes('blood')) return 'Blood Bank';
  if (tStr.includes('doctor') || tStr.includes('dental_clinic') || tStr.includes('physiotherapist')) return 'Clinic';
  if (tStr.includes('hospital')) return 'Hospital';
  return 'Medical Center';
}

export const hospitalDiscoveryService = {
  /**
   * Discover nearby hospitals, emergency facilities, and specialized clinics.
   * STRICT REQUIREMENT: lat & lng MUST come from LocationContext with staleness verification.
   * NO fallback hardcoded coordinates are used.
   */
  async fetchNearbyHealthcareFacilities(
    options: HealthcareDiscoveryOptions
  ): Promise<HealthcareDiscoveryResponse> {
    // 1. Strict Coordinate Validation & Staleness Check (Throws if invalid or stale)
    const validLoc = enforceValidFreshCoordinates(
      options.latitude,
      options.longitude,
      options.locationTimestamp,
      {
        maxAgeMs: options.maxAgeMs || DEFAULT_MAX_LOCATION_AGE_MS,
        allowStale: options.allowStale ?? false,
        serviceName: 'Hospital Discovery Service',
      }
    );

    const lat = validLoc.latitude;
    const lng = validLoc.longitude;
    const radiusMeters = options.radiusMeters || 5000;
    const category = options.category || 'All';
    const targetedTypes = HEALTHCARE_CATEGORY_TYPES[category] || ['hospital'];

    const placesMap = new Map<string, HealthcareFacilityResult>();

    try {
      // Query server-side Places API proxy
      const res = await fetch('/api/places/search-nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radiusMeters,
          includedTypes: targetedTypes,
          maxResultCount: 20,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status} for healthcare discovery.`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.places)) {
        for (const p of data.places) {
          const pLat = p.location?.latitude ?? p.location?.lat;
          const pLng = p.location?.longitude ?? p.location?.lng;
          if (pLat === undefined || pLng === undefined) continue;

          const numLat = Number(pLat);
          const numLng = Number(pLng);
          const name = typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || 'Healthcare Facility');
          const address = p.formattedAddress || '';
          const types: string[] = p.types || [];
          const distanceKm = calculateHaversineDistanceKm(lat, lng, numLat, numLng);
          const categoryLabel = classifyHealthcareCategory(types);

          const isEmergency =
            name.toLowerCase().includes('emergency') ||
            name.toLowerCase().includes('trauma') ||
            name.toLowerCase().includes('hospital') ||
            types.includes('hospital');

          const facilityId = p.id || `facility_${numLat.toFixed(4)}_${numLng.toFixed(4)}`;

          placesMap.set(facilityId, {
            id: facilityId,
            name,
            address,
            lat: numLat,
            lng: numLng,
            distanceKm,
            type: categoryLabel,
            types,
            rating: typeof p.rating === 'number' ? p.rating : 4.5,
            userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '+91 108',
            openNow: p.regularOpeningHours?.openNow ?? true,
            googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`,
            isEmergency24x7: isEmergency,
            categoryLabel,
          });
        }
      }

      let finalResults = Array.from(placesMap.values());

      // Filter by text query if provided
      if (options.searchQuery?.trim()) {
        const q = options.searchQuery.toLowerCase().trim();
        finalResults = finalResults.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.address.toLowerCase().includes(q) ||
            f.categoryLabel.toLowerCase().includes(q)
        );
      }

      // Sort by requested ordering
      const sortBy = options.sortBy || 'nearest';
      if (sortBy === 'nearest') {
        finalResults.sort((a, b) => a.distanceKm - b.distanceKm);
      } else if (sortBy === 'rating') {
        finalResults.sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
      } else if (sortBy === 'reviews') {
        finalResults.sort((a, b) => b.userRatingCount - a.userRatingCount || a.distanceKm - b.distanceKm);
      }

      return {
        success: true,
        facilities: finalResults,
        searchCenter: { lat, lng },
        radiusMeters,
        queryTimestamp: Date.now(),
        totalFound: finalResults.length,
      };
    } catch (err: any) {
      if (err instanceof LocationRequiredError || err instanceof LocationStaleError || err instanceof InvalidCoordinatesError) {
        throw err;
      }
      return {
        success: false,
        facilities: [],
        searchCenter: { lat, lng },
        radiusMeters,
        queryTimestamp: Date.now(),
        totalFound: 0,
        error: err?.message || 'Failed to discover nearby healthcare facilities.',
        errorDetails: {
          code: err?.code || 'DISCOVERY_FAILED',
          message: err?.message || 'Unknown network error',
        },
      };
    }
  },

  /**
   * Search healthcare facilities by keyword and location
   */
  async searchHealthcareByText(
    textQuery: string,
    latitude: number,
    longitude: number,
    locationTimestamp?: number,
    radiusMeters = 8000
  ): Promise<HealthcareFacilityResult[]> {
    const validLoc = enforceValidFreshCoordinates(latitude, longitude, locationTimestamp, {
      serviceName: 'Healthcare Text Search',
    });

    const res = await fetch('/api/places/search-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textQuery,
        latitude: validLoc.latitude,
        longitude: validLoc.longitude,
        radiusMeters,
        maxResultCount: 15,
      }),
    });

    if (!res.ok) {
      throw new Error(`Text search failed with status ${res.status}`);
    }

    const data = await res.json();
    const results: HealthcareFacilityResult[] = [];

    if (data.success && Array.isArray(data.places)) {
      for (const p of data.places) {
        const pLat = p.location?.latitude ?? p.location?.lat;
        const pLng = p.location?.longitude ?? p.location?.lng;
        if (pLat === undefined || pLng === undefined) continue;

        const numLat = Number(pLat);
        const numLng = Number(pLng);
        const name = typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || textQuery);
        const distanceKm = calculateHaversineDistanceKm(validLoc.latitude, validLoc.longitude, numLat, numLng);

        results.push({
          id: p.id || `text_facility_${numLat}_${numLng}`,
          name,
          address: p.formattedAddress || '',
          lat: numLat,
          lng: numLng,
          distanceKm,
          type: 'Healthcare Facility',
          types: p.types || ['health'],
          rating: typeof p.rating === 'number' ? p.rating : 4.5,
          userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
          openNow: p.regularOpeningHours?.openNow ?? true,
          googleMapsUri: p.googleMapsUri,
          categoryLabel: classifyHealthcareCategory(p.types),
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  },
};
