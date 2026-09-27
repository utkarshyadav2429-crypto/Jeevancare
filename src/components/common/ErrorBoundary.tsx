import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isDynamicImportError: boolean;
  isRetrying: boolean;
}

class InnerErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isDynamicImportError: false,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const isDynamicImportError =
      error?.message?.includes('fetch dynamically imported module') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('dynamically imported');

    return {
      hasError: true,
      error,
      isDynamicImportError: Boolean(isDynamicImportError),
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);

    const isDynamic =
      error?.message?.includes('fetch dynamically imported module') ||
      error?.message?.includes('dynamically imported');

    if (isDynamic && typeof window !== 'undefined') {
      const reloadKey = 'jeevancare_last_module_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('[ErrorBoundary] Dynamic import error detected. Performing automatic recovery reload...');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    }
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    if (this.props.onReset) {
      this.props.onReset();
    }
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        isDynamicImportError: false,
        isRetrying: false,
      });
    }, 200);
  };

  handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[420px] p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-white dark:bg-[#16241c] rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs my-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
            {this.state.isDynamicImportError ? (
              <RefreshCw className="w-8 h-8 animate-spin-reverse" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif-editorial mb-2">
            {this.state.isDynamicImportError
              ? 'Updating Application Module'
              : this.props.fallbackTitle || 'Something interrupted this view'}
          </h3>

          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mb-6 leading-relaxed">
            {this.state.isDynamicImportError
              ? 'The module was refreshed or updated during server restart. Tap below to reload the latest version seamlessly.'
              : this.state.error?.message ||
                'An unexpected error occurred while rendering this section. Your personal data is safe.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="px-5 py-2.5 bg-[#1a5336] hover:bg-[#143e29] text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            >
              <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry Module</span>
            </button>

            <button
              onClick={this.handleHardReload}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm font-semibold rounded-xl transition-all border border-stone-200 dark:border-stone-700 flex items-center gap-2 cursor-pointer"
            >
              <span>Reload Page</span>
            </button>

            {this.props.onReset && (
              <button
                onClick={this.props.onReset}
                className="px-4 py-2.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details className="mt-6 text-left w-full max-w-lg p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 font-mono overflow-auto">
              <summary className="cursor-pointer font-bold text-rose-600 dark:text-rose-400">
                Technical Error Details
              </summary>
              <pre className="mt-2 text-[11px] whitespace-pre-wrap">{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = InnerErrorBoundary as unknown as React.ComponentType<ErrorBoundaryProps>;
