#!/usr/bin/env node

/**
 * Quick validation script to test the Ticketmaster events testing setup
 * This script verifies that the testing infrastructure is properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Ticketmaster Events Testing Setup\n');

const projectRoot = path.join(__dirname, '..');
const results = [];

// Test files to validate
const testFiles = [
  'tests/setup.ts',
  'tests/mocks/handlers.ts',
  'tests/unit/cityDetection.test.ts',
  'tests/unit/enhancedEventService.test.ts', 
  'tests/geographic/cityCoverage.test.ts',
  'tests/integration/apiIntegration.test.ts',
  'tests/e2e/eventsFunctionality.spec.ts',
  'tests/regression/backwardCompatibility.test.ts',
  'tests/performance/benchmarks.test.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  '.github/workflows/events-testing.yml',
  'scripts/run-comprehensive-tests.sh'
];

// Configuration files to check
const configFiles = [
  'package.json',
  'vitest.config.ts',
  'playwright.config.ts'
];

function validateFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  
  results.push({
    file: filePath,
    description,
    exists,
    size: exists ? fs.statSync(fullPath).size : 0
  });
  
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  
  if (!exists) {
    console.log(`   File not found at: ${fullPath}`);
  } else {
    const size = Math.round(fs.statSync(fullPath).size / 1024);
    console.log(`   File size: ${size}KB`);
  }
  
  return exists;
}

function validatePackageJson() {
  console.log('\n📦 Validating package.json dependencies...');
  
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDevDeps = [
      'vitest',
      '@vitest/ui', 
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jsdom',
      'playwright',
      '@playwright/test',
      'msw'
    ];
    
    const requiredScripts = [
      'test',
      'test:ui',
      'test:coverage',
      'test:e2e',
      'test:e2e:ui',
      'test:events',
      'test:cities',
      'test:integration',
      'test:all'
    ];
    
    let missingDeps = 0;
    let missingScripts = 0;
    
    requiredDevDeps.forEach(dep => {
      const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
      console.log(`${exists ? '✅' : '❌'} Dev dependency: ${dep}`);
      if (!exists) missingDeps++;
    });
    
    requiredScripts.forEach(script => {
      const exists = packageJson.scripts && packageJson.scripts[script];
      console.log(`${exists ? '✅' : '❌'} NPM script: ${script}`);
      if (!exists) missingScripts++;
    });
    
    return { missingDeps, missingScripts };
    
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return { missingDeps: -1, missingScripts: -1 };
  }
}

function validateSourceFiles() {
  console.log('\n🏗️ Validating source files...');
  
  const sourceFiles = [
    'src/utils/cityDetection.ts',
    'src/services/enhancedEventService.ts',
    'src/config/ticketmasterMarkets.ts',
    'supabase/functions/fetch-events/index.ts',
    'supabase/functions/fetch-events-realtime/index.ts'
  ];
  
  let existingFiles = 0;
  
  sourceFiles.forEach(file => {
    if (validateFile(file, `Source file`)) {
      existingFiles++;
    }
  });
  
  return existingFiles;
}

function generateReport() {
  console.log('\n📊 VALIDATION REPORT');
  console.log('='.repeat(50));
  
  const testFilesExist = results.filter(r => r.exists && r.file.startsWith('tests/')).length;
  const totalTestFiles = results.filter(r => r.file.startsWith('tests/')).length;
  
  const configFilesExist = results.filter(r => r.exists && (r.file.endsWith('.config.ts') || r.file === 'package.json')).length;
  const totalConfigFiles = results.filter(r => r.file.endsWith('.config.ts') || r.file === 'package.json').length;
  
  console.log(`\n📋 Test Files: ${testFilesExist}/${totalTestFiles} present`);
  console.log(`⚙️ Config Files: ${configFilesExist}/${totalConfigFiles} present`);
  console.log(`🔧 CI/CD Pipeline: ${results.find(r => r.file.includes('workflows'))?.exists ? 'Configured' : 'Missing'}`);
  console.log(`📜 Test Scripts: ${results.find(r => r.file.includes('run-comprehensive'))?.exists ? 'Available' : 'Missing'}`);
  
  const totalFiles = results.length;
  const existingFiles = results.filter(r => r.exists).length;
  const completionRate = Math.round((existingFiles / totalFiles) * 100);
  
  console.log(`\n🎯 Overall Completion: ${completionRate}% (${existingFiles}/${totalFiles} files)`);
  
  if (completionRate >= 90) {
    console.log('\n🎉 EXCELLENT: Testing setup is nearly complete!');
    return 0;
  } else if (completionRate >= 70) {
    console.log('\n✅ GOOD: Most testing infrastructure is in place.');
    return 0; 
  } else if (completionRate >= 50) {
    console.log('\n⚠️ PARTIAL: Basic testing setup exists, but needs more work.');
    return 1;
  } else {
    console.log('\n❌ INCOMPLETE: Testing setup needs significant work.');
    return 1;
  }
}

// Main validation process
async function main() {
  console.log('Validating test infrastructure files...\n');
  
  // Validate all test files
  testFiles.forEach(file => {
    let description = 'Test file';
    if (file.includes('unit/')) description = 'Unit test';
    else if (file.includes('integration/')) description = 'Integration test';
    else if (file.includes('e2e/')) description = 'E2E test';
    else if (file.includes('geographic/')) description = 'Geographic test';
    else if (file.includes('regression/')) description = 'Regression test';
    else if (file.includes('performance/')) description = 'Performance test';
    else if (file.includes('setup')) description = 'Test setup';
    else if (file.includes('mocks/')) description = 'Mock handlers';
    else if (file.includes('config')) description = 'Test configuration';
    else if (file.includes('workflows/')) description = 'CI/CD pipeline';
    else if (file.includes('scripts/')) description = 'Test script';
    
    validateFile(file, description);
  });
  
  // Validate package.json
  const packageValidation = validatePackageJson();
  
  // Validate source files
  const sourceValidation = validateSourceFiles();
  
  // Generate final report
  const exitCode = generateReport();
  
  console.log('\n💡 Next Steps:');
  if (exitCode === 0) {
    console.log('1. Run: npm ci (install dependencies)');
    console.log('2. Run: npm run test (run unit tests)');
    console.log('3. Run: npm run test:e2e (run E2E tests)');
    console.log('4. Run: ./scripts/run-comprehensive-tests.sh (full test suite)');
  } else {
    console.log('1. Complete the missing test files');
    console.log('2. Add missing package.json dependencies');
    console.log('3. Configure test scripts in package.json');
    console.log('4. Re-run this validation script');
  }
  
  console.log(`\n📄 For detailed test execution, use: ./scripts/run-comprehensive-tests.sh`);
  
  process.exit(exitCode);
}

// Run validation
main().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});