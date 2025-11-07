# PWA Setup Guide

## ✅ What's Been Implemented

1. **next-pwa package** - Installed and configured
2. **next.config.js** - Updated with PWA wrapper
3. **manifest.json** - Created in public/ directory
4. **browserconfig.xml** - Created for Windows tile support
5. **layout.tsx** - Updated with PWA metadata and meta tags

## 📋 Next Steps

### 1. Generate PWA Icons

You need to create PWA icons from your existing logo. You have two options:

#### Option A: Use the Icon Generator Script (Recommended)

1. Install sharp (if not already installed):
   ```bash
   npm install sharp --save-dev
   ```

2. Run the icon generator:
   ```bash
   node scripts/generate-pwa-icons.js
   ```

   This will automatically generate all required icon sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512) from your existing `kobac.png` logo.

#### Option B: Use Online Tool

1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your logo (`public/icons/kobac.png`)
3. Generate all icon sizes
4. Download and place them in `public/icons/` with these names:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### 2. Build and Test

1. Build your app:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Test PWA:
   - Open in Chrome/Edge
   - Open DevTools (F12) → Application tab → Service Workers
   - Check for "Install" button in address bar
   - On mobile, you should see "Add to Home Screen" option

### 3. Verify PWA Status

- Open DevTools → Application → Manifest
- Check that all icons are loading correctly
- Verify service worker is registered
- Test offline functionality

## 🎯 PWA Features Enabled

- ✅ **Installable** - Users can install the app on their devices
- ✅ **Offline Support** - Cached pages work offline
- ✅ **App-like Experience** - Standalone display mode
- ✅ **Fast Loading** - Service worker caches assets
- ✅ **Home Screen Icon** - Custom app icon on mobile devices

## 📱 Testing on Mobile

1. Open your website on a mobile device
2. Look for "Add to Home Screen" or "Install App" prompt
3. After installation, the app will open in standalone mode
4. Test offline functionality by turning off WiFi/data

## 🔧 Configuration

PWA is **disabled in development mode** by default. To test PWA features:

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Test in production mode

## 📝 Notes

- Service worker files are auto-generated in `public/` during build
- These files are automatically ignored by git (added to .gitignore)
- Icons must be PNG format for best compatibility
- Manifest.json is already configured with all required fields

## 🐛 Troubleshooting

If PWA doesn't work:

1. **Check icons exist**: Ensure all icon files are in `public/icons/`
2. **Check HTTPS**: PWA requires HTTPS (or localhost for testing)
3. **Clear cache**: Clear browser cache and service workers
4. **Check DevTools**: Look for errors in Console and Application tabs
5. **Verify build**: Make sure you're testing in production mode (`npm run build && npm start`)




