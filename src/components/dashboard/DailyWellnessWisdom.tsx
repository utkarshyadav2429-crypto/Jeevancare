import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Feather,
  CheckCircle2,
  Clock,
  WifiOff,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { HealthMetricLog, UserProfile, ActiveMedicine } from '../../types';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { API_ROUTES } from '../../services/apiRoutes';
import { callHealthAssistant } from '../../services/healthAssistantService';

interface DailyWellnessWisdomProps {
  profile: UserProfile;
  metricLogs?: HealthMetricLog[];
  activeMedicines?: ActiveMedicine[];
  onNavigateToTab?: (tab: string) => void;
}

export type WisdomCategory =
  | 'Sleep'
  | 'Hydration'
  | 'Movement'
  | 'Nutrition'
  | 'Mindfulness'
  | 'Stress Management'
  | 'Healthy Habits';

export interface WisdomData {
  text: string;
  category: WisdomCategory;
  basisNote: string;
  generatedAt: string;
  dateKey: string;
}

export type WisdomUiState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'offline'
  | 'quota'
  | 'timeout'
  | 'red_flag';

export const DEFAULT_WISDOMS: Record<WisdomCategory, { text: string; basis: string }> = {
  Sleep: {
    text: 'Prioritizing a consistent sleep schedule and keeping your room cool and dark can significantly enhance daytime energy and metabolic resilience.',
    basis: 'Based on sleep & circadian rest logs',
  },
  Hydration: {
    text: 'Drinking a glass of water first thing in the morning gently rehydrates your body, supports digestion, and helps optimize cognitive alertness.',
    basis: 'Based on daily hydration & vital baseline',
  },
  Movement: {
    text: 'A light 10-minute walk after meals supports natural glucose regulation and releases gentle endorphins for sustained focus throughout the day.',
    basis: 'Based on physical activity & mobility trend',
  },
  Nutrition: {
    text: 'Incorporating fiber-rich whole foods and leafy greens into your meals provides steady nourishment and maintains balanced energy levels.',
    basis: 'Based on dietary & metabolic wellness markers',
  },
  Mindfulness: {
    text: 'Taking three slow, deep diaphragmatic breaths during transition points in your day helps quiet your nervous system and restore clarity.',
    basis: 'Based on mood & stress balance logs',
  },
  'Stress Management': {
    text: 'Short, mindful pauses between daily tasks allow your mind to reset, lowering stress markers and improving your overall well-being.',
    basis: 'Based on wellness & vital tracking',
  },
  'Healthy Habits': {
    text: 'Consistency in small daily choices—like timely medication adherence and balanced rest—forms the foundation of long-term health resilience.',
    basis: 'Based on routine medication & health record consistency',
  },
};

export const DailyWellnessWisdom: React.FC<DailyWellnessWisdomProps> = React.memo(({
  profile,
  metricLogs = [],
  activeMedicines = [],
  onNavigateToTab,
}) => {
  const [wisdom, setWisdom] = useState<WisdomData | null>(null);
  const [uiState, setUiState] = useState<WisdomUiState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<number>(0);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const todayDateKey = new Date().toISOString().split('T')[0];
  const storageKey = `jeevancare_daily_wisdom_${profile?.id || 'default'}_${todayDateKey}`;

  const isMountedRef = useRef(true);
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor network connectivity
  useEffect(() => {
    isMountedRef.current = true;

    const handleOnline = () => {
      if (isMountedRef.current) {
        setIsOnline(true);
        if (uiState === 'offline') {
          setUiState('idle');
          setErrorMessage(null);
        }
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setIsOnline(false);
        setUiState('offline');
        setErrorMessage("You're offline. Reconnect and try again.");
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [uiState]);

  // Analyze user metrics to derive relevant wellness category
  const analyzeUserMetrics = useCallback((): { primaryCategory: WisdomCategory; rationale: string } => {
    const latestLog = metricLogs[0];
    const activeMedCount = activeMedicines.length;

    if (latestLog) {
      if (typeof latestLog.sleepHours === 'number' && latestLog.sleepHours < 7) {
        return {
          primaryCategory: 'Sleep',
          rationale: `Recent log shows ${latestLog.sleepHours}h sleep (below target 7-8h)`,
        };
      }
      if (latestLog.mood === 'Neutral' || latestLog.mood === 'Poor' || latestLog.mood === 'Severe') {
        return {
          primaryCategory: 'Stress Management',
          rationale: `Mood log indicates ${latestLog.mood.toLowerCase()} mood balance`,
        };
      }
      if (typeof latestLog.bloodSugar === 'number' && latestLog.bloodSugar > 110) {
        return {
          primaryCategory: 'Nutrition',
          rationale: `Latest blood sugar reading of ${latestLog.bloodSugar} mg/dL`,
        };
      }
      if (latestLog.symptoms && latestLog.symptoms.length > 0) {
        return {
          primaryCategory: 'Mindfulness',
          rationale: `Logged symptoms: ${latestLog.symptoms.join(', ')}`,
        };
      }
    }

    if (activeMedCount > 0) {
      return {
        primaryCategory: 'Healthy Habits',
        rationale: `Managing ${activeMedCount} active prescription regimen${activeMedCount > 1 ? 's' : ''}`,
      };
    }

    return {
      primaryCategory: 'Hydration',
      rationale: 'Personalized wellness guidance based on health profile',
    };
  }, [metricLogs, activeMedicines]);

  // Fetch or Generate Wisdom using Canonical Health Assistant API
  const generateOrFetchWisdom = async (forceRefresh = false) => {
    // 1. Check cached wisdom for today if not force refreshing
    if (!forceRefresh) {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed: WisdomData = JSON.parse(cached);
          if (parsed.dateKey === todayDateKey && parsed.text) {
            setWisdom(parsed);
            setUiState('success');
            setErrorMessage(null);
            return;
          }
        } catch {
          // fallback to fresh generation
        }
      }
    }

    // 2. Check offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setUiState('offline');
      setErrorMessage("You're offline. Reconnect and try again.");
      setIsRefreshing(false);
      return;
    }

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRefreshing(true);
    setUiState('loading');
    setErrorMessage(null);
    setRateLimitNotice(null);

    const { primaryCategory, rationale } = analyzeUserMetrics();

    try {
      const result = await callHealthAssistant(
        {
          messages: [
            {
              sender: 'user',
              text: `Generate 1 short, supportive, evidence-conscious daily wellness tip (25-35 words max) for category "${primaryCategory}". Context: ${rationale}. Format as plain supportive text.`,
            },
          ],
          userProfile: {
            id: profile?.id,
            name: profile?.name,
            allergies: profile?.allergies,
            chronicConditions: profile?.chronicConditions,
          },
          activeMedicines,
        },
        {
          timeoutMs: 20000,
          maxRetries: 1,
          signal: controller.signal,
        }
      );

      if (!isMountedRef.current) return;

      // Handle Red Flag Emergency Warning
      if (result.hasRedFlags) {
        setUiState('red_flag');
        setErrorMessage(
          result.reply ||
            'Emergency alert: Please contact local emergency services immediately if you are experiencing acute symptoms.'
        );
        setIsRefreshing(false);
        return;
      }

      if (result.success && result.reply) {
        let wisdomText = result.reply
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .replace(/⚠️ Disclaimer:.*/gs, '')
          .replace(/^"|"$/g, '')
          .trim();

        // If returned text wrapped in json object {"text": "..."}
        if (wisdomText.startsWith('{') && wisdomText.endsWith('}')) {
          try {
            const parsedObj = JSON.parse(wisdomText);
            if (parsedObj.text) wisdomText = parsedObj.text;
          } catch {
            // ignore JSON parse error and keep sanitized string
          }
        }

        if (wisdomText.length > 15) {
          const newWisdomData: WisdomData = {
            text: wisdomText,
            category: primaryCategory,
            basisNote: rationale,
            generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dateKey: todayDateKey,
          };

          setWisdom(newWisdomData);
          setUiState('success');
          setErrorMessage(null);
          try {
            localStorage.setItem(storageKey, JSON.stringify(newWisdomData));
          } catch {
            // storage quota fallback
          }
          setIsRefreshing(false);
          return;
        }
      }

      // If manual refresh and transient error occurred
      if (forceRefresh && !result.success) {
        setRateLimitNotice('Network is busy. Showing tailored wellness guidance for your profile.');
        if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
        rateLimitTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setRateLimitNotice(null);
        }, 4000);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') {
        return; // normal abort
      }
      if (forceRefresh) {
        setRateLimitNotice('Network is busy. Showing tailored wellness guidance for your profile.');
        if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
        rateLimitTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setRateLimitNotice(null);
        }, 4000);
      }
    }

    // Deterministic fallback if API fails or returned empty
    if (!isMountedRef.current) return;

    const fallbackTemplate = DEFAULT_WISDOMS[primaryCategory] || DEFAULT_WISDOMS['Healthy Habits'];
    const fallbackWisdom: WisdomData = {
      text: fallbackTemplate.text,
      category: primaryCategory,
      basisNote: rationale,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateKey: todayDateKey,
    };

    setWisdom(fallbackWisdom);
    setUiState('success');
    setErrorMessage(null);
    try {
      localStorage.setItem(storageKey, JSON.stringify(fallbackWisdom));
    } catch {
      // storage quota fallback
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    generateOrFetchWisdom(false);
  }, [profile?.id, todayDateKey]);

  // Cooldown / Rate-limit protection for user clicks
  const handleRefreshClick = () => {
    if (isRefreshing) return;

    const now = Date.now();
    if (now - lastRefreshedTime < 5000) {
      setRateLimitNotice('Wisdom is updated for today. Please wait a few seconds before refreshing again.');
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      rateLimitTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setRateLimitNotice(null);
      }, 3500);
      return;
    }

    setLastRefreshedTime(now);
    generateOrFetchWisdom(true);
  };

  return (
    <div
      id="daily-wellness-wisdom-card"
      className="bg-[#e8eee5] dark:bg-[#18281f] border border-[#d3decf] dark:border-[#2a3f32] rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all"
    >
      {/* Background Subtle Pattern */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#1b3b2b] dark:text-[#f2f6f0]">
        <Feather className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-[#1b3b2b] text-[#faf8f5] dark:bg-[#e8eee5] dark:text-[#1b3b2b] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-2xs">
              {wisdom?.category || 'Wellness'}
            </span>
            <span className="text-xs text-[#5c5647] dark:text-[#a8b8a5] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#2b503b] dark:text-[#a8b8a5]" />
              <span>Today's wisdom</span>
            </span>
          </div>

          <button
            id="refresh-wellness-wisdom-btn"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-full text-[#2b503b] dark:text-[#d3e2cb] hover:bg-[#dce6d5] dark:hover:bg-[#23382c] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Refresh Wisdom"
          >
            {isRefreshing ? (
              <JevanCareLoader size="xs" color="forest" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl sm:text-2xl font-serif-editorial italic font-light text-[#1b3b2b] dark:text-[#f2f6f0] leading-snug">
            Daily Wellness Wisdom
          </h3>

          {/* Body content based on state */}
          {uiState === 'loading' ? (
            <div className="py-4">
              <JevanCareLoader variant="button" color="forest" label="Curating personalized insight..." />
            </div>
          ) : uiState === 'red_flag' ? (
            <div className="mt-3 p-3.5 bg-[#fbeae8] dark:bg-[#381e1e] border border-[#f0b5b0] dark:border-[#5e2d2d] rounded-2xl">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#c53030] dark:text-[#f87171] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#9b2c2c] dark:text-[#fca5a5]">
                    Emergency Medical Guidance
                  </p>
                  <p className="text-xs text-[#742a2a] dark:text-[#fecaca] leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          ) : uiState === 'offline' ? (
            <div className="mt-3 p-3 bg-[#f4f2eb] dark:bg-[#202720] border border-[#dfdbcf] dark:border-[#2e3b2e] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-[#7d7565] dark:text-[#9ea89e]" />
                <span className="text-xs text-[#5c5647] dark:text-[#c4d0c4] font-medium">
                  {errorMessage || "You're offline. Reconnect and try again."}
                </span>
              </div>
              <button
                id="retry-offline-wisdom-btn"
                onClick={() => generateOrFetchWisdom(true)}
                className="text-xs font-semibold text-[#1b3b2b] dark:text-[#a8d5b8] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          ) : uiState === 'quota' || uiState === 'timeout' || uiState === 'error' ? (
            <div className="mt-3 p-3 bg-[#f8f5ef] dark:bg-[#1f2820] border border-[#e4decb] dark:border-[#2d3a2e] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#8a7243] dark:text-[#d4b476]" />
                <span className="text-xs text-[#5c5647] dark:text-[#c4d0c4]">
                  {errorMessage || 'Wellness guidance is temporarily unavailable.'}
                </span>
              </div>
              <button
                id="retry-error-wisdom-btn"
                onClick={() => generateOrFetchWisdom(true)}
                className="text-xs font-semibold text-[#1b3b2b] dark:text-[#a8d5b8] hover:underline flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Try Again
              </button>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-[#244836] dark:text-[#d3e2cb] leading-relaxed font-sans font-normal mt-2">
              "{wisdom?.text || DEFAULT_WISDOMS['Healthy Habits'].text}"
            </p>
          )}
        </div>

        {/* Rate Limit Notice Toast if clicked repeatedly */}
        {rateLimitNotice && (
          <p className="text-[11px] text-[#7d3a3e] bg-[#f8ebea] dark:bg-[#3d2023] dark:text-[#e0a8aa] p-2 rounded-xl border border-[#eed8d7] dark:border-[#522c2f] transition-all">
            {rateLimitNotice}
          </p>
        )}

        {/* Bottom Context Line */}
        {wisdom?.basisNote && uiState !== 'loading' && (
          <div className="pt-2 border-t border-[#d3decf]/60 dark:border-[#2a3f32]/60 flex items-center justify-between text-[11px] text-[#5c5647] dark:text-[#a8b8a5]">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#88cba3]" />
              <span>{wisdom.basisNote}</span>
            </span>
            {wisdom.generatedAt && (
              <span className="text-[10px] text-[#827b6c] dark:text-[#8aa08e]">
                Updated {wisdom.generatedAt}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
