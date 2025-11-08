/**
 * Map Fallback Component
 * 
 * Displays when:
 * - Google Maps API fails to load
 * - Network connectivity issues
 * - Invalid API key
 * - Other loading errors
 */

import React from 'react';
import { MapPin, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapFallbackProps {
  title?: string;
  description?: string;
  error?: Error;
  onRetry?: () => void;
  showDiagnostics?: boolean;
  diagnostics?: {
    environment: string;
    userAgent: string;
    networkOnline: boolean;
    keyFormat: string;
    keyLength: number;
  };
}

const MapFallback: React.FC<MapFallbackProps> = ({
  title = 'Unable to Load Map',
  description = 'There was a problem loading the map. Please check your connection and try again.',
  error,
  onRetry,
  showDiagnostics = import.meta.env.DEV,
  diagnostics,
}) => {
  const isNetworkError = !navigator.onLine;
  const isApiKeyError = error?.message.includes('API key') || error?.message.includes('authentication');

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`rounded-full p-4 ${
            isNetworkError 
              ? 'bg-orange-100' 
              : isApiKeyError 
              ? 'bg-red-100' 
              : 'bg-blue-100'
          }`}>
            {isNetworkError ? (
              <Wifi className="h-12 w-12 text-orange-600" />
            ) : isApiKeyError ? (
              <AlertTriangle className="h-12 w-12 text-red-600" />
            ) : (
              <MapPin className="h-12 w-12 text-blue-600" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600">{description}</p>
        </div>

        {/* Error Details (if available) */}
        {error && (
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-900">Error:</p>
            <p className="text-sm text-slate-700">{error.message}</p>
          </div>
        )}

        {/* Diagnostics (Development Only) */}
        {showDiagnostics && diagnostics && (
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Diagnostics:</p>
            <dl className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <dt className="font-medium">Environment:</dt>
                <dd>{diagnostics.environment}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Network:</dt>
                <dd>{diagnostics.networkOnline ? '✅ Online' : '❌ Offline'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">API Key Format:</dt>
                <dd className={diagnostics.keyFormat === 'valid' ? 'text-green-600' : 'text-red-600'}>
                  {diagnostics.keyFormat}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">API Key Length:</dt>
                <dd>{diagnostics.keyLength} chars</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="space-y-2 text-center text-xs text-slate-500">
          {isNetworkError && (
            <p>Please check your internet connection and try again.</p>
          )}
          {isApiKeyError && (
            <p>
              The Google Maps API key may be invalid or restricted. 
              {import.meta.env.DEV && ' Check your .env file.'}
            </p>
          )}
          {!isNetworkError && !isApiKeyError && (
            <p>If this problem persists, try refreshing the page or clearing your cache.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapFallback;
