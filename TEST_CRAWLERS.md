# How to Test if Crawlers Work Properly

## 🧪 Testing Guide for SEO Crawlers

This guide shows you how to verify that search engines and social media crawlers can properly access and understand your website.

---

## 1. ✅ Test robots.txt

### Method 1: Direct Access
Open in browser:
```
https://your-domain.com/robots.txt
```

**Expected result:**
```
User-agent: *
Allow: /

# Disallow admin and debug pages from crawlers
Disallow: /admin/
Disallow: /api/
...

Sitemap: https://your-domain.com/sitemap.xml
```

### Method 2: Google Search Console Test
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Click "Settings" → "robots.txt Tester"
4. Enter: `robots.txt`
5. Click "Test" button

**Expected:** ✅ Valid

---

## 2. ✅ Test sitemap.xml

### Method 1: Direct Access
Open in browser:
```
https://your-domain.com/sitemap.xml
```

**Expected result:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/properties</loc>
    ...
  </url>
  <url>
    <loc>https://your-domain.com/apartment-kiro-ah/muqdisho/degmada-abdiaziz/203</loc>
    ...
  </url>
  <!-- More property URLs -->
</urlset>
```

### Method 2: Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Click "Sitemaps" in left menu
4. Enter: `sitemap.xml`
5. Click "Submit"

**Expected:** ✅ Success

### Method 3: Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your sitemap URL
3. Submit for indexing

---

## 3. ✅ Test Page Metadata

### Method 1: View Page Source
1. Visit your homepage
2. Right-click → "View Page Source"
3. Look for these tags in `<head>`:

**Check for:**
```html
<!-- Title -->
<title>Kobac Real Estate - Premium Properties in Mogadishu</title>

<!-- Meta Description -->
<meta name="description" content="Discover luxury villas..." />

<!-- Keywords -->
<meta name="keywords" content="real estate, mogadishu..." />

<!-- Open Graph (Facebook) -->
<meta property="og:title" content="Kobac Real Estate..." />
<meta property="og:description" content="Discover luxury villas..." />
<meta property="og:url" content="https://..." />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
```

**Expected:** ✅ All tags present

### Method 2: Social Media Validators

#### Facebook Sharing Debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://your-domain.com`
3. Click "Debug"
4. See preview

**Expected:** ✅ Shows image, title, description

#### Twitter Card Validator:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. See preview

**Expected:** ✅ Shows Twitter card preview

#### LinkedIn Post Inspector:
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. See preview

**Expected:** ✅ Shows LinkedIn preview

---

## 4. ✅ Test Google Bot

### Method 1: Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "URL Inspection" tool
3. Enter any property URL
4. Click "Test Live URL"
5. Click "Request Indexing"

**Expected:** 
- ✅ "URL is on Google"
- ✅ Preview shows metadata correctly

### Method 2: Google Rich Results Test
1. Go to: https://search.google.com/test/rich-results
2. Enter your URL
3. Click "Test URL"

**Expected:** 
- ✅ No errors
- ✅ Shows structured data
- ✅ Shows rich results preview

---

## 5. ✅ Test Structured Data (JSON-LD)

### Method 1: Google Rich Results Test
Use the same tool above and check "Schema.org Validation"

**Expected:**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Property Title",
  "description": "...",
  "offers": {
    "@type": "Offer",
    "price": 500000,
    "priceCurrency": "USD"
  }
}
```

### Method 2: Schema Markup Validator
1. Go to: https://validator.schema.org/
2. Enter your URL
3. View structured data

**Expected:** ✅ No errors

---

## 6. ✅ Test Image Alt Text

### Method 1: Browser Developer Tools
1. Visit your property pages
2. Right-click any image → "Inspect"
3. Look for `alt="..."` attribute

**Expected:**
```html
<img src="..." alt="Beautiful apartment in Abdiaziz district" />
```

### Method 2: Web Accessibility Checker
1. Go to: https://wave.webaim.org/
2. Enter your URL
3. Check "Alt Text" section

**Expected:** ✅ All images have alt text

---

## 7. ✅ Test Canonical URLs

### Method 1: View Page Source
Open property page and search for:
```html
<link rel="canonical" href="https://your-domain.com/apartment-..." />
```

**Expected:** ✅ Present on all pages

### Method 2: Browser Console
Open browser console (F12) and run:
```javascript
document.querySelector('link[rel="canonical"]')
```

**Expected:** ✅ Returns the link element

---

## 8. ✅ Test Mobile Optimization

### Method 1: Google Mobile-Friendly Test
1. Go to: https://search.google.com/test/mobile-friendly
2. Enter your URL
3. Click "Test URL"

**Expected:** ✅ "Page is mobile-friendly"

### Method 2: Browser DevTools
1. Open DevTools (F12)
2. Click "Toggle device toolbar"
3. Test different screen sizes

**Expected:** ✅ Site looks good on all devices

---

## 9. ✅ Test Page Speed

### Method 1: Google PageSpeed Insights
1. Go to: https://pagespeed.web.dev/
2. Enter your URL
3. Run test

**Expected:** 
- ✅ Score > 80 (Desktop)
- ✅ Score > 60 (Mobile)

### Method 2: GTmetrix
1. Go to: https://gtmetrix.com/
2. Enter your URL
3. Analyze

**Expected:** ✅ Good performance grade

---

## 10. ✅ Test Real Crawler Access

### Use curl (Command Line)
```bash
# Test robots.txt
curl https://your-domain.com/robots.txt

# Test sitemap
curl https://your-domain.com/sitemap.xml

# Test property page
curl https://your-domain.com/apartment-kiro-ah/muqdisho/degmada-abdiaziz/203

# Check if crawler can access (test with Google Bot user agent)
curl -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://your-domain.com/
```

**Expected:** All return valid content

---

## 11. ✅ Monitor Indexing Status

### Google Search Console
1. Go to "Coverage" report
2. Check:
   - ✅ Valid pages
   - ⚠️ Excluded pages (should only be admin/test)
   - ❌ Errors (should be 0)

### Google Search Results
Search on Google:
```
site:your-domain.com
```

**Expected:** Shows your indexed pages

---

## 12. ✅ Test Crawl Budget

### Method 1: Google Search Console
1. Go to "Crawl Stats"
2. Check:
   - Pages crawled per day
   - Average response time
   - DNS and download times

**Expected:**
- ✅ Fast response times
- ✅ High number of pages crawled
- ✅ No 404s or 5xx errors

---

## 🎯 Quick Checklist

Run these tests to verify everything works:

- [ ] robots.txt accessible at `/robots.txt`
- [ ] sitemap.xml accessible at `/sitemap.xml`
- [ ] Homepage has complete metadata
- [ ] Properties page has complete metadata
- [ ] Property pages have structured data
- [ ] Open Graph preview works on Facebook Debugger
- [ ] Twitter Card preview works on Twitter Validator
- [ ] Images have alt text
- [ ] Canonical URLs present
- [ ] Mobile-friendly test passes
- [ ] PageSpeed score > 70
- [ ] No crawl errors in Search Console
- [ ] Pages indexed in Google (site:your-domain.com)

---

## 🐛 Common Issues & Fixes

### Issue 1: sitemap.xml returns 404
**Fix:** Check if file exists in `src/app/sitemap.ts`

### Issue 2: robots.txt blocked
**Fix:** Make sure file is in `public/robots.txt`

### Issue 3: Metadata not showing
**Fix:** Refresh page cache, hard reload (Ctrl+F5)

### Issue 4: Social previews broken
**Fix:** Use Facebook Debugger to clear cache

### Issue 5: Structured data errors
**Fix:** Check JSON syntax in property pages

---

## 📊 Test Results Template

```
Website: _________________________________
Date Tested: _____________________________

✅ robots.txt: Pass / Fail
✅ sitemap.xml: Pass / Fail
✅ Homepage Metadata: Pass / Fail
✅ Properties Metadata: Pass / Fail
✅ Open Graph: Pass / Fail
✅ Twitter Cards: Pass / Fail
✅ Structured Data: Pass / Fail
✅ Alt Text: Pass / Fail
✅ Canonical URLs: Pass / Fail
✅ Mobile-Friendly: Pass / Fail
✅ PageSpeed: ___/100
✅ Indexed Pages: ____

Notes:
_________________________________________
_________________________________________
```

---

## 🎉 Success Criteria

Your website is crawler-ready when:
- ✅ All critical tests pass
- ✅ No 404 errors in robots.txt/sitemap
- ✅ Metadata appears correctly
- ✅ Social previews work
- ✅ Google can index pages
- ✅ Structured data validates
- ✅ Mobile-friendly
- ✅ Fast page speeds

**If all tests pass, your site is ready for search engines! 🚀**




