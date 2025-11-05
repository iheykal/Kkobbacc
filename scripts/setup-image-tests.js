#!/usr/bin/env node

/**
 * Setup Script for Image Upload Tests
 * 
 * This script sets up the environment and dependencies needed for testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Image Upload Tests...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Install required dependencies for testing
console.log('📦 Installing test dependencies...');
try {
  execSync('npm install form-data node-fetch', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create test images directory
const testImagesDir = path.join(__dirname, 'test-images');
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
  console.log('📁 Created test-images directory');
}

// Create environment template
const envTemplate = `# Image Upload Test Environment Variables
# Copy these to your .env.local file

# API Base URL (usually http://localhost:3000 for development)
API_BASE=http://localhost:3000

# Test Property ID (use an existing property ID)
TEST_PROPERTY_ID=1

# R2 Configuration (should already be set)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE_URL=https://pub-your-account-id.r2.dev
`;

const envFile = path.join(__dirname, '.env.test');
if (!fs.existsSync(envFile)) {
  fs.writeFileSync(envFile, envTemplate);
  console.log('📄 Created .env.test template');
}

// Make test scripts executable
const scripts = [
  'scripts/real-image-upload-test.js',
  'scripts/test-image-persistence.js',
  'scripts/test-image-fixes.js'
];

scripts.forEach(script => {
  if (fs.existsSync(script)) {
    try {
      fs.chmodSync(script, '755');
      console.log(`🔧 Made ${script} executable`);
    } catch (error) {
      console.log(`⚠️ Could not make ${script} executable: ${error.message}`);
    }
  }
});

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Copy .env.test to .env.local and update with your values');
console.log('2. Start your development server: npm run dev');
console.log('3. Run the test: node scripts/real-image-upload-test.js');
console.log('4. Or open test-image-upload.html in your browser for manual testing');
console.log('\n🔧 Available test commands:');
console.log('- node scripts/real-image-upload-test.js (comprehensive test)');
console.log('- node scripts/test-image-persistence.js (persistence test)');
console.log('- node scripts/test-image-fixes.js (fixes test)');
console.log('- Open test-image-upload.html (manual testing)');




