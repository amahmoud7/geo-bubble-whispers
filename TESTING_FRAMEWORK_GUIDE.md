# 🎯 Ticketmaster Events Testing Framework - Complete Guide

This comprehensive testing framework ensures the Ticketmaster events functionality works reliably across **ALL major US cities** and handles every possible scenario.

## 📋 Framework Overview

### Test Coverage Areas

1. **🧪 Functional Testing**
   - City detection for 100+ US metropolitan areas
   - Event fetching and processing logic
   - Error handling and edge cases
   - API integration validation

2. **🌍 Geographic Coverage**
   - All 50 US states + Washington DC
   - Major metropolitan areas (NYC, LA, Chicago, etc.)
   - Secondary cities and state capitals
   - Rural area fallback functionality
   - Alaska, Hawaii, and border city edge cases

3. **🔗 API Integration**
   - Ticketmaster Discovery API testing
   - Market ID mapping and fallback logic
   - Rate limiting and caching functionality
   - Supabase function integration
   - Error scenarios and recovery

4. **🎭 End-to-End Testing**
   - Complete user journeys from map interaction to event display
   - Mobile and desktop browser compatibility
   - Network condition handling
   - Performance under load

5. **🔒 Regression Testing**
   - Backward compatibility preservation
   - Legacy functionality maintenance
   - API signature stability
   - Performance regression detection

6. **⚡ Performance Benchmarking**
   - Response time monitoring
   - Memory usage optimization
   - Scalability testing
   - Load testing capabilities

## 🏗️ Framework Architecture

### Directory Structure
```
tests/
├── setup.ts                           # Test environment setup
├── mocks/
│   └── handlers.ts                     # MSW API mocks
├── unit/
│   ├── cityDetection.test.ts          # City detection logic
│   └── enhancedEventService.test.ts   # Event service functionality
├── geographic/
│   └── cityCoverage.test.ts           # Geographic coverage validation
├── integration/
│   └── apiIntegration.test.ts         # API integration tests
├── e2e/
│   └── eventsFunctionality.spec.ts    # End-to-end user journeys
├── regression/
│   └── backwardCompatibility.test.ts  # Regression prevention
└── performance/
    └── benchmarks.test.ts              # Performance benchmarks
```

### Configuration Files
- `vitest.config.ts` - Unit/integration test configuration
- `playwright.config.ts` - E2E test configuration
- `package.json` - Dependencies and scripts
- `.github/workflows/events-testing.yml` - CI/CD automation

## 🚀 Running Tests

### Quick Start
```bash
# Install dependencies
npm ci

# Validate test setup
node scripts/validate-test-setup.js

# Run all tests
./scripts/run-comprehensive-tests.sh
```

### Individual Test Suites

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# Coverage report
npm run test:coverage

# End-to-end tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Performance benchmarks
npm run test -- tests/performance/

# Geographic coverage
npm run test -- tests/geographic/

# API integration
npm run test -- tests/integration/

# Regression tests
npm run test -- tests/regression/
```

### Targeted Test Execution

```bash
# Test specific cities
./scripts/run-comprehensive-tests.sh cities

# Performance only
./scripts/run-comprehensive-tests.sh performance

# Unit tests only
./scripts/run-comprehensive-tests.sh unit

# Integration only
./scripts/run-comprehensive-tests.sh integration
```

## 📊 Test Results & Reports

### Automated Reports
- **Comprehensive Report**: `test-results/{timestamp}/comprehensive-report.md`
- **Coverage Report**: `coverage/index.html`
- **E2E Results**: `playwright-report/index.html`
- **Performance Metrics**: Console output and JSON files

### Key Metrics Tracked
- **City Detection Accuracy**: 95%+ success rate across major metros
- **API Response Times**: <2 seconds for event fetching
- **Geographic Coverage**: 100+ cities across all 50 states
- **Performance Benchmarks**: <10ms city detection, 1000+ ops/sec
- **Browser Compatibility**: Chrome, Firefox, Safari (desktop + mobile)

## 🎯 Testing Major US Cities

### Primary Markets (Always Tested)
- New York City (Market ID: 35)
- Los Angeles (Market ID: 27) 
- Chicago (Market ID: 8)
- Houston (Market ID: 18)
- Phoenix (Market ID: 17)
- Philadelphia (Market ID: 29)
- San Antonio (Market ID: 59)
- San Diego (Market ID: 37)
- Dallas (Market ID: 11)
- San Jose (Market ID: 41)

### Geographic Regions Covered
- **Northeast**: NYC, Boston, Philadelphia, Washington DC
- **Southeast**: Miami, Atlanta, Charlotte, Jacksonville
- **Midwest**: Chicago, Detroit, Cleveland, Minneapolis
- **Southwest**: Houston, Dallas, Austin, San Antonio, Phoenix
- **West**: Los Angeles, San Francisco, Seattle, Portland, Denver
- **Special Cases**: Anchorage (AK), Honolulu (HI)

### Edge Cases Tested
- Border cities (San Diego, Seattle, Detroit, El Paso)
- Remote locations (rural Montana, Nevada, Wyoming)
- Mountain regions (Denver, Salt Lake City, Albuquerque)
- Desert areas (Phoenix, Las Vegas, Tucson)
- Coastal extremes (Key West, Bangor, Bellingham)

## 🔧 Continuous Integration

### GitHub Actions Workflow
- **Triggers**: Push to main/develop, PRs, daily schedule
- **Test Matrix**: Multiple Node.js versions, OS variants
- **Browser Testing**: Chrome, Firefox, Safari (including mobile)
- **Security Scanning**: Dependency audit, secret detection
- **Performance Monitoring**: Regression detection

### Test Execution Strategy
1. **Unit Tests** (Fast feedback)
2. **Geographic Coverage** (Comprehensive city testing)
3. **API Integration** (External service validation)
4. **End-to-End** (User experience verification)
5. **Performance** (Benchmark validation)
6. **Regression** (Backward compatibility)

## 🛡️ Error Handling & Resilience

### Network Conditions Tested
- ✅ Normal connectivity
- ⚠️ Slow network (2G simulation)
- ❌ Network failures
- 🔄 Intermittent connectivity
- ⏱️ Request timeouts
- 🚫 API rate limiting

### API Error Scenarios
- **Ticketmaster API**: 429 rate limits, 500 server errors, malformed responses
- **Supabase Functions**: Connection failures, timeout handling
- **Geographic Edge Cases**: Invalid coordinates, extreme locations

## 📈 Performance Benchmarks

### Acceptable Performance Thresholds
- **City Detection**: <10ms average per lookup
- **API Response**: <2000ms for event fetching
- **Database Operations**: <500ms for CRUD operations
- **UI Interactions**: <100ms for user actions
- **Memory Usage**: <50MB heap growth during tests

### Load Testing Scenarios
- **Concurrent Users**: 10+ simultaneous requests
- **Bulk Operations**: 1000+ city detections
- **Extended Sessions**: Long-running performance monitoring
- **Memory Leak Detection**: Repeated operation cycles

## 🔄 Development Workflow

### Pre-commit Testing
```bash
# Run quick validation
npm run test -- --run --reporter=basic

# Validate specific functionality
npm run test -- tests/unit/cityDetection.test.ts
```

### Pre-deployment Testing
```bash
# Full test suite
./scripts/run-comprehensive-tests.sh

# Performance validation
npm run test -- tests/performance/ --reporter=verbose
```

### Production Monitoring
- Set up alerts for API response times
- Monitor city detection accuracy metrics
- Track error rates and failure patterns
- Schedule daily comprehensive test runs

## 🎨 Customization & Extension

### Adding New Cities
1. Update `src/utils/cityDetection.ts` - Add city to `EXPANDED_US_CITIES`
2. Update `tests/geographic/cityCoverage.test.ts` - Add to test coordinates
3. Update `src/config/ticketmasterMarkets.ts` - Add market mapping if available
4. Run geographic coverage tests to validate

### Adding New Test Scenarios
1. Create test file in appropriate directory (`tests/unit/`, `tests/integration/`, etc.)
2. Follow existing patterns for setup, mocking, and assertions
3. Add to CI/CD workflow if needed
4. Update comprehensive test script

### Mock Data Management
- **API Responses**: `tests/mocks/handlers.ts`
- **Test Data**: Individual test files
- **Environment Setup**: `tests/setup.ts`

## 🚨 Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check environment variables are set in GitHub secrets
- Verify Node.js version compatibility
- Review browser/OS specific issues

**Performance tests failing:**
- Check system resources during test execution
- Verify no other processes are consuming CPU/memory
- Consider adjusting performance thresholds for CI environment

**E2E tests timing out:**
- Increase timeouts in `playwright.config.ts`
- Check if development server is starting properly
- Verify network connectivity to external APIs

**Geographic tests failing:**
- Validate city coordinate data hasn't changed
- Check if new cities have been added without test updates
- Verify distance calculations are using correct formula

### Debug Commands
```bash
# Debug with verbose output
npm run test -- --reporter=verbose

# Debug specific test file
npm run test -- tests/unit/cityDetection.test.ts --reporter=verbose

# Debug E2E with browser UI
npm run test:e2e:ui

# Run single E2E test
npx playwright test eventsFunctionality --debug
```

## 📚 Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Testing Guide](https://playwright.dev/)
- [MSW API Mocking](https://mswjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

## 🤝 Contributing

When adding new functionality to the events system:

1. **Write tests first** (TDD approach)
2. **Update geographic coverage** if adding new cities
3. **Add performance benchmarks** for new algorithms
4. **Test backward compatibility** to prevent regressions
5. **Update documentation** and examples

## 📞 Support

For questions about the testing framework:
1. Check existing test files for examples
2. Review error messages and logs
3. Run validation script: `node scripts/validate-test-setup.js`
4. Use debug commands to isolate issues

---

**🎉 The testing framework ensures robust, reliable Ticketmaster events functionality across ALL major US cities with comprehensive coverage, performance monitoring, and regression prevention.**