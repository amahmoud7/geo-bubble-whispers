import { environment } from '@/config/environment';

export interface EnvironmentCheck {
  key: string;
  status: 'valid' | 'invalid' | 'missing' | 'warning';
  message: string;
  value?: string;
}

export interface DiagnosticsResult {
  overall: 'healthy' | 'warning' | 'error';
  checks: EnvironmentCheck[];
  recommendations: string[];
}

/**
 * Validates Google Maps API key format
 */
function validateGoogleMapsApiKey(apiKey: string): EnvironmentCheck {
  if (!apiKey || apiKey.trim() === '') {
    return {
      key: 'GOOGLE_MAPS_API_KEY',
      status: 'missing',
      message: 'Google Maps API key is missing',
      value: 'Not set'
    };
  }

  if (apiKey === 'your-google-maps-api-key') {
    return {
      key: 'GOOGLE_MAPS_API_KEY',
      status: 'invalid',
      message: 'Google Maps API key is still the example value',
      value: 'Example value'
    };
  }

  if (!apiKey.startsWith('AIza')) {
    return {
      key: 'GOOGLE_MAPS_API_KEY',
      status: 'warning',
      message: 'Google Maps API key format appears invalid (should start with "AIza")',
      value: `${apiKey.substring(0, 8)}...`
    };
  }

  if (apiKey.length < 20) {
    return {
      key: 'GOOGLE_MAPS_API_KEY',
      status: 'warning',
      message: 'Google Maps API key appears too short',
      value: `${apiKey.substring(0, 8)}...`
    };
  }

  return {
    key: 'GOOGLE_MAPS_API_KEY',
    status: 'valid',
    message: 'Google Maps API key format appears valid',
    value: `${apiKey.substring(0, 8)}...`
  };
}

/**
 * Validates Supabase configuration
 */
function validateSupabaseConfig(): EnvironmentCheck[] {
  const checks: EnvironmentCheck[] = [];
  
  const url = environment.get('SUPABASE_URL');
  const anonKey = environment.get('SUPABASE_ANON_KEY');

  // Check URL
  if (!url || url.trim() === '') {
    checks.push({
      key: 'SUPABASE_URL',
      status: 'missing',
      message: 'Supabase URL is missing',
      value: 'Not set'
    });
  } else if (url === 'https://your-project.supabase.co') {
    checks.push({
      key: 'SUPABASE_URL',
      status: 'invalid',
      message: 'Supabase URL is still the example value',
      value: 'Example value'
    });
  } else if (!url.includes('supabase.co')) {
    checks.push({
      key: 'SUPABASE_URL',
      status: 'warning',
      message: 'Supabase URL format appears invalid',
      value: url.substring(0, 30) + '...'
    });
  } else {
    checks.push({
      key: 'SUPABASE_URL',
      status: 'valid',
      message: 'Supabase URL format appears valid',
      value: url
    });
  }

  // Check anon key
  if (!anonKey || anonKey.trim() === '') {
    checks.push({
      key: 'SUPABASE_ANON_KEY',
      status: 'missing',
      message: 'Supabase anonymous key is missing',
      value: 'Not set'
    });
  } else if (anonKey === 'your-anon-key') {
    checks.push({
      key: 'SUPABASE_ANON_KEY',
      status: 'invalid',
      message: 'Supabase anonymous key is still the example value',
      value: 'Example value'
    });
  } else if (!anonKey.includes('.')) {
    checks.push({
      key: 'SUPABASE_ANON_KEY',
      status: 'warning',
      message: 'Supabase anonymous key format appears invalid (should be JWT)',
      value: `${anonKey.substring(0, 20)}...`
    });
  } else {
    checks.push({
      key: 'SUPABASE_ANON_KEY',
      status: 'valid',
      message: 'Supabase anonymous key format appears valid',
      value: `${anonKey.substring(0, 20)}...`
    });
  }

  return checks;
}

/**
 * Runs comprehensive environment diagnostics
 */
export function runEnvironmentDiagnostics(): DiagnosticsResult {
  const checks: EnvironmentCheck[] = [];
  const recommendations: string[] = [];

  // Check Google Maps API key
  const mapsCheck = validateGoogleMapsApiKey(environment.get('GOOGLE_MAPS_API_KEY'));
  checks.push(mapsCheck);

  if (mapsCheck.status !== 'valid') {
    recommendations.push('Configure a valid Google Maps API key in your .env file');
    recommendations.push('Enable Maps JavaScript API and Places API in Google Cloud Console');
  }

  // Check Supabase configuration
  const supabaseChecks = validateSupabaseConfig();
  checks.push(...supabaseChecks);

  const hasSupabaseIssues = supabaseChecks.some(check => check.status !== 'valid');
  if (hasSupabaseIssues) {
    recommendations.push('Configure valid Supabase credentials in your .env file');
  }

  // Environment-specific checks
  const nodeEnv = environment.get('NODE_ENV');
  if (nodeEnv === 'production') {
    checks.push({
      key: 'NODE_ENV',
      status: 'valid',
      message: 'Running in production mode',
      value: 'production'
    });
  } else {
    checks.push({
      key: 'NODE_ENV',
      status: 'warning',
      message: 'Running in development mode',
      value: nodeEnv || 'development'
    });
    recommendations.push('Set NODE_ENV=production for production deployments');
  }

  // Determine overall status
  const hasErrors = checks.some(check => check.status === 'missing' || check.status === 'invalid');
  const hasWarnings = checks.some(check => check.status === 'warning');

  let overall: 'healthy' | 'warning' | 'error' = 'healthy';
  if (hasErrors) {
    overall = 'error';
  } else if (hasWarnings) {
    overall = 'warning';
  }

  return {
    overall,
    checks,
    recommendations
  };
}

/**
 * Tests Google Maps API key by making a test request
 */
export async function testGoogleMapsApiKey(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!apiKey || !apiKey.startsWith('AIza')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    // Test with a simple geocoding request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      return { 
        valid: false, 
        error: data.error_message || 'API key denied - check permissions and restrictions' 
      };
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return { 
        valid: true, // Key is valid but quota exceeded
        error: 'API quota exceeded - key is valid but needs more quota' 
      };
    }

    if (data.status === 'OK' && data.results?.length > 0) {
      return { valid: true };
    }

    return { 
      valid: false, 
      error: `Unexpected API response: ${data.status}` 
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Logs environment diagnostics to console
 */
export function logEnvironmentDiagnostics(): void {
  const diagnostics = runEnvironmentDiagnostics();
  
  console.group('🔍 Environment Diagnostics');
  console.log(`Overall Status: ${diagnostics.overall.toUpperCase()}`);
  
  console.group('🔧 Configuration Checks');
  diagnostics.checks.forEach(check => {
    const emoji = check.status === 'valid' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${emoji} ${check.key}: ${check.message}`);
    if (check.value && check.status !== 'valid') {
      console.log(`   Value: ${check.value}`);
    }
  });
  console.groupEnd();

  if (diagnostics.recommendations.length > 0) {
    console.group('💡 Recommendations');
    diagnostics.recommendations.forEach(rec => console.log(`• ${rec}`));
    console.groupEnd();
  }
  
  console.groupEnd();
}