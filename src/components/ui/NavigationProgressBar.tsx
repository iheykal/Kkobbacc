'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Reset progress when path changes (navigation complete)
        setIsNavigating(false)
        setProgress(100)

        const timer = setTimeout(() => {
            setProgress(0)
        }, 500) // Fade out duration

        return () => clearTimeout(timer)
    }, [pathname, searchParams])

    useEffect(() => {
        // Listen for link clicks to trigger loading state
        // This is a workaround since Next.js App Router doesn't provide global router events like Pages Router
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.target) {
                // Check if it's actually a navigation to a new place
                const targetUrl = new URL(anchor.href);
                if (targetUrl.pathname !== window.location.pathname || targetUrl.search !== window.location.search) {
                    startNavigation();
                }
            }
        };

        const startNavigation = () => {
            setIsNavigating(true);
            setProgress(30); // Immediate feedback

            // Trickle progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + Math.random() * 10;
                });
            }, 300);

            // Cleanup interval on unmount or completion is handled by state
        };

        // Listen for custom navigation event (for router.push calls)
        const handleCustomNav = () => {
            startNavigation();
        };

        document.addEventListener('click', handleClick);
        window.addEventListener('kobac:navigation-start', handleCustomNav);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('kobac:navigation-start', handleCustomNav);
        };
    }, []);

    if (!isNavigating && progress === 0) return null

    return (
        <div
            className="fixed top-0 left-0 w-full h-1 z-[9999] pointer-events-none"
            style={{ opacity: isNavigating || progress > 0 ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            <div
                className="h-full bg-blue-600 shadow-[0_0_10px_#2563eb,0_0_5px_#2563eb]"
                style={{
                    width: `${progress}%`,
                    transition: 'width 0.2s ease-in-out'
                }}
            />
        </div>
    )
}
