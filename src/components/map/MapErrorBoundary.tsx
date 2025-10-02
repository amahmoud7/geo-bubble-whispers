import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary specifically for map-related errors
 * Prevents map crashes from breaking the entire app
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🗺️ Map Error Boundary caught error:', error);
    console.error('🗺️ Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold">Map Failed to Load</h2>
            <p className="mt-2 text-sm text-slate-300">
              The map encountered an error and needs to be restarted.
            </p>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-slate-400">
                  Technical details
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-800 p-2 text-xs">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
          <Button
            onClick={this.handleReset}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Reload Map
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
