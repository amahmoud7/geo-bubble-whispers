// Analytics React Hook
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  analytics, 
  trackEvent, 
  trackScreenView, 
  trackUserAction, 
  trackError,
  initializeAnalytics 
} from '@/services/analytics';

interface UseAnalyticsReturn {
  trackEvent: typeof trackEvent;
  trackScreenView: typeof trackScreenView;
  trackUserAction: typeof trackUserAction;
  trackError: typeof trackError;
  trackPageView: (pageName?: string) => void;
  trackButtonClick: (buttonName: string, location?: string) => void;
  trackFeatureUsage: (featureName: string, action: string) => void;
  trackPerformance: (metricName: string, value: number, unit?: string) => void;
}

/**
 * Analytics hook for tracking user interactions and events
 */
export const useAnalytics = (): UseAnalyticsReturn => {
  const location = useLocation();

  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Track page views automatically
  useEffect(() => {
    const pageName = getPageNameFromPath(location.pathname);
    trackScreenView(pageName, pageName);
  }, [location.pathname]);

  // Track page view manually
  const trackPageView = useCallback((pageName?: string) => {
    const page = pageName || getPageNameFromPath(location.pathname);
    trackScreenView(page, page);
  }, [location.pathname]);

  // Track button clicks
  const trackButtonClick = useCallback((buttonName: string, buttonLocation?: string) => {
    trackUserAction('button_click', buttonName, 1);
    trackEvent({
      name: 'button_clicked',
      parameters: {
        button_name: buttonName,
        button_location: buttonLocation || location.pathname,
      },
    });
  }, [location.pathname]);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string, action: string) => {
    trackEvent({
      name: 'feature_used',
      parameters: {
        feature_name: featureName,
        action,
        page: getPageNameFromPath(location.pathname),
      },
    });
  }, [location.pathname]);

  // Track performance metrics
  const trackPerformance = useCallback((metricName: string, value: number, unit = 'ms') => {
    trackEvent({
      name: 'performance_metric',
      parameters: {
        metric_name: metricName,
        value,
        unit,
        page: getPageNameFromPath(location.pathname),
      },
    });
  }, [location.pathname]);

  return {
    trackEvent,
    trackScreenView,
    trackUserAction,
    trackError,
    trackPageView,
    trackButtonClick,
    trackFeatureUsage,
    trackPerformance,
  };
};

/**
 * Hook for tracking specific user authentication events
 */
export const useAuthAnalytics = () => {
  const { trackEvent } = useAnalytics();

  const trackLogin = useCallback((method: string, success: boolean) => {
    trackEvent({
      name: success ? 'login_success' : 'login_failed',
      parameters: {
        login_method: method,
      },
    });
  }, [trackEvent]);

  const trackSignup = useCallback((method: string, success: boolean) => {
    trackEvent({
      name: success ? 'signup_success' : 'signup_failed',
      parameters: {
        signup_method: method,
      },
    });
  }, [trackEvent]);

  const trackLogout = useCallback(() => {
    trackEvent({
      name: 'logout',
      parameters: {},
    });
  }, [trackEvent]);

  const trackPasswordReset = useCallback((success: boolean) => {
    trackEvent({
      name: success ? 'password_reset_success' : 'password_reset_failed',
      parameters: {},
    });
  }, [trackEvent]);

  return {
    trackLogin,
    trackSignup,
    trackLogout,
    trackPasswordReset,
  };
};

/**
 * Hook for tracking map-related events
 */
export const useMapAnalytics = () => {
  const { trackEvent, trackFeatureUsage } = useAnalytics();

  const trackMapInteraction = useCallback((interaction: string, details?: Record<string, any>) => {
    trackFeatureUsage('map', interaction);
    trackEvent({
      name: 'map_interaction',
      parameters: {
        interaction_type: interaction,
        ...details,
      },
    });
  }, [trackEvent, trackFeatureUsage]);

  const trackMessageCreation = useCallback((messageType: string, location?: { lat: number; lng: number }) => {
    trackEvent({
      name: 'message_created',
      parameters: {
        message_type: messageType,
        has_location: !!location,
      },
    });
  }, [trackEvent]);

  const trackMessageInteraction = useCallback((action: string, messageType?: string) => {
    trackEvent({
      name: 'message_interaction',
      parameters: {
        action,
        message_type: messageType || 'unknown',
      },
    });
  }, [trackEvent]);

  const trackLocationPermission = useCallback((granted: boolean, requestType: string) => {
    trackEvent({
      name: 'location_permission',
      parameters: {
        granted,
        request_type: requestType,
      },
    });
  }, [trackEvent]);

  return {
    trackMapInteraction,
    trackMessageCreation,
    trackMessageInteraction,
    trackLocationPermission,
  };
};

/**
 * Hook for tracking performance metrics
 */
export const usePerformanceAnalytics = () => {
  const { trackPerformance } = useAnalytics();

  const trackLoadTime = useCallback((componentName: string, loadTime: number) => {
    trackPerformance(`${componentName}_load_time`, loadTime, 'ms');
  }, [trackPerformance]);

  const trackApiResponseTime = useCallback((endpoint: string, responseTime: number, success: boolean) => {
    trackPerformance(`api_${endpoint}_response_time`, responseTime, 'ms');
    trackEvent({
      name: 'api_call',
      parameters: {
        endpoint,
        response_time: responseTime,
        success,
      },
    });
  }, [trackPerformance]);

  const trackBundleSize = useCallback((bundleName: string, size: number) => {
    trackPerformance(`bundle_${bundleName}_size`, size, 'bytes');
  }, [trackPerformance]);

  return {
    trackLoadTime,
    trackApiResponseTime,
    trackBundleSize,
  };
};

/**
 * Hook for error tracking and reporting
 */
export const useErrorAnalytics = () => {
  const { trackError } = useAnalytics();

  const trackComponentError = useCallback((componentName: string, error: Error, errorInfo?: any) => {
    trackError(error, {
      component: componentName,
      errorInfo: errorInfo?.componentStack?.substring(0, 500),
    });
  }, [trackError]);

  const trackApiError = useCallback((endpoint: string, error: Error, statusCode?: number) => {
    trackError(error, {
      endpoint,
      status_code: statusCode,
      error_type: 'api_error',
    });
  }, [trackError]);

  const trackValidationError = useCallback((formName: string, fieldName: string, errorMessage: string) => {
    trackError(new Error(`Validation error: ${errorMessage}`), {
      form_name: formName,
      field_name: fieldName,
      error_type: 'validation_error',
    });
  }, [trackError]);

  return {
    trackComponentError,
    trackApiError,
    trackValidationError,
  };
};

// Helper function to convert path to readable page name
function getPageNameFromPath(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/': 'Home',
    '/auth': 'Authentication',
    '/profile': 'Profile',
    '/profile/setup': 'Profile Setup',
    '/inbox': 'Inbox',
    '/list': 'Message List',
    '/landing': 'Landing Page',
    '/download': 'Download App',
    '/subscription-confirmed': 'Subscription Confirmed',
  };

  return pathMap[pathname] || pathname.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page';
}