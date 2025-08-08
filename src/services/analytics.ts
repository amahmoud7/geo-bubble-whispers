// Analytics and Crash Reporting Service
import { environment } from '@/config/environment';
import { Capacitor } from '@capacitor/core';

// Types for analytics events
interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, string | number | boolean>;
}

interface UserProperties {
  user_id?: string;
  device_type?: string;
  app_version?: string;
  platform?: string;
}

interface CrashReport {
  error: Error;
  context?: Record<string, any>;
  user_id?: string;
  timestamp?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Only initialize in production or when explicitly enabled
      if (!environment.get('ENABLE_ANALYTICS')) {
        console.log('Analytics disabled in current environment');
        return;
      }

      // Set basic app properties
      await this.setUserProperties({
        app_version: environment.get('APP_VERSION'),
        platform: Capacitor.getPlatform(),
        device_type: Capacitor.getPlatform() === 'ios' ? 'mobile' : 'web',
      });

      // Initialize crash reporting
      if (environment.get('ENABLE_CRASH_REPORTING')) {
        this.initializeCrashReporting();
      }

      this.isInitialized = true;
      console.log('Analytics service initialized');

      // Track app initialization
      await this.trackEvent({
        name: 'app_initialized',
        parameters: {
          platform: Capacitor.getPlatform(),
          version: environment.get('APP_VERSION'),
        },
      });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Set user ID for tracking
   */
  public async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    
    if (!this.isInitialized || !environment.get('ENABLE_ANALYTICS')) return;

    try {
      // Set user properties
      await this.setUserProperties({
        user_id: userId,
      });

      console.log('Analytics user ID set:', userId);
    } catch (error) {
      console.error('Failed to set analytics user ID:', error);
    }
  }

  /**
   * Track an analytics event
   */
  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isInitialized || !environment.get('ENABLE_ANALYTICS')) return;

    try {
      // Add common parameters
      const eventWithDefaults = {
        ...event,
        parameters: {
          ...event.parameters,
          timestamp: new Date().toISOString(),
          user_id: this.userId,
          platform: Capacitor.getPlatform(),
          app_version: environment.get('APP_VERSION'),
        },
      };

      // In a real implementation, you would send this to your analytics service
      // For now, we'll log it and store locally for batch sending
      this.logAnalyticsEvent(eventWithDefaults);

      // Store for batch upload
      await this.storeEventLocally(eventWithDefaults);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track screen view
   */
  public async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    await this.trackEvent({
      name: 'screen_view',
      parameters: {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      },
    });
  }

  /**
   * Track user interaction
   */
  public async trackUserAction(action: string, target: string, value?: number): Promise<void> {
    await this.trackEvent({
      name: 'user_action',
      parameters: {
        action,
        target,
        value: value || 1,
      },
    });
  }

  /**
   * Track error for analytics (non-crash)
   */
  public async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      name: 'error_occurred',
      parameters: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500) || '', // Limit stack trace size
        context: JSON.stringify(context || {}),
      },
    });
  }

  /**
   * Set user properties
   */
  private async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.isInitialized || !environment.get('ENABLE_ANALYTICS')) return;

    try {
      // Store user properties locally
      const existingProperties = JSON.parse(
        localStorage.getItem('analytics_user_properties') || '{}'
      );
      
      const updatedProperties = {
        ...existingProperties,
        ...properties,
        last_updated: new Date().toISOString(),
      };

      localStorage.setItem('analytics_user_properties', JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Initialize crash reporting
   */
  private initializeCrashReporting(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportCrash({
        error: new Error(event.message),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error',
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportCrash({
        error: new Error(event.reason?.toString() || 'Unhandled promise rejection'),
        context: {
          type: 'unhandled_promise_rejection',
          reason: event.reason,
        },
      });
    });

    console.log('Crash reporting initialized');
  }

  /**
   * Report a crash
   */
  public async reportCrash(crashReport: CrashReport): Promise<void> {
    if (!environment.get('ENABLE_CRASH_REPORTING')) return;

    try {
      const enhancedReport = {
        ...crashReport,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
        app_version: environment.get('APP_VERSION'),
        platform: Capacitor.getPlatform(),
        user_agent: navigator.userAgent,
        url: window.location.href,
      };

      // Log to console in development
      if (environment.isDevelopment()) {
        console.error('Crash reported:', enhancedReport);
      }

      // Store crash report locally for later upload
      await this.storeCrashReportLocally(enhancedReport);

      // Also track as analytics event
      await this.trackEvent({
        name: 'crash_occurred',
        parameters: {
          error_name: crashReport.error.name,
          error_message: crashReport.error.message,
          has_context: !!crashReport.context,
        },
      });
    } catch (error) {
      console.error('Failed to report crash:', error);
    }
  }

  /**
   * Log analytics event to console (development)
   */
  private logAnalyticsEvent(event: AnalyticsEvent): void {
    if (environment.isDevelopment()) {
      console.log('Analytics Event:', event.name, event.parameters);
    }
  }

  /**
   * Store event locally for batch upload
   */
  private async storeEventLocally(event: AnalyticsEvent): Promise<void> {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);

      // Keep only last 100 events to prevent storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store event locally:', error);
    }
  }

  /**
   * Store crash report locally
   */
  private async storeCrashReportLocally(crashReport: any): Promise<void> {
    try {
      const crashes = JSON.parse(localStorage.getItem('crash_reports') || '[]');
      crashes.push(crashReport);

      // Keep only last 20 crash reports
      if (crashes.length > 20) {
        crashes.splice(0, crashes.length - 20);
      }

      localStorage.setItem('crash_reports', JSON.stringify(crashes));
    } catch (error) {
      console.error('Failed to store crash report locally:', error);
    }
  }

  /**
   * Upload stored events and crash reports
   */
  public async uploadStoredData(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Upload analytics events
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      if (events.length > 0) {
        // In a real implementation, you would send these to your analytics service
        console.log(`Uploading ${events.length} analytics events`);
        
        // Clear uploaded events
        localStorage.removeItem('analytics_events');
      }

      // Upload crash reports
      const crashes = JSON.parse(localStorage.getItem('crash_reports') || '[]');
      if (crashes.length > 0) {
        // In a real implementation, you would send these to your crash reporting service
        console.log(`Uploading ${crashes.length} crash reports`);
        
        // Clear uploaded crash reports
        localStorage.removeItem('crash_reports');
      }
    } catch (error) {
      console.error('Failed to upload stored data:', error);
    }
  }

  /**
   * Get analytics summary for debugging
   */
  public getAnalyticsSummary(): any {
    if (!environment.isDevelopment()) {
      return { message: 'Analytics summary only available in development' };
    }

    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const crashes = JSON.parse(localStorage.getItem('crash_reports') || '[]');
    const userProperties = JSON.parse(localStorage.getItem('analytics_user_properties') || '{}');

    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      eventCount: events.length,
      crashCount: crashes.length,
      userProperties,
      recentEvents: events.slice(-5),
      recentCrashes: crashes.slice(-3),
    };
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Convenience functions
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);
export const trackScreenView = (screenName: string, screenClass?: string) => 
  analytics.trackScreenView(screenName, screenClass);
export const trackUserAction = (action: string, target: string, value?: number) => 
  analytics.trackUserAction(action, target, value);
export const trackError = (error: Error, context?: Record<string, any>) => 
  analytics.trackError(error, context);
export const reportCrash = (crashReport: CrashReport) => analytics.reportCrash(crashReport);
export const setUserId = (userId: string) => analytics.setUserId(userId);

// Initialize analytics service
export const initializeAnalytics = () => analytics.initialize();