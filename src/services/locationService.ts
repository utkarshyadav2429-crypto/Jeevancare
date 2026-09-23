/**
 * Centralized Geolocation & Device Positioning Service
 * 
 * Provides single-source-of-truth device GPS & network positioning
 * with high accuracy configuration, movement filtering, Haversine distance calculations,
 * and permission state diagnostics.
 * 
 * RULES:
 * - NEVER return hardcoded or fake coordinates in production.
 * - ALWAYS specify maximumAge: 0 for fresh location queries.
 * - ALWAYS return accuracy metadata alongside latitude and longitude.
 */

export class LocationRequiredError extends Error {
  readonly code = 'LOCATION_REQUIRED';
  constructor(message = 'Active GPS or validated coordinates from LocationContext are required to perform this discovery search.') {
    super(message);
    this.name = 'LocationRequiredError';
  }
}

export class LocationStaleError extends Error {
  readonly code = 'LOCATION_STALE';
  readonly staleDurationMs: number;
  readonly maxAllowedAgeMs: number;

  constructor(staleDurationMs: number, maxAllowedAgeMs: number) {
    const minutesOld = Math.round(staleDurationMs / 60000);
    super(`Current location fix is stale (${minutesOld} min old). A fresh GPS update is required.`);
    this.name = 'LocationStaleError';
    this.staleDurationMs = staleDurationMs;
    this.maxAllowedAgeMs = maxAllowedAgeMs;
  }
}

export class InvalidCoordinatesError extends Error {
  readonly code = 'INVALID_COORDINATES';
  constructor(lat?: unknown, lng?: unknown) {
    super(`Invalid coordinates received: [latitude: ${lat}, longitude: ${lng}]. Latitude must be between -90 and 90, longitude between -180 and 180.`);
    this.name = 'InvalidCoordinatesError';
  }
}

/** Default maximum acceptable location age in milliseconds (5 minutes) */
export const DEFAULT_MAX_LOCATION_AGE_MS = 5 * 60 * 1000;

/**
 * Check if coordinate numbers are mathematically valid and within physical bounds
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Check if a location timestamp is considered stale relative to a maximum age threshold
 */
export function isLocationStale(
  timestamp?: number | null,
  maxAgeMs: number = DEFAULT_MAX_LOCATION_AGE_MS
): boolean {
  if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
    return true;
  }
  const age = Date.now() - timestamp;
  return age > maxAgeMs;
}

/**
 * Validate and strictly enforce fresh coordinates.
 * Throws LocationRequiredError, InvalidCoordinatesError, or LocationStaleError.
 */
export function enforceValidFreshCoordinates(
  latitude?: number | null,
  longitude?: number | null,
  timestamp?: number | null,
  options?: {
    maxAgeMs?: number;
    allowStale?: boolean;
    serviceName?: string;
  }
): { latitude: number; longitude: number; timestamp: number } {
  const service = options?.serviceName || 'Discovery Service';

  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    throw new LocationRequiredError(
      `${service} requires valid latitude and longitude from LocationContext. No location coordinates were provided.`
    );
  }

  if (!isValidCoordinate(latitude, longitude)) {
    throw new InvalidCoordinatesError(latitude, longitude);
  }

  const maxAge = options?.maxAgeMs ?? DEFAULT_MAX_LOCATION_AGE_MS;
  const locTime = timestamp || Date.now();

  if (!options?.allowStale && timestamp) {
    const age = Date.now() - timestamp;
    if (age > maxAge) {
      throw new LocationStaleError(age, maxAge);
    }
  }

  return {
    latitude,
    longitude,
    timestamp: locTime,
  };
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number; // ms unix timestamp
  source: 'DEVICE_GPS' | 'DEVICE_NETWORK' | 'MANUAL_AREA';
  locality?: string;
  formattedAddress?: string;
}

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'acquiring'
  | 'located'
  | 'permission_denied'
  | 'timeout'
  | 'unavailable'
  | 'error';

export type AccuracyQuality = 'precise' | 'good' | 'approximate' | 'low';

export interface AccuracyMetadata {
  quality: AccuracyQuality;
  label: string;
  description: string;
  badgeClass: string;
  radiusMeters: number;
}

/**
 * Determine GPS accuracy quality bucket based on reported radius
 */
export function getAccuracyQuality(accuracyMeters: number): AccuracyMetadata {
  if (accuracyMeters <= 25) {
    return {
      quality: 'precise',
      label: 'Precise location',
      description: `High-accuracy GPS fix (±${Math.round(accuracyMeters)}m)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      radiusMeters: accuracyMeters,
    };
  }
  if (accuracyMeters <= 100) {
    return {
      quality: 'good',
      label: 'Good location accuracy',
      description: `Wi-Fi / Network cellular positioning (±${Math.round(accuracyMeters)}m)`,
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      radiusMeters: accuracyMeters,
    };
  }
  if (accuracyMeters <= 500) {
    return {
      quality: 'approximate',
      label: 'Approximate location',
      description: `Broad regional positioning (±${Math.round(accuracyMeters)}m)`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      radiusMeters: accuracyMeters,
    };
  }
  return {
    quality: 'low',
    label: 'Low location accuracy',
    description: `Coarse estimate (±${(accuracyMeters / 1000).toFixed(1)}km)`,
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    radiusMeters: accuracyMeters,
  };
}

/**
 * Calculate precise Haversine distance between two coordinates in Kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Calculate precise Haversine distance in meters
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round(calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) * 1000);
}

/**
 * Check browser Geolocation Permission status
 */
export async function checkGeolocationPermission(): Promise<PermissionState | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * Request real device coordinates using browser Geolocation API
 * Uses high accuracy, timeout: 15000ms, maximumAge: 0 (fresh reading)
 */
export function getCurrentDevicePosition(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const err = new Error('Geolocation is not supported by your browser or device environment.');
      (err as any).code = 2; // POSITION_UNAVAILABLE
      return reject(err);
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 15000,
      maximumAge: options?.maximumAge ?? 0, // Fresh reading, no stale cache
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = pos.coords;
        const accuracy = coords.accuracy || 20;
        const isLikelyGps = accuracy < 35;

        const location: DeviceLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          heading: coords.heading,
          speed: coords.speed,
          timestamp: pos.timestamp || Date.now(),
          source: isLikelyGps ? 'DEVICE_GPS' : 'DEVICE_NETWORK',
        };
        resolve(location);
      },
      (error) => {
        reject(error);
      },
      geoOptions
    );
  });
}

/**
 * Watch movement with distance threshold filtering (minimum 25 meters movement or accuracy gain)
 */
export function watchDevicePosition(
  onUpdate: (location: DeviceLocation) => void,
  onError: (error: GeolocationPositionError) => void,
  minMovementMeters: number = 25
): number | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  let lastAcceptedLocation: DeviceLocation | null = null;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const coords = pos.coords;
      const accuracy = coords.accuracy || 20;
      const newLoc: DeviceLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: pos.timestamp || Date.now(),
        source: accuracy < 35 ? 'DEVICE_GPS' : 'DEVICE_NETWORK',
      };

      if (!lastAcceptedLocation) {
        lastAcceptedLocation = newLoc;
        onUpdate(newLoc);
        return;
      }

      // Check distance moved from last accepted position
      const movedMeters = calculateHaversineDistanceMeters(
        lastAcceptedLocation.latitude,
        lastAcceptedLocation.longitude,
        newLoc.latitude,
        newLoc.longitude
      );

      // Accept update if moved >= minMovementMeters or accuracy improved by > 30%
      const accuracyImproved = newLoc.accuracy < lastAcceptedLocation.accuracy * 0.7;
      if (movedMeters >= minMovementMeters || accuracyImproved) {
        lastAcceptedLocation = newLoc;
        onUpdate(newLoc);
      }
    },
    (err) => {
      onError(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    }
  );

  return watchId;
}

/**
 * Clear an active watch position listener
 */
export function stopWatchingDevicePosition(watchId: number | null): void {
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Perform reverse geocoding via multi-tier server proxy (/api/location/reverse-geocode)
 * with graceful OpenStreetMap Nominatim and formatted coordinates fallback.
 * Avoids client-side Google Maps Geocoder unactivated API console warnings.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{ address: string; locality?: string; city?: string; state?: string }> {
  try {
    const res = await fetch('/api/location/reverse-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.address) {
        return {
          address: data.address,
          locality: data.locality,
          city: data.city,
          state: data.state,
        };
      }
    }
  } catch {
    // Network offline or server unreachable - fallback to formatted coordinates
  }

  return {
    address: `Coordinates: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
    locality: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
  };
}
