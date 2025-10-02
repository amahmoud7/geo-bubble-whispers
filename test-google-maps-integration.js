#!/usr/bin/env node
/**
 * Google Maps Integration Test
 * Tests the Google Maps API key and basic functionality
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const TEST_CONFIG = {
  // Test coordinates (San Francisco)
  testLocation: {
    lat: 37.7749,
    lng: -122.4194,
    address: "San Francisco, CA"
  },
  timeout: 10000,
  retries: 3
};

class GoogleMapsIntegrationTester {
  constructor() {
    this.apiKey = this.loadApiKey();
    this.testResults = [];
  }

  loadApiKey() {
    try {
      // Try to load from .env.local first
      const envLocalPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envLocalPath)) {
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        const match = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/);
        if (match) {
          return match[1].trim();
        }
      }

      // Try .env.production as fallback
      const envProdPath = path.join(process.cwd(), '.env.production');
      if (fs.existsSync(envProdPath)) {
        const envContent = fs.readFileSync(envProdPath, 'utf8');
        const match = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/);
        if (match) {
          return match[1].trim();
        }
      }

      throw new Error('API key not found in environment files');
    } catch (error) {
      console.error('❌ Failed to load API key:', error.message);
      return null;
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async testApiKeyFormat() {
    return this.runTest('API Key Format Validation', () => {
      if (!this.apiKey) {
        throw new Error('API key is missing');
      }
      
      if (!this.apiKey.startsWith('AIza')) {
        throw new Error(`Invalid API key format. Expected: AIza..., Got: ${this.apiKey.substring(0, 8)}...`);
      }
      
      if (this.apiKey.length !== 39) {
        throw new Error(`Invalid API key length. Expected: 39, Got: ${this.apiKey.length}`);
      }
      
      return {
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 8) + '...',
        format: 'valid'
      };
    });
  }

  async testGeocodingApi() {
    return this.runTest('Geocoding API Access', async () => {
      if (!this.apiKey) {
        throw new Error('API key is required for geocoding test');
      }

      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(TEST_CONFIG.testLocation.address)}&key=${this.apiKey}`;
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`API request denied: ${data.error_message || 'Check API key permissions'}`);
      }
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('API quota exceeded');
      }
      
      if (data.status !== 'OK') {
        throw new Error(`Geocoding failed with status: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
      }
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No geocoding results returned');
      }

      return {
        status: data.status,
        resultsCount: data.results.length,
        location: data.results[0].geometry.location,
        formattedAddress: data.results[0].formatted_address
      };
    });
  }

  async testStaticMapsApi() {
    return this.runTest('Static Maps API Access', async () => {
      if (!this.apiKey) {
        throw new Error('API key is required for static maps test');
      }

      const { lat, lng } = TEST_CONFIG.testLocation;
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=400x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(staticMapUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API key lacks permission for Static Maps API');
        } else if (response.status === 429) {
          throw new Error('API quota exceeded for Static Maps');
        } else {
          throw new Error(`Static Maps API returned status: ${response.status}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('image')) {
        throw new Error(`Expected image response, got: ${contentType}`);
      }

      return {
        status: response.status,
        contentType,
        contentLength: response.headers.get('content-length')
      };
    });
  }

  async testJavaScriptApiLoad() {
    return this.runTest('JavaScript API Load Test', async () => {
      if (!this.apiKey) {
        throw new Error('API key is required for JavaScript API test');
      }

      // Test the JavaScript API loader URL
      const jsApiUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&v=weekly`;
      
      const response = await fetch(jsApiUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API key lacks permission for Maps JavaScript API');
        } else if (response.status === 429) {
          throw new Error('API quota exceeded for JavaScript API');
        } else {
          throw new Error(`JavaScript API returned status: ${response.status}`);
        }
      }

      return {
        status: response.status,
        apiUrl: jsApiUrl.replace(this.apiKey, this.apiKey.substring(0, 8) + '...')
      };
    });
  }

  async testApiQuotas() {
    return this.runTest('API Quotas Check', async () => {
      // Make multiple requests to test quota limits
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${this.apiKey}`)
            .then(r => r.json())
            .then(data => ({ request: i + 1, status: data.status }))
        );
      }
      
      const results = await Promise.all(requests);
      
      const quotaExceeded = results.some(r => r.status === 'OVER_QUERY_LIMIT');
      const requestsDenied = results.some(r => r.status === 'REQUEST_DENIED');
      
      if (quotaExceeded) {
        throw new Error('API quota exceeded during quota test');
      }
      
      if (requestsDenied) {
        throw new Error('API requests denied during quota test');
      }
      
      return {
        requestsMade: results.length,
        allSuccessful: results.every(r => r.status === 'OK' || r.status === 'ZERO_RESULTS'),
        statuses: results.map(r => r.status)
      };
    });
  }

  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 GOOGLE MAPS INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${icon} ${test.name} (${test.duration}ms)`);
      if (test.result && typeof test.result === 'object') {
        console.log(`      Result: ${JSON.stringify(test.result, null, 6)}`);
      }
    });

    if (passed === total) {
      console.log('\n🎉 All tests passed! Your Google Maps integration is ready to go.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the error messages above and verify your Google Cloud Console settings.');
      console.log('\n🔗 Helpful Links:');
      console.log('   • Google Cloud Console: https://console.cloud.google.com/apis/credentials');
      console.log('   • Maps JavaScript API: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com');
      console.log('   • Static Maps API: https://console.cloud.google.com/apis/api/static-maps-backend.googleapis.com');
      console.log('   • Geocoding API: https://console.cloud.google.com/apis/api/geocoding-backend.googleapis.com');
    }
    
    console.log('='.repeat(60));
    
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.testResults
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Google Maps Integration Tests...');
    console.log(`📍 Test Location: ${TEST_CONFIG.testLocation.address}`);
    console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
    
    if (!this.apiKey) {
      console.log('❌ Cannot run tests - API key not found');
      return this.generateReport();
    }
    
    console.log(`🔑 API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    
    const tests = [
      this.testApiKeyFormat.bind(this),
      this.testGeocodingApi.bind(this),
      this.testStaticMapsApi.bind(this),
      this.testJavaScriptApiLoad.bind(this),
      this.testApiQuotas.bind(this)
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        // Test failed, continue with next test
        continue;
      }
    }
    
    return this.generateReport();
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  const tester = new GoogleMapsIntegrationTester();
  
  tester.runAllTests()
    .then(report => {
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

export default GoogleMapsIntegrationTester;