import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FallbackMap } from './FallbackMap';
import { environment } from '@/config/environment';

interface Props {
  children: ReactNode;
  userLocation: { lat: number; lng: number };
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class GoogleMapsErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Google Maps Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to analytics/monitoring service if enabled
    if (environment.get('ENABLE_CRASH_REPORTING')) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send to a crash reporting service like Sentry
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.warn('Map Error Report:', errorData);
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined 
      });
    } else {
      console.warn('Max retry attempts reached for Google Maps');
    }
  };

  private getErrorMessage = (): string => {
    const { error } = this.state;
    const { fallbackMessage } = this.props;

    if (fallbackMessage) {
      return fallbackMessage;
    }

    if (error?.message) {
      // Common Google Maps API errors
      if (error.message.includes('API key')) {
        return 'Google Maps API key is invalid or missing. Please check your configuration.';
      }
      if (error.message.includes('quota')) {
        return 'Google Maps API quota exceeded. Please try again later.';
      }
      if (error.message.includes('network')) {
        return 'Network error loading Google Maps. Please check your internet connection.';
      }
      if (error.message.includes('loading')) {
        return 'Failed to load Google Maps. This might be due to network issues or API restrictions.';
      }
      
      return `Google Maps error: ${error.message}`;
    }

    return 'An unexpected error occurred while loading Google Maps.';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <FallbackMap
          userLocation={this.props.userLocation}
          onRetry={canRetry ? this.handleRetry : () => window.location.reload()}
          error={errorMessage}
        />
      );
    }

    return this.props.children;
  }
}

export default GoogleMapsErrorBoundary;