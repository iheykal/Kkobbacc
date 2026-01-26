'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface PropertyMediaPlayerProps {
    url: string;
    thumbnail?: string;
    className?: string;
    autoPlay?: boolean;
    aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape' | number;
    objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
}

export default function PropertyMediaPlayer({
    url,
    thumbnail,
    className = '',
    autoPlay = false,
    aspectRatio = 'auto',
    objectFit = 'cover'
}: PropertyMediaPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
                setVideoAspectRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
            }
        }
    };

    // Get aspect ratio style
    const getAspectRatioStyle = () => {
        if (aspectRatio === 'auto') {
            return videoAspectRatio ? { aspectRatio: videoAspectRatio.toString() } : { aspectRatio: '16/9' }; // Default to 16:9 until loaded
        } else if (typeof aspectRatio === 'number') {
            return { aspectRatio: aspectRatio.toString() };
        } else {
            const ratios = {
                square: '1/1',
                video: '16/9',
                portrait: '3/4',
                landscape: '4/3'
            };
            return { aspectRatio: ratios[aspectRatio] };
        }
    };

    // Get object fit class
    const getObjectFitClass = () => {
        const fitClasses = {
            contain: 'object-contain',
            cover: 'object-cover',
            fill: 'object-fill',
            'scale-down': 'object-scale-down'
        };
        return fitClasses[objectFit];
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * duration;
            videoRef.current.currentTime = newTime;
            setProgress(percentage * 100);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`relative group bg-black rounded-lg overflow-hidden ${className}`}
            style={getAspectRatioStyle()}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={url}
                poster={thumbnail}
                className={`w-full h-full ${getObjectFitClass()}`}
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                    console.error("Video Playback Error:", e);
                    // Force controls to show so user can see something is wrong is needed, 
                    // but better to have a dedicated error state overlay
                    const videoEl = e.target as HTMLVideoElement;
                    console.error("Video Error Details:", {
                        error: videoEl.error,
                        networkState: videoEl.networkState,
                        currentSrc: videoEl.currentSrc
                    });
                }}
                playsInline
                preload="metadata"
                controls={false}
            />

            {/* Error Overlay - Fallback if video fails */}
            {(!duration && !isPlaying) && (
                /* Transparent overlay for click detection over empty video */
                <div className="absolute inset-0" onClick={togglePlay} />
            )}

            {/* Play Overlay (when paused) */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all">
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                    </div>
                </div>
            )}

            {/* Video Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 rounded-b-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {/* Progress Bar */}
                <div
                    className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer group/progress"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-white rounded-full relative transition-all"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="hover:scale-110 transition-transform"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </button>

                        {/* Mute Button */}
                        <button
                            onClick={toggleMute}
                            className="hover:scale-110 transition-transform"
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>

                        {/* Time Display */}
                        <span className="text-sm font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="hover:scale-110 transition-transform"
                        aria-label="Fullscreen"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
