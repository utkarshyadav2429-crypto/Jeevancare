import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  DeviceLocation,
  LocationStatus,
  AccuracyMetadata,
  getAccuracyQuality,
  getCurrentDevicePosition,
  watchDevicePosition,
  stopWatchingDevicePosition,
  checkGeolocationPermission,
  reverseGeocodeCoordinates,
  isLocationStale,
} from '../services/locationService';

interface LocationContextType {
  location: DeviceLocation | null;
  status: LocationStatus;
  statusMessage: string;
  permissionState: PermissionState | 'unsupported' | 'checking';
  accuracy: number | null;
  accuracyQuality: AccuracyMetadata | null;
  formattedCoords: string | null;
  lastUpdatedTime: string | null;
  addressLabel: string | null;
  isLoading: boolean;
  isWatching: boolean;
  locationAgeSeconds: number;
  isStale: boolean;
  refreshLocation: (force?: boolean) => Promise<DeviceLocation | null>;
  startWatching: () => void;
  stopWatching: () => void;
  setManualLocation: (loc: { latitude: number; longitude: number; addressLabel?: string }) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to acquire device location');
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | 'checking'>('checking');
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [locationAgeSeconds, setLocationAgeSeconds] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isAcquiringRef = useRef(false);

  const locationRef = useRef<DeviceLocation | null>(null);
  locationRef.current = location;

  // Check permission on mount
  useEffect(() => {
    isMountedRef.current = true;
    checkGeolocationPermission().then((perm) => {
      if (isMountedRef.current) {
        setPermissionState(perm);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        stopWatchingDevicePosition(watchIdRef.current);
      }
    };
  }, []);

  // Update location age in seconds every second
  useEffect(() => {
    if (!location) {
      setLocationAgeSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const ageSec = Math.max(0, Math.floor((Date.now() - location.timestamp) / 1000));
      setLocationAgeSeconds(ageSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [location?.timestamp]);

  // Request fresh location
  const refreshLocation = useCallback(
    async (force: boolean = false): Promise<DeviceLocation | null> => {
      if (isAcquiringRef.current && !force) {
        return locationRef.current;
      }

      isAcquiringRef.current = true;
      setStatus('acquiring');
      setStatusMessage('Getting your precise device location...');

      try {
        const freshPosition = await getCurrentDevicePosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // No stale cache allowed
        });

        if (!isMountedRef.current) return null;

        // Perform reverse geocoding
        let resolvedAddress = `${freshPosition.latitude.toFixed(6)}°, ${freshPosition.longitude.toFixed(6)}°`;
        try {
          const geoRes = await reverseGeocodeCoordinates(
            freshPosition.latitude,
            freshPosition.longitude
          );
          if (geoRes.address) {
            resolvedAddress = geoRes.address;
            freshPosition.formattedAddress = geoRes.address;
            freshPosition.locality = geoRes.locality;
          }
        } catch {
          // Keep coordinate string
        }

        setLocation(freshPosition);
        locationRef.current = freshPosition;
        setAddressLabel(resolvedAddress);
        setStatus('located');
        const quality = getAccuracyQuality(freshPosition.accuracy);
        setStatusMessage(`${quality.label} (±${Math.round(freshPosition.accuracy)}m)`);
        setPermissionState('granted');
        isAcquiringRef.current = false;

        try {
          localStorage.setItem(
            'jevancare_user_coords',
            JSON.stringify({
              latitude: freshPosition.latitude,
              longitude: freshPosition.longitude,
              timestamp: Date.now(),
            })
          );
          window.dispatchEvent(
            new CustomEvent('jevan_location_updated', {
              detail: { latitude: freshPosition.latitude, longitude: freshPosition.longitude },
            })
          );
        } catch {
          // ignore localStorage issues
        }

        return freshPosition;
      } catch (err: any) {
        if (!isMountedRef.current) return null;
        isAcquiringRef.current = false;

        if (err.code === 1) {
          // PERMISSION_DENIED
          setStatus('permission_denied');
          setStatusMessage('Location permission is blocked in your browser.');
          setPermissionState('denied');
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setStatus('unavailable');
          setStatusMessage('Device position unavailable. Please check GPS/network connectivity.');
        } else if (err.code === 3) {
          // TIMEOUT
          setStatus('timeout');
          setStatusMessage('GPS request timed out. Please tap Retry to try again.');
        } else {
          setStatus('error');
          setStatusMessage(err.message || 'Failed to acquire location.');
        }

        return null;
      }
    },
    []
  );

  // Start continuous watch
  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    setIsWatching(true);
    const id = watchDevicePosition(
      async (newLoc) => {
        if (!isMountedRef.current) return;
        setLocation(newLoc);
        setStatus('located');
        const quality = getAccuracyQuality(newLoc.accuracy);
        setStatusMessage(`Live tracking: ${quality.label} (±${Math.round(newLoc.accuracy)}m)`);
        try {
          localStorage.setItem(
            'jevancare_user_coords',
            JSON.stringify({
              latitude: newLoc.latitude,
              longitude: newLoc.longitude,
              timestamp: Date.now(),
            })
          );
          window.dispatchEvent(
            new CustomEvent('jevan_location_updated', {
              detail: { latitude: newLoc.latitude, longitude: newLoc.longitude },
            })
          );
        } catch {
          // ignore
        }
      },
      (err) => {
        if (!isMountedRef.current) return;
        if (err.code === 1) {
          setStatus('permission_denied');
          setStatusMessage('Location permission was revoked.');
          setPermissionState('denied');
        }
      },
      25 // minimum 25 meters movement threshold
    );

    watchIdRef.current = id;
  }, []);

  // Auto-acquire on first render and initiate continuous background tracking
  useEffect(() => {
    refreshLocation(false).then((loc) => {
      if (loc && isMountedRef.current) {
        startWatching();
      }
    });
  }, [refreshLocation, startWatching]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      stopWatchingDevicePosition(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  // Set manual location (for explicit manual search by area without pretending to be device GPS)
  const setManualLocation = useCallback(
    (loc: { latitude: number; longitude: number; addressLabel?: string }) => {
      const manualLoc: DeviceLocation = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: 100,
        altitude: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
        source: 'MANUAL_AREA',
        formattedAddress: loc.addressLabel,
      };
      setLocation(manualLoc);
      setAddressLabel(loc.addressLabel || `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`);
      setStatus('located');
      setStatusMessage(`Manual search area: ${loc.addressLabel || 'Custom Area'}`);
    },
    []
  );

  const clearLocation = useCallback(() => {
    setLocation(null);
    setAddressLabel(null);
    setStatus('idle');
    setStatusMessage('Location cleared.');
  }, []);

  const accuracyQuality = location ? getAccuracyQuality(location.accuracy) : null;
  const formattedCoords = location
    ? `${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`
    : null;

  const lastUpdatedTime = location
    ? new Date(location.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const isLoading = status === 'requesting' || status === 'acquiring';

  const contextValue: LocationContextType = {
    location,
    status,
    statusMessage,
    permissionState,
    accuracy: location ? location.accuracy : null,
    accuracyQuality,
    formattedCoords,
    lastUpdatedTime,
    addressLabel,
    isLoading,
    isWatching,
    locationAgeSeconds,
    isStale: location ? isLocationStale(location.timestamp) : false,
    refreshLocation,
    startWatching,
    stopWatching,
    setManualLocation,
    clearLocation,
  };

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>;
};

export const useUserLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
};

export const useLocation = useUserLocation;
