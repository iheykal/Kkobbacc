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
  title: 'Kobac Real Estate - Premium Real Estate',
  description: 'Discover luxury properties in the most prestigious locations worldwide. Experience premium real estate with Kobac Real Estate.',
  keywords: 'luxury real estate, premium properties, luxury homes, real estate, kobac real estate',
  authors: [{ name: 'Kobac Real Estate' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/kobac.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '256x256', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/kobac.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/icons/kobac.png',
    apple: '/icons/icon-192x192.png',
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
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/icons/kobac.png" sizes="16x16" type="image/png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="384x384" href="/icons/kobac.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/kobac.png" />
        <link rel="icon" sizes="any" href="/icons/kobac.png" />
        <link rel="shortcut icon" href="/icons/kobac.png" />
        
        {/* Only preload GA if ID is provided and not in development */}
        {gaId && process.env.NODE_ENV === 'production' && (
          <link
            rel="preload"
            href={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            as="script"
          />
        )}
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
