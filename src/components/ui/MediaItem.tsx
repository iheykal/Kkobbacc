'use client';

import React from 'react';
import { FlexibleImage } from './FlexibleImage';
import PropertyMediaPlayer from './PropertyMediaPlayer';

interface MediaItemProps {
    src: string;
    alt: string;
    className?: string;
    containerClassName?: string;
    aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape' | number;
    objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
    enableZoom?: boolean;
    showLoadingState?: boolean;
    watermark?: {
        src: string;
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        size?: 'small' | 'medium' | 'large';
        opacity?: number;
    };
    loading?: 'lazy' | 'eager';
    priority?: boolean;
    fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Helper function to detect if a URL points to a video file
 */
function isVideoFile(url: string): boolean {
    if (!url) return false;

    // Decode URL if it's encoded
    const decodedUrl = decodeURIComponent(url);

    // Common video file extensions
    const videoExtensions = [
        '.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp',
        '.ogv', '.ogg', '.mpeg', '.mpg', '.qt', '.m3u8', '.ts'
    ];

    return videoExtensions.some(ext => decodedUrl.toLowerCase().endsWith(ext));
}

/**
 * MediaItem - Universal component that renders either image or video based on file extension
 * Automatically detects media type and uses appropriate renderer
 */
export const MediaItem: React.FC<MediaItemProps> = ({
    src,
    alt,
    className = '',
    containerClassName = '',
    aspectRatio = 'auto',
    objectFit = 'contain',
    enableZoom = false,
    showLoadingState = true,
    watermark,
    loading = 'lazy',
    priority = false,
    fetchPriority
}) => {
    const isVideo = isVideoFile(src);

    console.log('🎬 MediaItem rendering:', { src, isVideo, decodedSrc: decodeURIComponent(src) });

    if (isVideo) {
        // Extract actual video URL from proxy if present
        let videoUrl = src;

        // Debug initial URL
        console.log('📼 Raw video source:', src);

        if (src.includes('/api/image-proxy')) {
            try {
                // Handle both ?url= and &url=
                const urlMatch = src.match(/[?&]url=([^&]+)/);
                if (urlMatch && urlMatch[1]) {
                    // Double decode to be safe (Next.js sometimes double encodes)
                    videoUrl = decodeURIComponent(decodeURIComponent(urlMatch[1]));
                    console.log('🔓 Extracted video URL from proxy:', videoUrl);
                }
            } catch (e) {
                console.error('Failed to extract video URL from proxy:', e);
            }
        }

        return (
            <div className={containerClassName}>
                <PropertyMediaPlayer
                    url={videoUrl}
                    className={className}
                    aspectRatio={aspectRatio}
                    objectFit={objectFit}
                />
            </div>
        );
    }

    // Render image using FlexibleImage
    return (
        <FlexibleImage
            src={src}
            alt={alt}
            className={className}
            containerClassName={containerClassName}
            aspectRatio={aspectRatio}
            objectFit={objectFit}
            enableZoom={enableZoom}
            showLoadingState={showLoadingState}
            watermark={watermark}
            loading={loading}
            priority={priority}
            fetchPriority={fetchPriority}
        />
    );
};

export default MediaItem;
