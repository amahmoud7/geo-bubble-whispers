import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Globe,
  Key,
  Zap,
  Settings
} from 'lucide-react';
import { environment } from '@/config/environment';
import { useGoogleMapsLoader } from '@/contexts/EnhancedMapContext';

interface DiagnosticTest {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: string;
  action?: string;
  actionUrl?: string;
}

export const GoogleMapsDiagnostic: React.FC = () => {
  const { diagnostics, testApiKey, isLoaded, loadError, retry } = useGoogleMapsLoader();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const initialTests: DiagnosticTest[] = [
    {
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking if VITE_GOOGLE_MAPS_API_KEY is set...',
    },
    {
      name: 'API Key Format',
      status: 'pending', 
      message: 'Validating API key format...',
    },
    {
      name: 'Network Connectivity',
      status: 'pending',
      message: 'Testing network connection...',
    },
    {
      name: 'Google Maps API Access',
      status: 'pending',
      message: 'Testing API key permissions...',
    },
    {
      name: 'Maps JavaScript API',
      status: 'pending',
      message: 'Loading Maps JavaScript API...',
    },
    {
      name: 'Browser Compatibility',
      status: 'pending',
      message: 'Checking browser support...',
    }
  ];

  useEffect(() => {
    setTests(initialTests);
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const updatedTests = [...initialTests];

    // Test 1: Environment Variables
    updatedTests[0].status = 'running';
    setTests([...updatedTests]);
    
    const apiKey = environment.get('GOOGLE_MAPS_API_KEY');
    if (apiKey && apiKey.trim() !== '') {
      updatedTests[0].status = 'passed';
      updatedTests[0].message = 'API key is present in environment variables';
      updatedTests[0].details = `Key starts with: ${apiKey.substring(0, 8)}...`;
    } else {
      updatedTests[0].status = 'failed';
      updatedTests[0].message = 'VITE_GOOGLE_MAPS_API_KEY is missing or empty';
      updatedTests[0].action = 'Add API key to .env file';
      updatedTests[0].details = 'Create a .env.local file and add VITE_GOOGLE_MAPS_API_KEY=your_api_key';
    }

    // Test 2: API Key Format
    updatedTests[1].status = 'running';
    setTests([...updatedTests]);

    if (apiKey && apiKey.startsWith('AIza') && apiKey.length === 39) {
      updatedTests[1].status = 'passed';
      updatedTests[1].message = 'API key format is correct';
    } else if (apiKey) {
      updatedTests[1].status = 'failed';
      updatedTests[1].message = 'API key format appears invalid';
      updatedTests[1].details = `Expected: AIza... (39 chars), Got: ${apiKey.substring(0, 8)}... (${apiKey.length} chars)`;
      updatedTests[1].action = 'Verify API key from Google Cloud Console';
      updatedTests[1].actionUrl = 'https://console.cloud.google.com/apis/credentials';
    } else {
      updatedTests[1].status = 'failed';
      updatedTests[1].message = 'Cannot validate format - API key missing';
    }

    // Test 3: Network Connectivity
    updatedTests[2].status = 'running';
    setTests([...updatedTests]);

    try {
      const response = await fetch('https://www.google.com/favicon.ico', { method: 'HEAD' });
      if (response.ok) {
        updatedTests[2].status = 'passed';
        updatedTests[2].message = 'Network connectivity is working';
      } else {
        updatedTests[2].status = 'failed';
        updatedTests[2].message = 'Network connectivity issues detected';
      }
    } catch (error) {
      updatedTests[2].status = 'failed';
      updatedTests[2].message = 'Cannot reach external servers';
      updatedTests[2].details = 'Check your internet connection';
    }

    // Test 4: Google Maps API Access
    if (apiKey) {
      updatedTests[3].status = 'running';
      setTests([...updatedTests]);

      try {
        const isWorking = await testApiKey();
        if (isWorking) {
          updatedTests[3].status = 'passed';
          updatedTests[3].message = 'API key has valid permissions';
        } else {
          updatedTests[3].status = 'failed';
          updatedTests[3].message = 'API key test failed';
          updatedTests[3].details = 'Key may be restricted or have insufficient permissions';
          updatedTests[3].action = 'Check API restrictions and enable Maps JavaScript API';
          updatedTests[3].actionUrl = 'https://console.cloud.google.com/apis/api/maps-backend.googleapis.com';
        }
      } catch (error) {
        updatedTests[3].status = 'failed';
        updatedTests[3].message = 'Failed to test API key';
        updatedTests[3].details = String(error);
      }
    } else {
      updatedTests[3].status = 'failed';
      updatedTests[3].message = 'Cannot test API - key missing';
    }

    // Test 5: Maps JavaScript API Loading
    updatedTests[4].status = 'running';
    setTests([...updatedTests]);

    if (loadError) {
      updatedTests[4].status = 'failed';
      updatedTests[4].message = 'Maps JavaScript API failed to load';
      updatedTests[4].details = loadError.message;
    } else if (isLoaded) {
      updatedTests[4].status = 'passed';
      updatedTests[4].message = 'Maps JavaScript API loaded successfully';
    } else {
      updatedTests[4].status = 'failed';
      updatedTests[4].message = 'Maps JavaScript API not loaded';
    }

    // Test 6: Browser Compatibility
    updatedTests[5].status = 'running';
    setTests([...updatedTests]);

    const isGeolocationSupported = 'geolocation' in navigator;
    const isWebGLSupported = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })();

    if (isGeolocationSupported && isWebGLSupported) {
      updatedTests[5].status = 'passed';
      updatedTests[5].message = 'Browser fully supports Google Maps';
    } else {
      updatedTests[5].status = 'failed';
      updatedTests[5].message = 'Browser has limited Google Maps support';
      updatedTests[5].details = `Geolocation: ${isGeolocationSupported}, WebGL: ${isWebGLSupported}`;
    }

    setTests(updatedTests);
    setIsRunning(false);
  };

  const copyDiagnosticReport = () => {
    const report = `Google Maps Diagnostic Report
Generated: ${new Date().toISOString()}

Environment: ${diagnostics.environment}
User Agent: ${diagnostics.userAgent}
Network Online: ${diagnostics.networkOnline}

Test Results:
${tests.map(test => `
${test.name}: ${test.status.toUpperCase()}
Message: ${test.message}
${test.details ? `Details: ${test.details}` : ''}
${test.action ? `Action: ${test.action}` : ''}
${test.actionUrl ? `URL: ${test.actionUrl}` : ''}
`).join('\n')}

Diagnostics:
${JSON.stringify(diagnostics, null, 2)}
`;

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DiagnosticTest['status']) => {
    const variants = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800', 
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-600'
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Maps Diagnostic</h1>
        <p className="text-gray-600">Comprehensive testing for Google Maps integration</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
            {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
          </Button>
          <Button variant="outline" onClick={retry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Map Load
          </Button>
          <Button variant="outline" onClick={copyDiagnosticReport}>
            {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Report'}
          </Button>
          <Button variant="outline" asChild>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Cloud Console
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-600">Environment</h4>
            <p className="font-mono text-sm">{diagnostics.environment}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600">Network Status</h4>
            <p className="text-sm">{diagnostics.networkOnline ? '🟢 Online' : '🔴 Offline'}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600">API Key Format</h4>
            <p className="text-sm">{diagnostics.keyFormat}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600">API Key Length</h4>
            <p className="text-sm">{diagnostics.keyLength} characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Diagnostic Tests
          </CardTitle>
          <CardDescription>
            Automated tests to identify Google Maps integration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium text-sm">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.message}</p>
                    {test.details && (
                      <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                </div>
              </div>
              
              {test.action && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-orange-600">Action: {test.action}</p>
                    {test.actionUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={test.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Fix
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Google Maps Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                {isLoaded ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : loadError ? (
                  <XCircle className="h-8 w-8 text-red-600" />
                ) : (
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                )}
              </div>
              <h4 className="font-medium">API Loading</h4>
              <p className="text-sm text-gray-600">
                {isLoaded ? 'Loaded' : loadError ? 'Failed' : 'Loading...'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                {diagnostics.keyFormat === 'valid' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h4 className="font-medium">API Key</h4>
              <p className="text-sm text-gray-600">{diagnostics.keyFormat}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                {diagnostics.networkOnline ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h4 className="font-medium">Network</h4>
              <p className="text-sm text-gray-600">
                {diagnostics.networkOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default GoogleMapsDiagnostic;