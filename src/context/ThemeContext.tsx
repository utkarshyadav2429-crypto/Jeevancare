import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  SolarScheduleResult,
  getActiveSchedule,
} from '../utils/solarSchedule';

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  solarInfo: SolarScheduleResult;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  refreshSchedule: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'jevancare_theme';
const COORDS_KEY = 'jevancare_user_coords';

function getStoredCoordinates(): { latitude: number; longitude: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.latitude === 'number' &&
      typeof parsed?.longitude === 'number' &&
      !isNaN(parsed.latitude) &&
      !isNaN(parsed.longitude)
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  } catch {
    // Ignore JSON errors
  }
  return null;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User's chosen theme mode preference ('light' | 'dark' | 'system' | 'auto')
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system' || saved === 'auto') {
        return saved as ThemeMode;
      }
    } catch (e) {
      console.warn('LocalStorage error reading theme:', e);
    }
    return 'system';
  });

  // 2. Active geolocation coordinates for solar calculation
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    () => getStoredCoordinates()
  );
  const coordinatesRef = useRef(coordinates);
  coordinatesRef.current = coordinates;

  // 3. Solar & system-clock schedule evaluation
  const [solarInfo, setSolarInfo] = useState<SolarScheduleResult>(() =>
    getActiveSchedule(getStoredCoordinates())
  );

  // 4. Actively applied theme ('light' | 'dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      const sched = getActiveSchedule(getStoredCoordinates());
      return sched.isDaytime ? 'light' : 'dark';
    } catch {
      return 'light';
    }
  });

  const isMountedRef = useRef(true);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Recalculates the day/night schedule and returns the latest SolarScheduleResult
  const evaluateSchedule = useCallback((): SolarScheduleResult => {
    const coords = coordinatesRef.current || getStoredCoordinates();
    const result = getActiveSchedule(coords, new Date());
    setSolarInfo((prev) => {
      if (
        prev &&
        prev.isDaytime === result.isDaytime &&
        prev.sunriseTime === result.sunriseTime &&
        prev.sunsetTime === result.sunsetTime
      ) {
        return prev;
      }
      return result;
    });
    return result;
  }, []);

  const evaluateScheduleRef = useRef(evaluateSchedule);
  evaluateScheduleRef.current = evaluateSchedule;

  // Apply the effective theme classes to DOM documentElement
  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const currentTheme = themeRef.current;

    let active: 'light' | 'dark' = 'light';

    if (currentTheme === 'system' || currentTheme === 'auto') {
      const schedule = evaluateScheduleRef.current();
      active = schedule.isDaytime ? 'light' : 'dark';
    } else {
      active = currentTheme;
    }

    setResolvedTheme((prev) => (prev === active ? prev : active));

    if (active === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, []);

  const applyThemeRef = useRef(applyTheme);
  applyThemeRef.current = applyTheme;

  // Synchronous initial apply & when theme mode changes
  useEffect(() => {
    applyTheme();
  }, [theme, applyTheme]);

  // Periodic check & auto-toggle + page visibility change + window focus + storage sync
  useEffect(() => {
    isMountedRef.current = true;

    const checkAndToggle = () => {
      if (!isMountedRef.current) return;
      if (themeRef.current === 'system' || themeRef.current === 'auto') {
        applyThemeRef.current();
      } else {
        evaluateScheduleRef.current();
      }
    };

    // Auto-toggle check interval (every 30 seconds)
    const timer = setInterval(checkAndToggle, 30000);

    // Visibility change check
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndToggle();
      }
    };

    // Listen for coordinate updates from LocationContext
    const handleLocationUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ latitude: number; longitude: number }>;
      if (
        customEvent?.detail &&
        typeof customEvent.detail.latitude === 'number' &&
        typeof customEvent.detail.longitude === 'number'
      ) {
        const { latitude, longitude } = customEvent.detail;
        setCoordinates((prev) => {
          if (
            prev &&
            Math.abs(prev.latitude - latitude) < 0.0001 &&
            Math.abs(prev.longitude - longitude) < 0.0001
          ) {
            return prev;
          }
          return { latitude, longitude };
        });
        if (themeRef.current === 'system' || themeRef.current === 'auto') {
          setTimeout(checkAndToggle, 0);
        }
      }
    };

    // Cross-tab storage change sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system' || e.newValue === 'auto') {
          setThemeState(e.newValue as ThemeMode);
        }
      }
      if (e.key === COORDS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
            const { latitude, longitude } = parsed;
            setCoordinates((prev) => {
              if (
                prev &&
                Math.abs(prev.latitude - latitude) < 0.0001 &&
                Math.abs(prev.longitude - longitude) < 0.0001
              ) {
                return prev;
              }
              return { latitude, longitude };
            });
          }
        } catch {
          // ignore
        }
      }
    };

    // Passive geolocation detection if browser permission was already granted (run once)
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!isMountedRef.current) return;
                const newCoords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setCoordinates((prev) => {
                  if (
                    prev &&
                    Math.abs(prev.latitude - newCoords.latitude) < 0.0001 &&
                    Math.abs(prev.longitude - newCoords.longitude) < 0.0001
                  ) {
                    return prev;
                  }
                  return newCoords;
                });
                try {
                  localStorage.setItem(
                    COORDS_KEY,
                    JSON.stringify({ ...newCoords, timestamp: Date.now() })
                  );
                } catch {
                  // ignore
                }
              },
              () => {},
              { enableHighAccuracy: false, maximumAge: 3600000, timeout: 8000 }
            );
          }
        })
        .catch(() => {});
    }

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAndToggle);
    window.addEventListener('jevan_location_updated', handleLocationUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAndToggle);
      window.removeEventListener('jevan_location_updated', handleLocationUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('LocalStorage error setting theme:', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        console.warn('LocalStorage error toggling theme:', e);
      }
      return next;
    });
  }, []);

  const refreshSchedule = useCallback(() => {
    evaluateSchedule();
    if (themeRef.current === 'system' || themeRef.current === 'auto') {
      applyTheme();
    }
  }, [evaluateSchedule, applyTheme]);

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      solarInfo,
      setTheme,
      toggleTheme,
      refreshSchedule,
    }),
    [theme, resolvedTheme, solarInfo, setTheme, toggleTheme, refreshSchedule]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
