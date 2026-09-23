/**
 * Centralized API Route Constants and Contract Definitions for Jevan Care
 */

export const API_ROUTES = {
  GEMINI: {
    HEALTH_ASSISTANT: '/api/gemini/health-assistant',
    SCAN_PRESCRIPTION: '/api/gemini/scan-prescription',
    FACT_CHECK: '/api/gemini/fact-check',
    ANALYZE_HEALTH_PROGRESS: '/api/gemini/analyze-health-progress',
    CHECK_MEDICINE_RISK: '/api/gemini/check-medicine-risk',
    SEARCH_VAULT: '/api/gemini/search-vault',
    DOCUMENT_SUMMARY: '/api/gemini/document-summary',
    AI_INSIGHTS: '/api/gemini/ai-insights',
    MEDITATION_COACH: '/api/gemini/meditation-coach',
    HOME_REMEDIES: '/api/gemini/home-remedies',
    LOCAL_HEALTH_ALERTS: '/api/gemini/local-health-alerts',
    PREDICTIVE_HEALTH_TREND: '/api/gemini/predictive-health-trend',
  },
  PHARMACY: {
    SEARCH_MEDICINES: '/api/pharmacy/search-medicines',
    DISCOVER_NEARBY: '/api/places/search-nearby',
  },
  HOSPITAL: {
    DISCOVER_NEARBY: '/api/places/search-nearby',
    SEARCH_TEXT: '/api/places/search-text',
  },
  LOCATION: {
    REVERSE_GEOCODE: '/api/location/reverse-geocode',
    GEOCODE_ADDRESS: '/api/location/geocode-address',
  },
} as const;

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'TIMEOUT'
  | 'OFFLINE'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'SAFETY_RESTRICTION';

export interface ApiErrorEnvelope {
  code: ApiErrorCode | string;
  message: string;
  details?: Record<string, any>;
}

export interface HealthAssistantMessageInput {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  imageUrl?: string;
}

export interface HealthAssistantRequest {
  messages: HealthAssistantMessageInput[];
  languagePreference?: 'en' | 'hi' | 'hinglish' | 'auto';
  userProfile?: {
    id?: string;
    name?: string;
    allergies?: string[];
    chronicConditions?: string[];
    age?: number;
    gender?: string;
    bloodGroup?: string;
  };
  vaultItems?: Array<{
    title: string;
    category: string;
    doctorName?: string;
    diseaseOrTag?: string;
    date: string;
    notes?: string;
  }>;
  activeMedicines?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    salt?: string;
    doctorName?: string;
    instructions?: string;
    duration?: string;
  }>;
  context?: Record<string, any>;
}

export interface HealthAssistantData {
  reply: string;
  voiceText?: string;
  detectedLanguage?: 'en' | 'hi' | 'hinglish';
  emotionDetected?: string;
  followUpQuestion?: string;
  hasRedFlags: boolean;
  isEmergency?: boolean;
  isFallback?: boolean;
}

export interface HealthAssistantResponse {
  success: boolean;
  data?: HealthAssistantData;
  reply?: string;
  voiceText?: string;
  detectedLanguage?: 'en' | 'hi' | 'hinglish';
  emotionDetected?: string;
  followUpQuestion?: string;
  hasRedFlags?: boolean;
  isFallback?: boolean;
  error?: ApiErrorEnvelope;
}
