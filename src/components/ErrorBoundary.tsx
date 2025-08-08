// Error Boundary with Crash Reporting
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportCrash } from '@/services/analytics';
import { environment } from '@/config/environment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Report crash to analytics service
    reportCrash({
      error,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
      },
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleResetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                We're sorry, but something unexpected happened. The error has been reported 
                and we'll work on fixing it.
              </p>
              
              {environment.isDevelopment() && this.state.error && (
                <details className="bg-gray-100 p-3 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {!environment.isDevelopment() && this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded-md text-sm text-center">
                  <strong>Error ID:</strong> {this.state.errorId}
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID if you contact support
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={this.handleResetError} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button onClick={this.handleReload} className="w-full" variant="outline">
                Reload Page
              </Button>
              
              <Button onClick={this.handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Lightweight error boundary for specific components
export function ErrorBoundaryWrapper({ 
  children, 
  componentName,
  fallback 
}: { 
  children: ReactNode; 
  componentName: string;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">
            Error loading {componentName}. Please try refreshing the page.
          </p>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}