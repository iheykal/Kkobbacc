'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface MediaPreviewProps {
    file: File;
    url: string;
    onRemove: () => void;
    type: 'image' | 'video';
}

export default function MediaPreview({ file, url, onRemove, type }: MediaPreviewProps) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    return (
        <div className="relative group">
            {/* Media Display */}
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {type === 'image' ? (
                    <Image
                        src={url}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <>
                        <video
                            src={url}
                            className="w-full h-full object-cover"
                            muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-gray-800 ml-0.5" />
                            </div>
                        </div>
                    </>
                )}

                {/* Type Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${type === 'video'
                        ? 'bg-purple-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                    {type === 'video' ? '🎥 Video' : '🖼️ Image'}
                </div>

                {/* Remove Button */}
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Remove file"
                >
                    ×
                </button>
            </div>

            {/* File Info */}
            <div className="mt-2 text-sm">
                <p className="font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-gray-500 text-xs">{fileSizeMB} MB</p>
            </div>
        </div>
    );
}
