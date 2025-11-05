# Scroll Preservation Test Guide

## 🎯 Overview

This guide provides manual testing steps to verify that the scroll preservation functionality is working correctly across different navigation patterns.

## 🧪 Manual Test Scenarios

### Test 1: Main Page Scroll Preservation

**Objective**: Verify that scroll position is preserved when opening and closing property modals on the main page.

**Steps**:
1. Navigate to the main page (`/`)
2. Scroll down to approximately 2000px
3. Click on any property card to open the modal
4. Verify the modal opens with smooth animation
5. Click the close button (X) or click outside the modal
6. Verify the modal closes and scroll position is restored to ~2000px

**Expected Result**: ✅ Scroll position should be preserved within ±50px

### Test 2: Properties Page Scroll Preservation

**Objective**: Verify that scroll position is preserved when opening and closing property modals on the properties page.

**Steps**:
1. Navigate to the properties page (`/properties`)
2. Scroll down to approximately 1500px
3. Click on any property card to open the modal
4. Verify the modal opens with smooth animation
5. Click the close button (X) or click outside the modal
6. Verify the modal closes and scroll position is restored to ~1500px

**Expected Result**: ✅ Scroll position should be preserved within ±50px

### Test 3: Data Caching Verification

**Objective**: Verify that property data is cached to prevent unnecessary refetching.

**Steps**:
1. Open browser developer tools (F12)
2. Go to Application tab → Storage → Session Storage
3. Navigate to `/properties`
4. Wait for properties to load
5. Check if cache keys starting with `cache_properties_` are created
6. Close and reopen the properties page
7. Verify that properties load instantly (from cache)

**Expected Result**: ✅ Cache keys should be present and properties should load instantly

### Test 4: Modal vs Page Navigation

**Objective**: Verify that modals keep the list mounted instead of navigating to a new page.

**Steps**:
1. Navigate to `/properties`
2. Note the current URL
3. Click on a property to open modal
4. Verify the URL changes to `/properties?id=PROPERTY_ID`
5. Verify the properties list is still visible behind the modal
6. Close the modal
7. Verify the URL returns to `/properties`

**Expected Result**: ✅ List should remain mounted, URL should use query params

### Test 5: Cross-Page Navigation

**Objective**: Verify scroll preservation when navigating between different pages.

**Steps**:
1. Start on main page (`/`)
2. Scroll to 2000px
3. Navigate to `/properties`
4. Scroll to 1500px
5. Use browser back button
6. Verify you return to main page at 2000px scroll position

**Expected Result**: ✅ Scroll positions should be preserved across page navigation

## 🔧 Automated Testing

### Running the Test Suite

```bash
# Install puppeteer if not already installed
npm install puppeteer --save-dev

# Run the automated test suite
node test-scroll-preservation.js
```

### Test Results Interpretation

- ✅ **PASS**: Test completed successfully
- ❌ **FAIL**: Test failed but completed execution
- ⚠️ **ERROR**: Test encountered an error during execution

## 🐛 Common Issues and Solutions

### Issue: Scroll position not preserved
**Symptoms**: After closing modal, page scrolls to top
**Solution**: Check that `sessionStorage.setItem('home_scroll_y', ...)` is being called

### Issue: Modal doesn't open
**Symptoms**: Clicking property card doesn't show modal
**Solution**: Verify `setSelectedProperty(property)` is being called in click handler

### Issue: Data not cached
**Symptoms**: Properties refetch on every page load
**Solution**: Check that cache keys are being set in `useProperties` hook

### Issue: List unmounts when opening modal
**Symptoms**: Properties list disappears when modal opens
**Solution**: Verify modal is using overlay approach, not page navigation

## 📊 Performance Metrics

### Expected Performance Improvements

- **Scroll Restoration**: < 100ms
- **Modal Open/Close**: < 300ms
- **Data Loading from Cache**: < 50ms
- **Page Navigation**: < 200ms

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎉 Success Criteria

The scroll preservation implementation is successful when:

1. ✅ Scroll positions are preserved within ±50px accuracy
2. ✅ Modals open/close smoothly without page refreshes
3. ✅ Property data is cached and loads instantly
4. ✅ Lists remain mounted when modals are open
5. ✅ Cross-page navigation preserves scroll positions
6. ✅ No console errors during navigation
7. ✅ Smooth animations and transitions

## 🔍 Debugging Tips

### Enable Debug Logging

Add this to your browser console to see debug information:

```javascript
// Enable debug logging
localStorage.setItem('debug_scroll_preservation', 'true');

// Check current scroll position
console.log('Current scroll Y:', window.scrollY);

// Check session storage
console.log('Session storage:', Object.keys(sessionStorage));

// Check cached data
console.log('Cached properties:', sessionStorage.getItem('cache_properties_all_{}'));
```

### Browser DevTools

1. **Network Tab**: Verify no unnecessary API calls
2. **Console Tab**: Check for JavaScript errors
3. **Application Tab**: Monitor session storage changes
4. **Performance Tab**: Measure scroll restoration timing

## 📝 Test Checklist

- [ ] Main page scroll preservation works
- [ ] Properties page scroll preservation works
- [ ] Data caching is functional
- [ ] Modal navigation keeps list mounted
- [ ] Cross-page navigation preserves scroll
- [ ] No console errors
- [ ] Smooth animations
- [ ] Mobile responsiveness
- [ ] Browser compatibility
- [ ] Performance metrics met

