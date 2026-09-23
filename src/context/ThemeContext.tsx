import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
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
        return saved;
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
      // System or auto: compute based on solar or day/night schedule
      const sched = getActiveSchedule(getStoredCoordinates());
      return sched.isDaytime ? 'light' : 'dark';
    } catch {
      return 'light';
    }
  });

  const isMountedRef = useRef(true);
  const useIsomorphicEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // Recalculates the day/night schedule and returns the latest SolarScheduleResult
  const evaluateSchedule = useCallback((): SolarScheduleResult => {
    const coords = coordinates || getStoredCoordinates();
    const result = getActiveSchedule(coords, new Date());
    setSolarInfo(result);
    return result;
  }, [coordinates]);

  // Apply the effective theme classes to DOM documentElement
  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    let active: 'light' | 'dark' = 'light';

    if (theme === 'system' || theme === 'auto') {
      const schedule = evaluateSchedule();
      active = schedule.isDaytime ? 'light' : 'dark';
    } else {
      active = theme;
    }

    setResolvedTheme(active);

    if (active === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [theme, evaluateSchedule]);

  // Synchronous initial apply & when theme mode changes
  useIsomorphicEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Periodic check & auto-toggle (every 30 seconds) + page visibility change + window focus
  useEffect(() => {
    isMountedRef.current = true;

    const checkAndToggle = () => {
      if (!isMountedRef.current) return;
      if (theme === 'system' || theme === 'auto') {
        applyTheme();
      } else {
        // Still keep solarInfo fresh for UI tooltips and status indicators
        evaluateSchedule();
      }
    };

    // Auto-toggle check interval
    const timer = setInterval(checkAndToggle, 30000);

    // Visibility change check (e.g. user resumes laptop or opens tab after sleep)
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
        setCoordinates({
          latitude: customEvent.detail.latitude,
          longitude: customEvent.detail.longitude,
        });
        if (theme === 'system' || theme === 'auto') {
          setTimeout(checkAndToggle, 0);
        }
      }
    };

    // Cross-tab storage change sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system' || e.newValue === 'auto') {
          setThemeState(e.newValue);
        }
      }
      if (e.key === COORDS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
            setCoordinates({ latitude: parsed.latitude, longitude: parsed.longitude });
          }
        } catch {
          // ignore
        }
      }
    };

    // Passive geolocation detection if browser permission was already granted
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!isMountedRef.current) return;
                const coords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setCoordinates(coords);
                try {
                  localStorage.setItem(
                    COORDS_KEY,
                    JSON.stringify({ ...coords, timestamp: Date.now() })
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
  }, [theme, applyTheme, evaluateSchedule]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('LocalStorage error setting theme:', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (resolvedTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [resolvedTheme, setTheme]);

  const refreshSchedule = useCallback(() => {
    evaluateSchedule();
    if (theme === 'system' || theme === 'auto') {
      applyTheme();
    }
  }, [evaluateSchedule, theme, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        solarInfo,
        setTheme,
        toggleTheme,
        refreshSchedule,
      }}
    >
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
