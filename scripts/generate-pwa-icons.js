/**
 * PWA Icon Generator Script
 * 
 * This script helps generate PWA icons from an existing logo.
 * 
 * Requirements:
 * - sharp package (npm install sharp --save-dev)
 * - A source logo image (kobac.png or kobac.webp) in public/icons/
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp package not found.');
  console.log('📦 Please install sharp: npm install sharp --save-dev');
  process.exit(1);
}

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Source logo paths (try these in order)
const sourcePaths = [
  path.join(__dirname, '../public/icons/kobac.png'),
  path.join(__dirname, '../public/icons/kobac.webp'),
  path.join(__dirname, '../public/icons/kobac.jpg'),
];

// Find source logo
let sourceLogo = null;
for (const sourcePath of sourcePaths) {
  if (fs.existsSync(sourcePath)) {
    sourceLogo = sourcePath;
    console.log(`✅ Found source logo: ${sourceLogo}`);
    break;
  }
}

if (!sourceLogo) {
  console.error('❌ No source logo found!');
  console.log('📝 Please place your logo (kobac.png, kobac.webp, or kobac.jpg) in public/icons/');
  console.log('📝 Or update the sourcePaths in this script to point to your logo.');
  process.exit(1);
}

// Output directory
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  try {
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n🎉 All PWA icons generated successfully!');
    console.log('📁 Icons are saved in: public/icons/');
    console.log('\n📝 Next steps:');
    console.log('1. Build your app: npm run build');
    console.log('2. Test PWA installation on mobile devices');
    console.log('3. Check DevTools > Application > Manifest for PWA status');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateIcons();


