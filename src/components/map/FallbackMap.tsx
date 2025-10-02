import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, Settings, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { environment } from '@/config/environment';
import { useGoogleMapsLoader } from '@/contexts/GoogleMapsContext';

interface FallbackMapProps {
  userLocation: { lat: number; lng: number };
  onRetry: () => void;
  error?: string;
}

export const FallbackMap: React.FC<FallbackMapProps> = ({
  userLocation,
  onRetry,
  error
}) => {
  const { diagnostics, testApiKey } = useGoogleMapsLoader();
  const [copied, setCopied] = useState(false);
  const [staticMapError, setStaticMapError] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<boolean | null>(null);
  
  const apiKey = environment.get('GOOGLE_MAPS_API_KEY');
  const staticMapUrl = apiKey ? `https://maps.googleapis.com/maps/api/staticmap?center=${userLocation.lat},${userLocation.lng}&zoom=13&size=600x400&maptype=roadmap&markers=color:red%7C${userLocation.lat},${userLocation.lng}&key=${apiKey}` : null;
  
  // Test the API key when component mounts
  useEffect(() => {
    if (apiKey) {
      testApiKey().then(result => {
        setKeyTestResult(result);
      });
    }
  }, [apiKey, testApiKey]);
  
  const copyDiagnostics = () => {
    const diagnosticText = `Google Maps Diagnostics:
${JSON.stringify(diagnostics, null, 2)}
Error: ${error || 'No specific error'}
Static Map URL: ${staticMapUrl || 'None generated'}
API Key Test: ${keyTestResult === null ? 'Running...' : keyTestResult ? 'PASSED' : 'FAILED'}`;
    
    navigator.clipboard.writeText(diagnosticText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full h-full bg-gray-100 relative flex flex-col items-center justify-center">
      {/* Error Information */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-3">
        {/* Main Error Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                Google Maps Not Available
              </h3>
              <p className="text-xs text-red-700 mb-2">
                {error || 'Unable to load interactive map. Using fallback view.'}
              </p>
              
              {/* Diagnostic Summary */}
              <div className="bg-white rounded border border-red-100 p-2 mb-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium text-gray-600">API Key:</span>
                    <div className="flex items-center gap-1">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        diagnostics.keyFormat === 'valid' ? 'bg-green-100 text-green-700' :
                        diagnostics.keyFormat === 'invalid' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {diagnostics.keyFormat.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Test Result:</span>
                    <div className="flex items-center gap-1">
                      {keyTestResult === null ? (
                        <span className="text-yellow-600">Testing...</span>
                      ) : keyTestResult ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      )}
                      <span className={keyTestResult ? 'text-green-600' : 'text-red-600'}>
                        {keyTestResult === null ? 'Running' : keyTestResult ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyDiagnostics}
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                >
                  {copied ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? 'Copied!' : 'Copy Info'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  API Console
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Diagnostics (Collapsible) */}
        <details className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <summary className="text-sm font-semibold text-blue-800 cursor-pointer hover:text-blue-900">
            🔍 Detailed Diagnostics
          </summary>
          <div className="mt-2 text-xs text-blue-700 space-y-1">
            <div><strong>Environment:</strong> {diagnostics.environment}</div>
            <div><strong>API Key Length:</strong> {diagnostics.keyLength} characters</div>
            <div><strong>Network Status:</strong> {diagnostics.networkOnline ? 'Online' : 'Offline'}</div>
            <div><strong>Timestamp:</strong> {new Date(diagnostics.timestamp).toLocaleString()}</div>
            <div><strong>Static Map:</strong> {staticMapError ? 'Failed to load' : 'Loading...'}</div>
          </div>
        </details>
      </div>

      {/* Static Map Fallback */}
      <div className="flex-1 w-full flex items-center justify-center p-4 pt-32">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
          <div className="bg-blue-600 text-white p-3 text-center">
            <h4 className="font-semibold">Static Map View</h4>
            <p className="text-xs opacity-90">
              Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          </div>
          
          {staticMapUrl ? (
            <img
              src={staticMapUrl}
              alt="Static map showing current location"
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error('Static map failed to load:', staticMapUrl);
                setStaticMapError(true);
                // If static map also fails, show a placeholder
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('Static map loaded successfully');
                setStaticMapError(false);
              }}
            />
          ) : null}
          
          {/* Placeholder if static map fails */}
          <div 
            className="w-full h-64 bg-gray-200 hidden items-center justify-center flex-col"
            style={{ display: 'none' }}
          >
            <MapPin className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm">Map unavailable</p>
            <p className="text-gray-500 text-xs">
              Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
            </p>
          </div>
          
          <div className="p-3 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Interactive features unavailable in fallback mode
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Ensure Google Maps API key is configured</li>
            <li>• Visit /diagnostic page for detailed analysis</li>
            <li>• Contact support if issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};