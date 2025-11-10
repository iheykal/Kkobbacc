# 🧪 Quick Crawler Test Guide

## 🚀 3 Fastest Ways to Test

### 1️⃣ **Easiest: Open These URLs**

Just visit in your browser:

```
https://your-domain.com/robots.txt
https://your-domain.com/sitemap.xml
```

✅ **If you see content** = Working!

---

### 2️⃣ **Visual Test: Use the HTML Tool**

1. Open `test-crawlers.html` in your browser
2. Enter your URL
3. Click "Run All Tests"
4. See results instantly!

---

### 3️⃣ **Professional: Google Search Console**

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your site
3. Use "URL Inspection" tool
4. Request indexing

---

## ✅ What to Check

| Test | URL | Expected Result |
|------|-----|----------------|
| **robots.txt** | `/robots.txt` | ✅ Shows "User-agent: *" |
| **sitemap.xml** | `/sitemap.xml` | ✅ Shows XML with URLs |
| **Metadata** | `/` (homepage) | ✅ View source, see `<title>` and `<meta>` |
| **Facebook** | [facebook.com/debug](https://developers.facebook.com/tools/debug/) | ✅ Shows preview |
| **Twitter** | [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) | ✅ Shows card |

---

## 📊 Quick Checklist

- [ ] robots.txt loads
- [ ] sitemap.xml loads  
- [ ] Has property URLs in sitemap
- [ ] Homepage has title
- [ ] Homepage has description
- [ ] Facebook Debugger works
- [ ] No 404 errors
- [ ] Mobile-friendly (test at pagespeed.web.dev)

**If all ✅ = Ready for crawlers!**

---

## 🎯 Need More Help?

See `TEST_CRAWLERS.md` for detailed instructions.









