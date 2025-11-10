import type { Metadata } from 'next'
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { UserProvider } from '@/contexts/UserContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { ScrollToTopProvider } from '@/components/providers/ScrollToTopProvider'
import { ScrollPreservationProvider } from '@/components/providers/ScrollPreservationProvider'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { ClientLayoutWrapper } from '@/components/providers/ClientLayoutWrapper'
import GoogleAnalyticsComponent from '@/components/analytics/GoogleAnalytics'
import { StructuredData } from '@/components/seo/StructuredData'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '600'],
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'Kobac Real Estate: Homepage',
  description: "Somalia's #1 Real Estate Platform. Browse premium properties for sale and rent in Mogadishu. Find villas, apartments, and houses with trusted agents.",
  keywords: 'luxury real estate, premium properties, luxury homes, real estate, kobac real estate',
  authors: [{ name: 'Kobac Real Estate' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/header.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/header.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/header.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/header.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/header.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/header.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/header.png', sizes: '256x256', type: 'image/png' },
      { url: '/icons/header.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/header.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/header.png',
    apple: '/icons/header.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kobac Real Estate',
  },
  openGraph: {
    title: 'Kobac Real Estate - Premium Real Estate',
    description: 'Discover luxury properties in the most prestigious locations worldwide.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/icons/header.png',
        width: 512,
        height: 512,
        alt: 'Kobac Real Estate Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Kobac Real Estate - Premium Real Estate',
    description: 'Discover luxury properties in the most prestigious locations worldwide.',
    images: ['/icons/header.png'],
  },
}

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Kobac Real Estate" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kobac Real Estate" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Favicon - Google Search looks for /favicon.ico specifically */}
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="64x64" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="128x128" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="256x256" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="384x384" type="image/png" />
        <link rel="icon" href="/icons/header.png" sizes="512x512" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/header.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/header.png" />
        <link rel="apple-touch-icon" href="/icons/header.png" />
        
        {/* Only preload GA if ID is provided and not in development */}
        {gaId && process.env.NODE_ENV === 'production' && (
          <link
            rel="preload"
            href={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            as="script"
          />
        )}
        
        {/* Structured Data for Google Search Sitelinks */}
        <StructuredData />
      </head>
      <body className="font-sans antialiased bg-white text-primary-900">
        <UserProvider>
          <NavigationProvider>
            <ScrollPreservationProvider>
              <ScrollToTopProvider>
                <ClientLayoutWrapper>
                  <Header />
                  <main>
                    {children}
                  </main>
                  <Footer />
                  <ScrollToTopButton />
                </ClientLayoutWrapper>
              </ScrollToTopProvider>
            </ScrollPreservationProvider>
          </NavigationProvider>
        </UserProvider>
        {gaId && <GoogleAnalyticsComponent gaId={gaId} />}
      </body>
    </html>
  )
}
