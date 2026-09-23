import {
  API_ROUTES,
  HealthAssistantRequest,
  HealthAssistantResponse,
  ApiErrorEnvelope,
} from './apiRoutes';

export interface CallHealthAssistantOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

/**
 * Robust, typed client service for the Canonical Health Assistant API.
 * Features:
 * - Centralized route constant (API_ROUTES.GEMINI.HEALTH_ASSISTANT)
 * - Offline detection (navigator.onLine)
 * - Request timeout via AbortController
 * - Selective retry for transient failures (network drops, 502/503, timeout)
 * - Standardized error envelopes with typed codes
 * - Red-flag safety preservation
 */
export async function callHealthAssistant(
  payload: HealthAssistantRequest,
  options: CallHealthAssistantOptions = {}
): Promise<HealthAssistantResponse> {
  const { timeoutMs = 22000, maxRetries = 1 } = options;

  // 1. Offline Check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: {
        code: 'OFFLINE',
        message: "You're offline. Reconnect and try again.",
      },
    };
  }

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(API_ROUTES.GEMINI.HEALTH_ASSISTANT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: options.signal || controller.signal,
      });

      clearTimeout(timer);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorEnvelope: ApiErrorEnvelope = json?.error || {
          code: response.status === 429 ? 'QUOTA_EXCEEDED' : response.status === 400 ? 'INVALID_REQUEST' : response.status === 504 ? 'TIMEOUT' : 'SERVICE_UNAVAILABLE',
          message: json?.error?.message || (response.status === 429 ? 'Wellness guidance is temporarily unavailable due to high demand.' : 'Wellness guidance is temporarily unavailable.'),
        };

        // If red flags detected on server even with error status, preserve them!
        const hasRedFlags = Boolean(json?.hasRedFlags || json?.data?.hasRedFlags);
        const reply = json?.reply || json?.data?.reply;

        // Permanent failures (400, 401, 403, 429, red flags) should NOT retry
        if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429 || hasRedFlags || attempt > maxRetries) {
          return {
            success: false,
            error: errorEnvelope,
            hasRedFlags,
            reply,
          };
        }

        // Retry for transient 502/503/504 if attempts remain
        if (attempt <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        return {
          success: false,
          error: errorEnvelope,
          hasRedFlags,
          reply,
        };
      }

      if (!json || typeof json !== 'object') {
        throw new Error('Malformed response received from server.');
      }

      const reply = json.reply || json.data?.reply || '';
      const hasRedFlags = Boolean(json.hasRedFlags || json.data?.hasRedFlags);

      return {
        success: true,
        data: {
          reply,
          hasRedFlags,
          isEmergency: Boolean(json.data?.isEmergency),
          isFallback: Boolean(json.isFallback || json.data?.isFallback),
        },
        reply,
        hasRedFlags,
        isFallback: Boolean(json.isFallback || json.data?.isFallback),
      };
    } catch (err: any) {
      clearTimeout(timer);

      const isAbort = err.name === 'AbortError' || controller.signal.aborted;
      const isNetworkError = !isAbort && (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'));

      // If offline during fetch
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return {
          success: false,
          error: {
            code: 'OFFLINE',
            message: "You're offline. Reconnect and try again.",
          },
        };
      }

      if (isAbort) {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out. Please try again.',
          },
        };
      }

      // If transient network error and retries remain
      if (isNetworkError && attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wellness guidance is temporarily unavailable. Please try again.',
        },
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Unable to complete request at this time.',
    },
  };
}
