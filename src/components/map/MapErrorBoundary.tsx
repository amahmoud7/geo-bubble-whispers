/**
 * Map Error Boundary
 * 
 * Catches errors in the map component tree and provides:
 * - Graceful error UI with retry option
 * - Prevents entire app from crashing
 * - Error logging for debugging
 * - Isolated recovery mechanism
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Map Error Boundary caught error:', error);
    console.error('🚨 Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (environment.get('ENABLE_CRASH_REPORTING')) {
    //   logErrorToService(error, errorInfo);
    // }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                Map Error
              </h2>
              <p className="text-slate-600">
                Something went wrong with the map. This has been logged and we'll look into it.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="rounded-lg bg-slate-100 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">
                  Error Details:
                </p>
                <pre className="overflow-x-auto text-xs text-slate-700">
                  {this.state.error.message}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-600">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-x-auto text-xs text-slate-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Reload App
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs text-slate-500">
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
