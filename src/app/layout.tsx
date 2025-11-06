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
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '600'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'Kobac Real Estate - Premium Real Estate',
  description: 'Discover luxury properties in the most prestigious locations worldwide. Experience premium real estate with Kobac Real Estate.',
  keywords: 'luxury real estate, premium properties, luxury homes, real estate, kobac real estate',
  authors: [{ name: 'Kobac Real Estate' }],
  manifest: '/manifest.json',
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
