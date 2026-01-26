'use client'

import { useEffect, useState } from 'react'

export function StructuredData() {
  const [baseUrl, setBaseUrl] = useState('https://kobac.net')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kobac Property",
    "url": baseUrl,
    "logo": `${baseUrl}/icons/newlogo.png`,
    "description": "Somalia's #1 Property Platform - Premium properties in Mogadishu. Buy, rent, or list properties with trusted agents.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+252-61-0251014",
      "contactType": "Customer Service",
      "areaServed": "SO",
      "availableLanguage": ["en", "so"]
    },
    "sameAs": []
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",

    "url": baseUrl,
    "description": "Somalia's #1 Property Platform - Premium properties in Mogadishu",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/properties?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "Main Navigation",
    "url": baseUrl,
    "hasPart": [
      {
        "@type": "SiteNavigationElement",
        "name": "Properties",
        "url": `${baseUrl}/properties`,
        "description": "Browse all properties for sale and rent in Mogadishu"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Agents",
        "url": `${baseUrl}/agents`,
        "description": "Find trusted property agents in Mogadishu"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "About",
        "url": `${baseUrl}/about`,
        "description": "Learn about Kobac Property and our mission"
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(navigationSchema)
        }}
      />
    </>
  )
}

