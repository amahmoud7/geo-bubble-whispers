// Environment Configuration Management
import { getEnv, getGoogleMapsApiKey } from '@/utils/env';

interface EnvironmentConfig {
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  APP_NAME: string;
  APP_VERSION: string;
  API_BASE_URL: string;
  ENABLE_DEV_TOOLS: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadEnvironmentConfig();
    this.validateConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    const env = getEnv();
    return {
      NODE_ENV: import.meta.env.NODE_ENV || 'development',
      SUPABASE_URL: env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
      GOOGLE_MAPS_API_KEY: getGoogleMapsApiKey(),
      APP_NAME: import.meta.env.VITE_APP_NAME || 'Geo Bubble Whispers',
      APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
      ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
      ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      ENABLE_CRASH_REPORTING: import.meta.env.VITE_ENABLE_CRASH_REPORTING === 'true',
      ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };
  }

  private validateConfig(): void {
    const requiredKeys: (keyof EnvironmentConfig)[] = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'GOOGLE_MAPS_API_KEY',
    ];

    for (const key of requiredKeys) {
      if (!this.config[key]) {
        console.error(`Missing required environment variable: ${key}`);
        if (this.isProduction()) {
          throw new Error(`Missing required environment variable: ${key}`);
        }
      }
    }
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public getConfig(): Readonly<EnvironmentConfig> {
    return Object.freeze({ ...this.config });
  }

  // Security: Don't log sensitive data in production
  public getSafeConfig(): Partial<EnvironmentConfig> {
    const { SUPABASE_ANON_KEY, GOOGLE_MAPS_API_KEY, SENTRY_DSN, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      SUPABASE_ANON_KEY: this.isProduction() ? '***' : SUPABASE_ANON_KEY,
      GOOGLE_MAPS_API_KEY: this.isProduction() ? '***' : GOOGLE_MAPS_API_KEY,
      SENTRY_DSN: this.isProduction() ? '***' : SENTRY_DSN,
    };
  }
}

export const environment = Environment.getInstance();
export type { EnvironmentConfig };