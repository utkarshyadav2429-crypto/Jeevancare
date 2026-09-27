import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Wraps dynamic React component imports with automatic exponential retry
 * to gracefully handle network blips, Vite dev server restarts, and dynamic import failures.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | Record<string, any>>,
  namedExport?: string,
  retries = 3,
  interval = 800
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        const module = await factory();
        if (namedExport && module[namedExport]) {
          return { default: module[namedExport] as T };
        }
        if (module && 'default' in module && module.default) {
          return { default: module.default as T };
        }
        // If export is object itself or first exported component
        const values = Object.values(module);
        const comp = values.find((v) => typeof v === 'function');
        if (comp) {
          return { default: comp as T };
        }
        return module as { default: T };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Module Loader] Dynamic import failed (attempt ${i + 1}/${retries}). Retrying...`, err);
        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, interval * Math.pow(1.5, i)));
      }
    }

    // If dynamic import failed, check if we should trigger one clean reload
    if (
      typeof window !== 'undefined' &&
      (lastError?.message?.includes('dynamically imported module') ||
        lastError?.message?.includes('Failed to fetch'))
    ) {
      const reloadKey = 'jeevancare_dynamic_import_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('[Module Loader] Recovering from dynamic import error by reloading page...');
        window.location.reload();
      }
    }

    throw lastError;
  });
}
