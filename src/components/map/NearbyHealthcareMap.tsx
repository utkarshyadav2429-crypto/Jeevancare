import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Building2,
  Phone,
  Navigation,
  Clock,
  Star,
  Search,
  CheckCircle2,
  AlertCircle,
  Compass,
  Loader2,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Key,
  RefreshCw,
  LocateFixed,
  ArrowUpDown
} from 'lucide-react';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { useToast } from '../../context/ToastContext';
import { useUserLocation } from '../../context/LocationContext';
import { calculateHaversineDistanceKm, isLocationStale } from '../../services/locationService';
import { hospitalDiscoveryService } from '../../services/hospitalDiscoveryService';

// API Key configuration
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey =
  Boolean(API_KEY) &&
  API_KEY !== 'YOUR_API_KEY' &&
  API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY';

// CRITICAL FIX: Define libraries statically outside the component to prevent APIProvider from re-initializing and unmounting inputs on re-renders.
const GOOGLE_MAPS_LIBRARIES: ('places' | 'marker' | 'geometry')[] = ['places', 'marker', 'geometry'];

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Diagnostic Lab' | 'Healthcare';
  distanceKm: number;
  rating: number;
  userRatingCount: number;
  phone?: string;
  openNow?: boolean;
  googleMapsUri: string;
}

interface NearbyHealthcareMapProps {
  onOpenEmergency?: () => void;
}

// Custom hook for debouncing input values without triggering unneeded re-renders
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Map color/style helper by place category
function getCategoryTheme(type: PlaceResult['type']) {
  switch (type) {
    case 'Hospital':
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        pinBg: '#f43f5e',
        glyphColor: '#ffffff'
      };
    case 'Pharmacy':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        pinBg: '#10b981',
        glyphColor: '#ffffff'
      };
    case 'Clinic':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        pinBg: '#3b82f6',
        glyphColor: '#ffffff'
      };
    case 'Diagnostic Lab':
      return {
        bg: 'bg-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        pinBg: '#a855f7',
        glyphColor: '#ffffff'
      };
    default:
      return {
        bg: 'bg-teal-500',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500',
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        pinBg: '#14b8a6',
        glyphColor: '#ffffff'
      };
  }
}

// Robust classification helper that avoids false-positive discarding
function classifyPlaceType(types: string[] = [], name: string = '', activeCategory?: string): PlaceResult['type'] {
  const lowerName = name.toLowerCase();
  const lowerTypes = types.map((t) => (typeof t === 'string' ? t.toLowerCase() : ''));

  // 1. Diagnostic Lab
  if (
    lowerTypes.includes('medical_lab') ||
    lowerTypes.includes('medical_laboratory') ||
    lowerName.includes('lab') ||
    lowerName.includes('diagnostic') ||
    lowerName.includes('pathology') ||
    lowerName.includes('scan') ||
    lowerName.includes('imaging') ||
    lowerName.includes('x-ray') ||
    lowerName.includes('xray') ||
    lowerName.includes('mri') ||
    lowerName.includes('radiology') ||
    lowerName.includes('ultrasound')
  ) {
    return 'Diagnostic Lab';
  }

  // 2. Pharmacy / Chemist / Drugstore
  if (
    lowerTypes.includes('pharmacy') ||
    lowerTypes.includes('drugstore') ||
    lowerName.includes('pharmacy') ||
    lowerName.includes('chemist') ||
    lowerName.includes('medical store') ||
    lowerName.includes('medicos') ||
    lowerName.includes('druggist') ||
    lowerName.includes('dawa') ||
    lowerName.includes('apothecary') ||
    lowerName.includes('medicals')
  ) {
    return 'Pharmacy';
  }

  // 3. Hospital
  if (
    lowerTypes.includes('hospital') ||
    lowerName.includes('hospital') ||
    lowerName.includes('trauma') ||
    lowerName.includes('super speciality') ||
    lowerName.includes('superspeciality') ||
    lowerName.includes('nursing home') ||
    lowerName.includes('institute of medical') ||
    lowerName.includes('emergency care') ||
    lowerName.includes('medical college') ||
    lowerName.includes('infirmary')
  ) {
    return 'Hospital';
  }

  // 4. Clinic / Doctor
  if (
    lowerTypes.includes('doctor') ||
    lowerTypes.includes('physiotherapist') ||
    lowerTypes.includes('dentist') ||
    lowerName.includes('clinic') ||
    lowerName.includes('polyclinic') ||
    lowerName.includes('dispensary') ||
    lowerName.includes('dr.') ||
    lowerName.includes('doctor') ||
    lowerName.includes('consultant') ||
    lowerName.includes('care center') ||
    lowerName.includes('health center') ||
    lowerName.includes('dental')
  ) {
    return 'Clinic';
  }

  // Contextual fallback based on active category
  if (activeCategory === 'Hospitals') return 'Hospital';
  if (activeCategory === 'Pharmacies') return 'Pharmacy';
  if (activeCategory === 'Clinics') return 'Clinic';
  if (activeCategory === 'Diagnostic Labs') return 'Diagnostic Lab';

  return 'Healthcare';
}

// Visual GPS Accuracy Circle Renderer using Google Maps JS Circle
function AccuracyCircle({ center, radiusMeters }: { center: { lat: number; lng: number }; radiusMeters: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !(window as any).google?.maps?.Circle) return;
    const circle = new (window as any).google.maps.Circle({
      map,
      center,
      radius: Math.max(10, Math.min(radiusMeters, 15000)),
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      strokeColor: '#2563eb',
      strokeOpacity: 0.45,
      strokeWeight: 1.5,
      clickable: false,
    });
    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radiusMeters]);
  return null;
}

// Inner Map & Places Search Controller
function PlacesMapContent({
  center,
  userLocation,
  accuracy,
  locationLabel,
  category,
  radiusKm,
  searchQuery,
  sortBy,
  refreshToken,
  onPlacesFetched,
  selectedPlace,
  onSelectPlace
}: {
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  accuracy?: number | null;
  locationLabel: string;
  category: string;
  radiusKm: number;
  searchQuery: string;
  sortBy: 'nearest' | 'rating' | 'reviews';
  refreshToken: number;
  onPlacesFetched: (places: PlaceResult[], loading: boolean, error: string | null) => void;
  selectedPlace: PlaceResult | null;
  onSelectPlace: (place: PlaceResult | null) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [places, setPlaces] = useState<PlaceResult[]>([]);

  // Ref to hold latest callback without causing effect re-triggers
  const onPlacesFetchedRef = useRef(onPlacesFetched);
  useEffect(() => {
    onPlacesFetchedRef.current = onPlacesFetched;
  }, [onPlacesFetched]);

  // Request counter to safely cancel out-of-order race conditions
  const activeReqRef = useRef(0);
  const lastSearchKeyRef = useRef('');

  // Update map center and zoom level smoothly
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      const zoom = radiusKm <= 2 ? 15 : radiusKm <= 5 ? 14 : radiusKm <= 10 ? 12 : 11;
      map.setZoom(zoom);
    }
  }, [map, center.lat, center.lng, radiusKm]);

  // Perform Google Places API Multi-Category Search
  const performSearch = useCallback(async () => {
    if (!center) return;

    const searchKey = `${center.lat.toFixed(4)}_${center.lng.toFixed(4)}_${category}_${radiusKm}_${searchQuery.trim().toLowerCase()}_${sortBy}_${refreshToken}`;
    
    // Prevent redundant searches if key has not changed
    if (lastSearchKeyRef.current === searchKey && places.length > 0) {
      return;
    }

    const currentReqId = ++activeReqRef.current;
    lastSearchKeyRef.current = searchKey;

    onPlacesFetchedRef.current([], true, null);

    const radiusMeters = radiusKm * 1000;
    const placesMap = new Map<string, PlaceResult>();
    let rawPlacesTotal = 0;
    let normalizedTotal = 0;
    let capturedApiError: string | null = null;
    let responseStatus: string | number = 200;

    // Helper to normalize and add/merge discovered place into unified map
    const addOrMergePlace = (
      id: string,
      name: string,
      address: string,
      pLat: number,
      pLng: number,
      types: string[] = [],
      rating?: number,
      userRatingCount?: number,
      phone?: string,
      openNow?: boolean,
      googleMapsUri?: string
    ) => {
      if (!name || isNaN(pLat) || isNaN(pLng)) return;
      normalizedTotal++;

      const dist = calculateHaversineDistanceKm(center.lat, center.lng, pLat, pLng);
      // Radius check with a 5% margin to prevent hard cutoff on boundary facilities
      if (dist > radiusKm * 1.05) return;

      const placeType = classifyPlaceType(types, name);

      // Verify category filter match
      if (category !== 'All') {
        if (category === 'Hospitals' && placeType !== 'Hospital') return;
        if (category === 'Pharmacies' && placeType !== 'Pharmacy') return;
        if (category === 'Clinics' && placeType !== 'Clinic') return;
        if (category === 'Diagnostic Labs' && placeType !== 'Diagnostic Lab') return;
      }

      const placeKey = id || `${pLat.toFixed(5)}_${pLng.toFixed(5)}`;
      const existing = placesMap.get(placeKey);

      if (!existing) {
        placesMap.set(placeKey, {
          id: placeKey,
          name,
          address: address || 'Address unavailable',
          lat: pLat,
          lng: pLng,
          type: placeType,
          distanceKm: dist,
          rating: rating && rating > 0 ? rating : 4.2,
          userRatingCount: userRatingCount || 0,
          phone: phone || '',
          openNow: openNow ?? true,
          googleMapsUri:
            googleMapsUri ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${placeKey}`
        });
      } else {
        // Upgrade existing place with more complete fields
        if (!existing.phone && phone) existing.phone = phone;
        if (rating && rating > 0 && (!existing.rating || existing.rating === 4.2)) existing.rating = rating;
        if (userRatingCount && userRatingCount > existing.userRatingCount) existing.userRatingCount = userRatingCount;
        if (openNow !== undefined) existing.openNow = openNow;
      }
    };

    // -------------------------------------------------------------
    // Target Categories & Types (Google Places API New Table A)
    // -------------------------------------------------------------
    const targetedTypes: string[] = [];
    const targetedTextQueries: string[] = [];

    if (category === 'All') {
      targetedTypes.push('hospital', 'pharmacy', 'drugstore', 'doctor', 'medical_lab');
      targetedTextQueries.push(
        'hospital',
        'pharmacy chemist',
        'clinic doctor',
        'diagnostic center pathology lab'
      );
    } else if (category === 'Hospitals') {
      targetedTypes.push('hospital');
      targetedTextQueries.push('hospital', 'emergency care hospital', 'medical center');
    } else if (category === 'Pharmacies') {
      targetedTypes.push('pharmacy', 'drugstore');
      targetedTextQueries.push('pharmacy', 'chemist shop', 'medical store');
    } else if (category === 'Clinics') {
      targetedTypes.push('doctor', 'physiotherapist', 'dentist');
      targetedTextQueries.push('doctor clinic', 'polyclinic', 'health center');
    } else if (category === 'Diagnostic Labs') {
      targetedTypes.push('medical_lab');
      targetedTextQueries.push('diagnostic center', 'pathology lab', 'radiology scan center');
    }

    const searchPromises: Promise<void>[] = [];

    // 1. Client-Side Places API (New) via useMapsLibrary('places')
    if (placesLib?.Place?.searchNearby && targetedTypes.length > 0) {
      for (const type of targetedTypes) {
        searchPromises.push(
          placesLib.Place.searchNearby({
            locationRestriction: {
              center: { lat: center.lat, lng: center.lng },
              radius: radiusMeters
            },
            includedTypes: [type],
            maxResultCount: 20,
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'location',
              'rating',
              'userRatingCount',
              'nationalPhoneNumber',
              'internationalPhoneNumber',
              'regularOpeningHours',
              'types',
              'googleMapsURI'
            ]
          })
            .then((resp) => {
              if (resp?.places) {
                rawPlacesTotal += resp.places.length;
                for (const p of resp.places) {
                  const rawLat = p.location?.lat;
                  const rawLng = p.location?.lng;
                  const pLat = typeof rawLat === 'function' ? (rawLat as () => number)() : typeof rawLat === 'number' ? rawLat : undefined;
                  const pLng = typeof rawLng === 'function' ? (rawLng as () => number)() : typeof rawLng === 'number' ? rawLng : undefined;
                  if (pLat === undefined || pLng === undefined) continue;

                  const name = typeof p.displayName === 'string' ? p.displayName : ((p.displayName as any)?.text || 'Medical Facility');
                  addOrMergePlace(
                    p.id || '',
                    name,
                    p.formattedAddress || '',
                    pLat,
                    pLng,
                    p.types || [type],
                    p.rating,
                    p.userRatingCount,
                    p.nationalPhoneNumber || p.internationalPhoneNumber,
                    (p.regularOpeningHours as any)?.openNow,
                    p.googleMapsURI
                  );
                }
              }
            })
            .catch((err: any) => {
              const msg = err?.message || String(err);
              responseStatus = err?.code || err?.status || 'ERROR';
              if (msg.includes('disabled') || msg.includes('not been used') || msg.includes('403') || msg.includes('LegacyApiNotActivated')) {
                capturedApiError = msg;
              }
            })
        );
      }
    }

    // 2. Verified hospitalDiscoveryService call with strict coordinate validation
    searchPromises.push(
      (async () => {
        try {
          const res = await hospitalDiscoveryService.fetchNearbyHealthcareFacilities({
            latitude: center.lat,
            longitude: center.lng,
            radiusMeters,
            category,
            searchQuery,
            sortBy,
          });
          if (res.success && Array.isArray(res.facilities)) {
            rawPlacesTotal += res.facilities.length;
            for (const p of res.facilities) {
              addOrMergePlace(
                p.id,
                p.name,
                p.address,
                p.lat,
                p.lng,
                p.types || [p.type],
                p.rating,
                p.userRatingCount,
                p.phone,
                p.openNow,
                p.googleMapsUri || ''
              );
            }
          } else if (res.error) {
            capturedApiError = res.errorDetails
              ? `[Google Places API Error ${res.errorDetails.code}]: ${res.errorDetails.message}`
              : res.error;
          }
        } catch (e: any) {
          capturedApiError = e?.message || 'Hospital discovery service error';
        }
      })()
    );

    // Wait for all queries to settle concurrently
    await Promise.allSettled(searchPromises);

    if (currentReqId !== activeReqRef.current) return;

    let finalResults: PlaceResult[] = Array.from(placesMap.values());

    // Filter by user search bar keyword if entered
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      finalResults = finalResults.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    // Sort results accurately
    if (sortBy === 'nearest') {
      finalResults.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'rating') {
      finalResults.sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
    } else if (sortBy === 'reviews') {
      finalResults.sort((a, b) => b.userRatingCount - a.userRatingCount || a.distanceKm - b.distanceKm);
    }

    // DEVELOPMENT DIAGNOSTICS LOGGING
    console.log('[NearbyHealthcare]');
    console.log('Search center:');
    console.log('latitude', center.lat);
    console.log('longitude', center.lng);
    console.log('Radius:');
    console.log('selected radius', radiusMeters, 'meters');
    console.log('Selected category:');
    console.log(category);
    console.log('Google request:');
    console.log('endpoint', '/v1/places:searchNearby');
    console.log('includedTypes', targetedTypes);
    console.log('rankPreference', 'DISTANCE');
    console.log('maxResultCount', 20);
    console.log('Google response status:');
    console.log('HTTP status', responseStatus);
    console.log('Raw places:');
    console.log(rawPlacesTotal);
    console.log('After normalization:');
    console.log(normalizedTotal);
    console.log('After deduplication:');
    console.log(placesMap.size);
    console.log('After distance calculation:');
    console.log(placesMap.size);
    console.log('After category filtering:');
    console.log(finalResults.length);
    console.log('Final displayed:');
    console.log(finalResults.length);

    setPlaces(finalResults);
    onPlacesFetchedRef.current(
      finalResults,
      false,
      capturedApiError || (finalResults.length === 0
        ? `No healthcare facilities found within ${radiusKm} km. Try expanding the search radius or searching another area.`
        : null)
    );
  }, [center.lat, center.lng, category, radiusKm, searchQuery, sortBy, placesLib, map, refreshToken]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <>
      {/* User GPS Location Marker & Accuracy Boundary */}
      {userLocation && (
        <>
          <AdvancedMarker position={userLocation} title="Your Current GPS Location" zIndex={100}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </AdvancedMarker>
          {accuracy && accuracy > 0 && (
            <AccuracyCircle center={userLocation} radiusMeters={accuracy} />
          )}
        </>
      )}

      {/* Place Pins */}
      {places.map((place) => {
        const theme = getCategoryTheme(place.type);
        const isSelected = selectedPlace?.id === place.id;

        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => onSelectPlace(place)}
            zIndex={isSelected ? 50 : 10}
          >
            <Pin
              background={theme.pinBg}
              borderColor={isSelected ? '#ffffff' : '#00000033'}
              glyphColor={theme.glyphColor}
              scale={isSelected ? 1.3 : 1.0}
            />
          </AdvancedMarker>
        );
      })}

      {/* InfoWindow for Selected Place */}
      {selectedPlace && (
        <InfoWindow
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          onCloseClick={() => onSelectPlace(null)}
          pixelOffset={[0, -30]}
        >
          <div className="p-1 max-w-xs text-slate-800 font-sans">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryTheme(selectedPlace.type).badge}`}>
                {selectedPlace.type}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">{selectedPlace.distanceKm} km away</span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 leading-snug">{selectedPlace.name}</h4>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{selectedPlace.address}</p>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{selectedPlace.rating}</span>
                <span className="text-[10px] text-slate-400 font-normal">({selectedPlace.userRatingCount})</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedPlace.openNow ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {selectedPlace.openNow ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <a
                href={selectedPlace.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 text-center transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
              {selectedPlace.phone && (
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center"
                  title="Call Facility"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export const NearbyHealthcareMap: React.FC<NearbyHealthcareMapProps> = ({ onOpenEmergency }) => {
  const { showToast } = useToast();

  // Centralized Device GPS Context (authoritative single source of truth)
  const {
    location,
    accuracy,
    refreshLocation,
    addressLabel,
  } = useUserLocation();

  // Real user GPS coordinates
  const userLocation = location ? { lat: location.latitude, lng: location.longitude } : null;

  // Manual area search override state
  const [manualSearchCenter, setManualSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocationLabel, setManualLocationLabel] = useState<string>('');
  const isManualLocked = Boolean(manualSearchCenter);

  // Active search center: strictly from manual selection or LocationContext. No hardcoded default coordinates.
  const searchCenter = manualSearchCenter || userLocation;
  const isLocationStaleFix = !isManualLocked && location ? isLocationStale(location.timestamp) : false;
  const locationLabel = isManualLocked
    ? manualLocationLabel
    : addressLabel
    ? addressLabel
    : userLocation
    ? 'Current location'
    : 'Detecting device location...';

  const [refreshToken, setRefreshToken] = useState<number>(Date.now());

  // Input states
  const [areaInput, setAreaInput] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('All');
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Search keyword input & debounced search keyword
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'reviews'>('nearest');

  // Places Results State
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  const categories = ['All', 'Hospitals', 'Pharmacies', 'Clinics', 'Diagnostic Labs'];

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync token when GPS location changes
  useEffect(() => {
    if (location && !manualSearchCenter) {
      setRefreshToken(Date.now());
    }
  }, [location?.latitude, location?.longitude, manualSearchCenter]);

  // Request & Refresh Current GPS Geolocation
  const requestCurrentLocation = useCallback(async (isForced = false) => {
    setManualSearchCenter(null);
    setManualLocationLabel('');
    const fresh = await refreshLocation(isForced);
    if (fresh) {
      setRefreshToken(Date.now());
    }
  }, [refreshLocation]);

  // Manual City / Area Geocoding Search using resilient API proxy
  const handleAreaSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = areaInput.trim();
    if (!query) return;

    setIsGeocoding(true);
    try {
      const res = await fetch('/api/location/geocode-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query }),
      });

      const data = await res.json();
      if (!isMountedRef.current) return;
      setIsGeocoding(false);

      if (data.success && data.location) {
        const newCenter = { lat: Number(data.location.lat), lng: Number(data.location.lng) };
        setManualSearchCenter(newCenter);
        setManualLocationLabel(data.formattedAddress || query);
        setRefreshToken(Date.now()); // Trigger fresh places search
        showToast(`Map centered on ${data.formattedAddress || query}`, 'success');
      } else {
        showToast(
          data.error || `Could not locate area "${query}". Please check spelling or try a prominent city name.`,
          'error'
        );
      }
    } catch (err) {
      if (isMountedRef.current) setIsGeocoding(false);
      console.error('Area geocoding error:', err);
      showToast(`Unable to search area at this time. Please try again.`, 'error');
    }
  };

  // Immediate Keyword Filter Form Submit
  const handleKeywordSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshToken(Date.now());
  };

  const handlePlacesFetched = useCallback((fetched: PlaceResult[], loading: boolean, error: string | null) => {
    setPlaces(fetched);
    setIsLoadingPlaces(loading);
    setPlacesError(error);
    if (fetched.length > 0 && (!selectedPlace || !fetched.some((f) => f.id === selectedPlace.id))) {
      setSelectedPlace(fetched[0]);
    }
  }, [selectedPlace]);

  // Mandatory Setup Screen if Google Maps API Key is missing
  if (!hasValidKey) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl max-w-3xl mx-auto my-6 text-slate-800 dark:text-slate-100 font-sans">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Setup Required
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Google Maps Platform API Key Missing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              To discover real-time nearby hospitals, pharmacies, clinics & diagnostic centers with GPS mapping, please add your Google Maps API key.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              How to enable Google Maps integration:
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                Obtain a Google Maps Platform API Key from the{' '}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 dark:text-teal-400 font-bold underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                In this AI Studio workspace, open <strong>Settings</strong> (⚙️ gear icon in top-right corner).
              </li>
              <li>
                Select <strong>Secrets</strong> menu option.
              </li>
              <li>
                Enter Secret Name: <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-teal-600 dark:text-teal-400">GOOGLE_MAPS_PLATFORM_KEY</code>
              </li>
              <li>
                Paste your API key in the Secret Value field and press <strong>Enter</strong>.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} libraries={GOOGLE_MAPS_LIBRARIES}>
      <div className="space-y-6">

        {/* Top Header & Emergency SOS shortcut */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Nearby Healthcare & Live Services
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Google Maps Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time location-based discovery of genuine hospitals, 24/7 pharmacies, clinics, and diagnostic labs.
              </p>
            </div>
          </div>

          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>Emergency SOS Hub</span>
            </button>
          )}
        </div>

        {/* Controls Bar: Search Particular Area, Categories, Search Radius & Sorting */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* 1. Manual City / Area Search Form */}
            <form onSubmit={handleAreaSearchSubmit} className="relative md:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Compass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Search city or area (e.g., Lucknow, Bandra Mumbai, Connaught Place)..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isGeocoding || !areaInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700 font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isGeocoding ? <JevanCareLoader size="xs" color="white" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search Area</span>
              </button>
              {isManualLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setManualSearchCenter(null);
                    setManualLocationLabel('');
                    setAreaInput('');
                    refreshLocation(true);
                  }}
                  className="px-3 py-2.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                  title="Reset to device location"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Reset to GPS</span>
                </button>
              )}
            </form>

            {/* 2. Keyword Search Filter inside active area - FOCUS FIXED */}
            <form onSubmit={handleKeywordSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter results by name or street..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-medium"
              />
            </form>
          </div>

          {/* Row 2: Category Tabs, Radius Selector, Sort Order */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full pb-1 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setRefreshToken(Date.now());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Radius & Sort Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end text-xs font-semibold">

              {/* Radius selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => {
                    setRadiusKm(Number(e.target.value));
                    setRefreshToken(Date.now());
                  }}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer text-xs"
                >
                  <option value={1} className="dark:bg-slate-800">1 km</option>
                  <option value={3} className="dark:bg-slate-800">3 km</option>
                  <option value={5} className="dark:bg-slate-800">5 km</option>
                  <option value={10} className="dark:bg-slate-800">10 km</option>
                  <option value={20} className="dark:bg-slate-800">20 km</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="nearest" className="dark:bg-slate-800">Nearest First</option>
                  <option value="rating" className="dark:bg-slate-800">Highest Rated</option>
                  <option value="reviews" className="dark:bg-slate-800">Most Reviewed</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Main Section: Map + Facilities List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Interactive Google Map */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 relative min-h-[480px] overflow-hidden flex flex-col justify-between shadow-xl">

            {/* Top overlay badge bar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 text-xs">
              <span className="flex items-center gap-2 text-teal-400 font-bold truncate">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{locationLabel} ({radiusKm} km radius)</span>
              </span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {isLocationStaleFix && (
                  <button
                    onClick={() => requestCurrentLocation(true)}
                    className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] font-semibold hover:bg-amber-500/30 transition-all"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Location Stale • Refresh</span>
                  </button>
                )}
                <span className="text-slate-400 font-semibold">
                  {isLoadingPlaces ? 'Searching...' : `${places.length} Facilities Found`}
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="w-full h-[360px] sm:h-[450px] md:h-[520px] relative">
              {searchCenter ? (
                <GoogleMap
                  defaultCenter={searchCenter}
                  defaultZoom={14}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  <PlacesMapContent
                    center={searchCenter}
                    userLocation={userLocation}
                    accuracy={accuracy}
                    locationLabel={locationLabel}
                    category={category}
                    radiusKm={radiusKm}
                    searchQuery={debouncedSearchQuery}
                    sortBy={sortBy}
                    refreshToken={refreshToken}
                    onPlacesFetched={handlePlacesFetched}
                    selectedPlace={selectedPlace}
                    onSelectPlace={setSelectedPlace}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <LocateFixed className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h3 className="font-bold text-slate-100 text-sm">Location Access Needed</h3>
                    <p className="text-xs text-slate-400">
                      To display nearby hospitals, clinics, and emergency care facilities, please share your device location or choose a search area.
                    </p>
                  </div>
                  <button
                    onClick={() => requestCurrentLocation(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Use Current Location</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selected Place Card overlay */}
            {selectedPlace && (
              <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xl">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryTheme(selectedPlace.type).badge}`}>
                      {selectedPlace.type}
                    </span>
                    <span className="text-[10px] text-teal-400 font-bold">{selectedPlace.distanceKm} km away</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white truncate">{selectedPlace.name}</h4>
                  <p className="text-slate-400 text-xs truncate">{selectedPlace.address}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={selectedPlace.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                  {selectedPlace.phone && (
                    <a
                      href={`tel:${selectedPlace.phone}`}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      <span>Call</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Places Results Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Nearby Facilities ({places.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Sorted by {sortBy}</span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
              {isLoadingPlaces ? (
                <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <JevanCareLoader size="lg" color="forest" variant="card" label="Finding nearby healthcare facilities..." />
                </div>
              ) : placesError && (placesError.includes('API_KEY_SERVICE_BLOCKED') || placesError.includes('blocked')) ? (
                <div className="p-5 bg-amber-50/95 dark:bg-amber-950/50 rounded-2xl border border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">Google Cloud API Key Restrictions Update Required</h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        The API key for project <code>891628260700</code> has API restrictions that block <strong>Places API (New)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 font-sans">
                    <p className="font-bold text-amber-900 dark:text-amber-200">To allow nearby healthcare search:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <li>Go to <strong>Google Cloud Console → APIs & Services → Credentials</strong>.</li>
                      <li>Click your API key to open its settings.</li>
                      <li>Under <strong>API restrictions</strong>, add <strong>Places API (New)</strong> (or choose <em>Don't restrict key</em>).</li>
                      <li>Click <strong>Save</strong>.</li>
                    </ol>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href="https://console.cloud.google.com/apis/credentials?project=891628260700"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Update API Key Restrictions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setRefreshToken((prev) => prev + 1)}
                      className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ) : placesError && (placesError.includes('Places API') || placesError.includes('403') || placesError.includes('PERMISSION_DENIED') || placesError.includes('disabled') || placesError.includes('LegacyApiNotActivated')) ? (
                <div className="p-5 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">Google Cloud Places API (New) Setup Required</h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        The Google Maps key is loaded, but <strong>Places API (New)</strong> is not yet enabled for project <code>891628260700</code>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 break-words">
                    {placesError}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href="https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=891628260700"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Enable Places API (New) in Cloud Console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setRefreshToken((prev) => prev + 1)}
                      className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ) : places.length === 0 ? (
                <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No medical facilities found</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {placesError || `Try increasing the search radius (e.g., 10 km or 20 km) or typing another area name above.`}
                  </p>
                  <button
                    onClick={() => {
                      setRadiusKm(10);
                      setRefreshToken(Date.now());
                    }}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Expand to 10 km
                  </button>
                </div>
              ) : (
                places.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const theme = getCategoryTheme(place.type);

                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelectedPlace(place)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all space-y-2.5 ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 dark:border-teal-600 shadow-md ring-2 ring-teal-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                              {place.type}
                            </span>
                            <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                              • {place.distanceKm} km away
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1 leading-snug">
                            {place.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-amber-500 shrink-0 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{place.rating}</span>
                        </div>
                      </div>

                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {place.address}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                          place.openNow
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
                        }`}>
                          <Clock className="w-3 h-3" /> {place.openNow ? 'Open Now' : 'Closed'}
                        </span>

                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </APIProvider>
  );
};
